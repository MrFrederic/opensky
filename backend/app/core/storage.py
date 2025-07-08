"""
File storage service using MinIO (S3-compatible storage)
"""
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile, HTTPException
from app.core.config import settings
import uuid
import logging
from typing import Optional
from urllib.parse import urlparse
import os

logger = logging.getLogger(__name__)


class FileStorageService:
    def __init__(self):
        self.client = Minio(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure
        )
        self.bucket_name = settings.minio_bucket_name
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Error creating bucket: {e}")
            raise HTTPException(status_code=500, detail="Storage initialization failed")
    
    def upload_file(
        self, 
        file: UploadFile, 
        folder: str = "uploads",
        allowed_types: Optional[list] = None
    ) -> str:
        """
        Upload a file and return the file URL
        
        Args:
            file: FastAPI UploadFile object
            folder: Folder within bucket to store file
            allowed_types: List of allowed MIME types (e.g., ['image/jpeg', 'image/png'])
        
        Returns:
            Public URL to access the file
        """
        if allowed_types and file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file.content_type} not allowed. Allowed types: {allowed_types}"
            )
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        object_name = f"{folder}/{unique_filename}"
        
        try:
            # Upload file
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=file.file,
                length=file.size or -1,
                content_type=file.content_type
            )
            
            # Return public URL
            return f"{settings.files_base_url}/{self.bucket_name}/{object_name}"
            
        except S3Error as e:
            logger.error(f"Error uploading file: {e}")
            raise HTTPException(status_code=500, detail="File upload failed")
        finally:
            file.file.close()
    
    def delete_file(self, file_url: str) -> bool:
        """
        Delete a file using its URL
        
        Args:
            file_url: The full URL of the file to delete
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Extract object name from URL
            parsed_url = urlparse(file_url)
            # Remove /files/ prefix and bucket name from path
            path_parts = parsed_url.path.strip('/').split('/')
            if len(path_parts) >= 2 and path_parts[0] == 'files':
                object_name = '/'.join(path_parts[2:])  # Skip 'files' and bucket name
                
                self.client.remove_object(self.bucket_name, object_name)
                return True
        except S3Error as e:
            logger.error(f"Error deleting file: {e}")
        return False
    
    def get_presigned_url(self, object_name: str, expires_hours: int = 1) -> str:
        """
        Generate a presigned URL for secure file access
        
        Args:
            object_name: The object name in the bucket
            expires_hours: How many hours the URL should be valid
        
        Returns:
            Presigned URL
        """
        try:
            from datetime import timedelta
            return self.client.presigned_get_object(
                self.bucket_name, 
                object_name, 
                expires=timedelta(hours=expires_hours)
            )
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate file access URL")


# Global instance
file_storage = FileStorageService()
