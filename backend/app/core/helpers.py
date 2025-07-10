import hashlib
import hmac
import time
from app.core.config import settings
from app.schemas.auth import TelegramAuthData


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