from typing import Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import hashlib
from app.models.auth import RefreshToken
from app.core.config import settings
from app.core.security import create_refresh_token


class CRUDRefreshToken:
    def create_refresh_token(
        self, db: Session, *, user_id: int, client_ip: Optional[str] = None
    ) -> Tuple[str, RefreshToken]:
        """
        Create and store a new refresh token for a user
        Returns the raw token (for the client) and the database record
        """
        # Calculate expiration time
        expires_delta = timedelta(days=settings.refresh_token_expire_days)
        expires_at = datetime.utcnow() + expires_delta
        
        # Generate token
        raw_token, hashed_token = create_refresh_token(user_id)
        
        # Create database record with hashed token
        db_token = RefreshToken(
            token=hashed_token,
            user_id=user_id,
            expires_at=expires_at,
            created_ip=client_ip
        )
        
        db.add(db_token)
        db.commit()
        db.refresh(db_token)
        
        return raw_token, db_token
    
    def validate_refresh_token(self, db: Session, *, token: str, user_id: int) -> Optional[RefreshToken]:
        """
        Validate a refresh token for a specific user
        Returns the token record if valid, None otherwise
        """
        # Hash the provided token to compare with stored hash
        hashed_token = hashlib.sha256(token.encode()).hexdigest()
        
        # Find and validate token
        db_token = (
            db.query(RefreshToken)
            .filter(
                RefreshToken.token == hashed_token,
                RefreshToken.user_id == user_id,
                RefreshToken.expires_at > datetime.utcnow(),
                RefreshToken.revoked == False
            )
            .first()
        )
        
        return db_token
    
    def find_valid_refresh_token(self, db: Session, *, token: str) -> Optional[RefreshToken]:
        """
        Find a valid refresh token without requiring user_id
        Returns the token record if valid, None otherwise
        """
        # Hash the provided token to compare with stored hash
        hashed_token = hashlib.sha256(token.encode()).hexdigest()
        
        # Find and validate token across all users
        db_token = (
            db.query(RefreshToken)
            .filter(
                RefreshToken.token == hashed_token,
                RefreshToken.expires_at > datetime.utcnow(),
                RefreshToken.revoked == False
            )
            .first()
        )
        
        return db_token
    
    def revoke_token(self, db: Session, *, token_id: int) -> RefreshToken:
        """Revoke a specific refresh token"""
        db_token = db.query(RefreshToken).filter(RefreshToken.id == token_id).first()
        if db_token:
            db_token.revoked = True
            db.add(db_token)
            db.commit()
            db.refresh(db_token)
        return db_token
    
    def revoke_all_user_tokens(self, db: Session, *, user_id: int) -> int:
        """Revoke all refresh tokens for a specific user"""
        result = (
            db.query(RefreshToken)
            .filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked == False,
                RefreshToken.expires_at > datetime.utcnow()
            )
            .update({"revoked": True})
        )
        db.commit()
        return result
    
    def clean_expired_tokens(self, db: Session) -> int:
        """Delete expired tokens from the database"""
        result = (
            db.query(RefreshToken)
            .filter(RefreshToken.expires_at < datetime.utcnow())
            .delete()
        )
        db.commit()
        return result


refresh_token = CRUDRefreshToken()
