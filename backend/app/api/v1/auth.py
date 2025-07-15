from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Cookie
from sqlalchemy.orm import Session
from typing import Optional, List
import logging
import json

from app.core.database import get_db
from app.core.security import create_access_token, create_temp_token, verify_token
from app.core.config import settings
from app.crud.users import user as user_crud
from app.crud.auth import refresh_token as refresh_token_crud
from app.crud.temp_tokens import temp_token as temp_token_crud
from app.schemas.users import UserCreate, UserUpdate, UserResponse
from app.schemas.auth import (
    TokenResponse, TelegramAuthData, TelegramVerificationResponse,
    RegistrationCompleteRequest, TokenExchangeRequest, RegistrationStatusResponse
)
from app.models.enums import UserRole
from app.models.users import User
from app.api.deps import get_current_user, get_temp_authenticated_user
from app.core.helpers import validate_telegram_auth_data

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/telegram-verify", response_model=TelegramVerificationResponse)
def telegram_verify(
    auth_data: TelegramAuthData,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Verify Telegram authentication data and return temporary token.
    Phase 1 of the two-phase authentication process.
    """
    # Validate Telegram auth data
    if not validate_telegram_auth_data(auth_data):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication data"
        )
    
    # Check if user exists
    users = user_crud.get_users(db, filters={"telegram_id": str(auth_data.id)})
    user = users[0] if users else None
    
    # Determine user status
    if not user:
        user_status = "new"
        # For new users, provide Telegram data for pre-filling
        user_data = {
            "first_name": auth_data.first_name,
            "last_name": auth_data.last_name or "",
            "username": auth_data.username,
            "photo_url": auth_data.photo_url,
        }
    elif not user.registration_completed:
        user_status = "incomplete"
        user_data = {
            "first_name": user.first_name,
            "middle_name": user.middle_name,
            "last_name": user.last_name,
            "display_name": user.display_name,
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "emergency_contact_name": user.emergency_contact_name,
            "emergency_contact_phone": user.emergency_contact_phone,
            "gender": user.gender.value if user.gender else None,
            "photo_url": user.photo_url,
            "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
            "medical_clearance_date": user.medical_clearance_date.isoformat() if user.medical_clearance_date else None,
            "starting_number_of_jumps": user.starting_number_of_jumps,
        }
    else:
        user_status = "existing"
        user_data = None
    
    # Create temporary token
    client_ip = request.client.host if request.client else None
    temp_token_str, temp_token_obj = temp_token_crud.create_temp_token(
        db, auth_data, client_ip, expires_minutes=30
    )
    
    logger.info(f"Telegram verification successful for user {auth_data.id} - Status: {user_status}")
    
    return TelegramVerificationResponse(
        temp_token=temp_token_str,
        user_status=user_status,
        expires_in=30 * 60,  # 30 minutes in seconds
        user_data=user_data
    )


@router.post("/complete-registration", response_model=TokenResponse)
def complete_registration(
    registration_data: RegistrationCompleteRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Complete user registration using temporary token.
    Phase 2 of the two-phase authentication process for new users.
    """
    # Validate temp token
    temp_token_obj = temp_token_crud.get_temp_token(db, registration_data.temp_token)
    if not temp_token_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired temporary token"
        )
    
    # Get Telegram data from temp token
    telegram_data = temp_token_crud.get_telegram_data_from_token(temp_token_obj)
    
    # Check if user already exists (shouldn't for new registration)
    users = user_crud.get_users(db, filters={"telegram_id": str(telegram_data.id)})
    if users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists. Use exchange-token endpoint instead."
        )
    
    # Create new user with complete profile
    user_create = UserCreate(
        telegram_id=str(telegram_data.id),
        first_name=registration_data.first_name,
        middle_name=registration_data.middle_name,
        last_name=registration_data.last_name,
        display_name=registration_data.display_name,
        date_of_birth=registration_data.date_of_birth,
        username=registration_data.username,
        email=registration_data.email,
        phone=registration_data.phone,
        emergency_contact_name=registration_data.emergency_contact_name,
        emergency_contact_phone=registration_data.emergency_contact_phone,
        gender=registration_data.gender,
        photo_url=registration_data.photo_url or telegram_data.photo_url,
        medical_clearance_date=registration_data.medical_clearance_date,
        starting_number_of_jumps=registration_data.starting_number_of_jumps or 0,
        registration_completed=True,
        roles=registration_data.roles or [UserRole.TANDEM_JUMPER]
    )
    
    user = user_crud.create(db, obj_in=user_create)
    
    # Mark temp token as used
    temp_token_crud.mark_token_used(db, temp_token_obj.id)
    
    # Create full access tokens
    access_token = create_access_token(data={"sub": user.telegram_id, "user_id": user.id})
    
    client_ip = request.client.host if request.client else None
    raw_refresh_token, _ = refresh_token_crud.create_refresh_token(
        db, user_id=user.id, client_ip=client_ip
    )
    
    # Set refresh token as HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=settings.environment.lower() != "development",
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 86400
    )
    
    logger.info(f"Registration completed for new user {user.id} ({user.username or user.first_name})")
    
    return TokenResponse(access_token=access_token)


@router.post("/exchange-token", response_model=TokenResponse)
def exchange_token(
    token_data: TokenExchangeRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Exchange temporary token for full access token.
    Used for existing users or completing incomplete profiles.
    """
    # Validate temp token
    temp_token_obj = temp_token_crud.get_temp_token(db, token_data.temp_token)
    if not temp_token_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired temporary token"
        )
    
    # Get Telegram data from temp token
    telegram_data = temp_token_crud.get_telegram_data_from_token(temp_token_obj)
    
    # Find existing user
    users = user_crud.get_users(db, filters={"telegram_id": str(telegram_data.id)})
    user = users[0] if users else None
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found. Use complete-registration endpoint instead."
        )
    
    # Update Telegram photo if user doesn't have one
    if not user.photo_url and telegram_data.photo_url:
        user_update = UserUpdate(photo_url=telegram_data.photo_url)
        user = user_crud.update(db=db, db_obj=user, obj_in=user_update)
    
    # Mark temp token as used
    temp_token_crud.mark_token_used(db, temp_token_obj.id)
    
    # Create full access tokens
    access_token = create_access_token(data={"sub": user.telegram_id, "user_id": user.id})
    
    client_ip = request.client.host if request.client else None
    raw_refresh_token, _ = refresh_token_crud.create_refresh_token(
        db, user_id=user.id, client_ip=client_ip
    )
    
    # Set refresh token as HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=settings.environment.lower() != "development",
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 86400
    )
    
    logger.info(f"Token exchange successful for user {user.id} ({user.username or user.first_name})")
    
    return TokenResponse(access_token=access_token)


@router.get("/registration-status", response_model=RegistrationStatusResponse)
def get_registration_status(
    temp_token_obj = Depends(get_temp_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Check if profile completion is needed for a temporary token.
    """
    # Get Telegram data from temp token
    telegram_data = temp_token_crud.get_telegram_data_from_token(temp_token_obj)
    
    # Check if user exists
    users = user_crud.get_users(db, filters={"telegram_id": str(telegram_data.id)})
    user = users[0] if users else None
    
    if not user:
        return RegistrationStatusResponse(
            registration_required=True,
            user_status="new",
            missing_fields=["all"]
        )
    elif not user.registration_completed:
        # Check for missing required fields
        missing_fields = []
        if not user.phone:
            missing_fields.append("phone")
        if not user.emergency_contact_name:
            missing_fields.append("emergency_contact_name")
        if not user.emergency_contact_phone:
            missing_fields.append("emergency_contact_phone")
        
        return RegistrationStatusResponse(
            registration_required=True,
            user_status="incomplete",
            missing_fields=missing_fields
        )
    else:
        return RegistrationStatusResponse(
            registration_required=False,
            user_status="existing"
        )


# Keep the old endpoint for backward compatibility (deprecated)
@router.post("/telegram-auth", response_model=TokenResponse)
def telegram_auth(
    auth_data: TelegramAuthData,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Legacy endpoint: Authenticate user with Telegram widget data and return JWT token.
    DEPRECATED: Use /telegram-verify followed by /complete-registration or /exchange-token
    """
    logger.warning("Using deprecated /telegram-auth endpoint")
    
    # Validate Telegram auth data
    if not validate_telegram_auth_data(auth_data):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication data"
        )
    
    # Get or create user (legacy behavior)
    users = user_crud.get_users(db, filters={"telegram_id": str(auth_data.id)})
    user = users[0] if users else None
    if not user:
        # Create new user with minimal data (legacy)
        user_create = UserCreate(
            telegram_id=str(auth_data.id),
            first_name=auth_data.first_name,
            last_name=auth_data.last_name or "",
            username=auth_data.username,
            photo_url=auth_data.photo_url,
            registration_completed=False,  # Mark as incomplete
            roles=[UserRole.TANDEM_JUMPER]
        )
        user = user_crud.create(db, obj_in=user_create)
    else:
        # For existing users, check if they have no avatar and Telegram provides one
        if not user.photo_url and auth_data.photo_url:
            user_update = UserUpdate(photo_url=auth_data.photo_url)
            user = user_crud.update(db=db, db_obj=user, obj_in=user_update)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.telegram_id, "user_id": user.id})
    
    # Create refresh token
    client_ip = request.client.host if request.client else None
    raw_refresh_token, _ = refresh_token_crud.create_refresh_token(
        db, user_id=user.id, client_ip=client_ip
    )
    
    # Set refresh token as HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=settings.environment.lower() != "development",
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 86400
    )
    
    return TokenResponse(access_token=access_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token_endpoint(
    response: Response,
    request: Request,
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token from HTTP-only cookie.
    Returns a new access token and sets a new refresh token cookie.
    """
    if not refresh_token:
        logger.warning(f"Refresh token request from {request.client.host if request.client else 'unknown'} without token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token"
        )
    
    # Validate refresh token and get user_id from it
    # We'll try to find the token in our database first
    db_token = refresh_token_crud.find_valid_refresh_token(db, token=refresh_token)
    if not db_token:
        logger.warning(f"Invalid refresh token attempt from {request.client.host if request.client else 'unknown'}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Get user from the refresh token's user_id
    user = user_crud.get(db, id=db_token.user_id)
    if not user:
        logger.error(f"Refresh token valid but user {db_token.user_id} not found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    logger.info(f"Token refresh successful for user {user.id} ({user.username or user.first_name})")
    
    # Create new access token
    access_token = create_access_token(data={"sub": user.telegram_id, "user_id": user.id})
    
    # Implement refresh token rotation for enhanced security
    # Revoke old token
    refresh_token_crud.revoke_token(db, token_id=db_token.id)
    
    # Create new refresh token
    client_ip = request.client.host if request.client else None
    new_refresh_token, _ = refresh_token_crud.create_refresh_token(
        db, 
        user_id=user.id, 
        client_ip=client_ip
    )
    
    # Set new refresh token as HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=settings.environment.lower() != "development",
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 86400
    )
    
    return TokenResponse(access_token=access_token)

@router.post("/logout")
def logout(
    response: Response,
    request: Request,
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    """
    Logout user by clearing refresh token cookie and revoking the token in the database.
    """
    # Clear the refresh token cookie
    response.delete_cookie(key="refresh_token")
    
    # If we have a refresh token, try to revoke it in the database
    if refresh_token:
        try:
            db_token = refresh_token_crud.find_valid_refresh_token(db, token=refresh_token)
            if db_token:
                refresh_token_crud.revoke_token(db, token_id=db_token.id)
                logger.info(f"Logout: revoked refresh token for user {db_token.user_id}")
        except Exception as e:
            # Log the error but don't fail the logout
            logger.warning(f"Failed to revoke refresh token during logout: {e}")
    
    return {"detail": "Successfully logged out"}

@router.post("/logout-all", status_code=status.HTTP_200_OK)
def logout_all_devices(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout from all devices by revoking all refresh tokens for the user
    and clearing the current refresh token cookie.
    """
    # Revoke all refresh tokens for this user
    refresh_token_crud.revoke_all_user_tokens(db, user_id=current_user.id)
    
    # Clear current refresh token cookie
    response.delete_cookie(key="refresh_token")
    
    return {"detail": "Logged out from all devices"}
