import secrets
import json
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.users import TemporaryToken
from app.schemas.auth import TelegramAuthData


class TemporaryTokenCRUD:
    
    def create_temp_token(
        self, 
        db: Session, 
        telegram_data: TelegramAuthData,
        client_ip: Optional[str] = None,
        expires_minutes: int = 30
    ) -> tuple[str, TemporaryToken]:
        """Create a new temporary token"""
        # Generate a secure random token
        token = secrets.token_urlsafe(32)
        
        # Calculate expiry time
        expires_at = datetime.utcnow() + timedelta(minutes=expires_minutes)
        
        # Store Telegram data as JSON
        telegram_json = json.dumps(telegram_data.model_dump())
        
        # Create the temporary token record
        db_token = TemporaryToken(
            token=token,
            telegram_id=str(telegram_data.id),
            telegram_data=telegram_json,
            expires_at=expires_at,
            client_ip=client_ip
        )
        
        db.add(db_token)
        db.commit()
        db.refresh(db_token)
        
        return token, db_token
    
    def get_temp_token(self, db: Session, token: str) -> Optional[TemporaryToken]:
        """Get a temporary token by token string"""
        return db.query(TemporaryToken).filter(
            TemporaryToken.token == token,
            TemporaryToken.is_used == False,
            TemporaryToken.expires_at > datetime.utcnow()
        ).first()
    
    def mark_token_used(self, db: Session, token_id: int) -> bool:
        """Mark a temporary token as used"""
        db_token = db.query(TemporaryToken).filter(TemporaryToken.id == token_id).first()
        if db_token:
            db_token.is_used = True
            db.commit()
            return True
        return False
    
    def cleanup_expired_tokens(self, db: Session) -> int:
        """Remove expired temporary tokens"""
        deleted = db.query(TemporaryToken).filter(
            TemporaryToken.expires_at <= datetime.utcnow()
        ).delete()
        db.commit()
        return deleted
    
    def get_telegram_data_from_token(self, db_token: TemporaryToken) -> TelegramAuthData:
        """Extract Telegram data from a temporary token"""
        data = json.loads(db_token.telegram_data)
        return TelegramAuthData(**data)


# Create singleton instance
temp_token = TemporaryTokenCRUD()
