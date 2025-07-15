from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.models.enums import UserRole, Gender


# =============================================================================
# AUTHENTICATION SCHEMAS
# =============================================================================

class TokenResponse(BaseModel):
    """Response model for authentication tokens"""
    access_token: str
    token_type: str = "bearer"
    # Note: refresh token is set in HTTP-only cookie, not returned here


class TelegramAuthData(BaseModel):
    """Telegram authentication data from Telegram Login Widget"""
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str


class TelegramVerificationResponse(BaseModel):
    """Response model for Telegram verification"""
    temp_token: str
    user_status: str  # "new", "existing", "incomplete"
    expires_in: int  # seconds until expiry
    user_data: Optional[dict] = None  # Existing user data for prefilling


class RegistrationCompleteRequest(BaseModel):
    """Request model for completing registration"""
    temp_token: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    display_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    gender: Optional[Gender] = None
    photo_url: Optional[str] = None
    medical_clearance_date: Optional[date] = None
    starting_number_of_jumps: Optional[int] = 0
    roles: Optional[list[UserRole]] = None


class TokenExchangeRequest(BaseModel):
    """Request model for exchanging temp token for full access"""
    temp_token: str


class RegistrationStatusResponse(BaseModel):
    """Response model for registration status check"""
    registration_required: bool
    user_status: str  # "new", "existing", "incomplete"
    missing_fields: Optional[list[str]] = None
