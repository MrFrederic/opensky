from pydantic import BaseModel
from typing import Optional


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
