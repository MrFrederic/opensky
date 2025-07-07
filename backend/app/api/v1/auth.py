from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Cookie
from sqlalchemy.orm import Session
from typing import Optional
import hashlib
import hmac
import time
import logging

from app.core.database import get_db
from app.core.security import create_access_token, verify_token
from app.core.config import settings
from app.crud.users import user as user_crud
from app.crud.auth import refresh_token as refresh_token_crud
from app.schemas.users import UserCreate, UserResponse, TokenResponse, TelegramAuthData, TokenData
from app.schemas.settings import BotUsername
from app.models.base import UserStatus, User
from app.api.deps import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


def validate_telegram_auth_data(auth_data: TelegramAuthData) -> bool:
    """
    Validate Telegram auth data by checking the hash.
    """
    # Check if auth_date is not older than 24h
    now = time.time()
    auth_time = auth_data.auth_date
    if now - auth_time > 86400:  # 24 hours
        return False
    
    # Collect all fields except hash
    data_check_arr = []
    for key, value in auth_data.model_dump(exclude={"hash"}).items():
        if value is not None:
            data_check_arr.append(f"{key}={value}")
    
    data_check_string = "\n".join(sorted(data_check_arr))
    
    # Create secret key from bot token
    if not settings.telegram_bot_token:
        # For development, allow bypass if token not set
        return True
        
    secret_key = hashlib.sha256(settings.telegram_bot_token.encode()).digest()
    
    # Generate hash and compare
    computed_hash = hmac.new(
        secret_key, 
        data_check_string.encode(), 
        hashlib.sha256
    ).hexdigest()
    
    return computed_hash == auth_data.hash


@router.post("/telegram-auth", response_model=TokenResponse)
def telegram_auth(
    auth_data: TelegramAuthData,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Authenticate user with Telegram widget data and return JWT token.
    Access token is returned in response body, refresh token is set as HTTP-only cookie.
    """
    # Validate Telegram auth data
    if not validate_telegram_auth_data(auth_data):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication data"
        )
    
    # Get or create user
    user = user_crud.get_by_telegram_id(db, telegram_id=str(auth_data.id))
    
    if not user:
        # Create new user
        user_create = UserCreate(
            telegram_id=str(auth_data.id),
            first_name=auth_data.first_name,
            last_name=auth_data.last_name or "",
            username=auth_data.username,
            status=UserStatus.NEWBY
        )
        user = user_crud.create(db, obj_in=user_create)
    
    # Create access token with short lifespan
    access_token = create_access_token(data={"sub": user.telegram_id, "user_id": user.id})
    
    # Create refresh token with longer lifespan
    client_ip = request.client.host if request.client else None
    raw_refresh_token, _ = refresh_token_crud.create_refresh_token(
        db, 
        user_id=user.id, 
        client_ip=client_ip
    )
    
    # Set refresh token as HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=settings.environment.lower() != "development",  # Secure in production
        samesite="lax",  # Strict in production
        max_age=settings.refresh_token_expire_days * 86400  # days to seconds
    )
    
    return TokenResponse(access_token=access_token)

@router.get("/telegram-auth/bot", response_model=BotUsername)
def get_bot_username():
    """
    Get the Telegram bot username from the settings to generate auth widget.
    """
    if not settings.telegram_bot_username:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Telegram bot username is not configured"
        )
    
    return BotUsername(username=settings.telegram_bot_username)

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
