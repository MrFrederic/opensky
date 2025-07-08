"""
File upload API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPBearer
from app.core.storage import file_storage
from app.api.deps import get_current_user
from app.models import User
from typing import List

router = APIRouter()
security = HTTPBearer()

# Allowed image types for profile photos, etc.
IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]

# Allowed document types
DOCUMENT_TYPES = [
    "application/pdf", 
    "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]


@router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload an image file (photos, avatars, etc.)"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size (10MB limit for images)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    
    try:
        file_url = file_storage.upload_file(
            file=file,
            folder="images",
            allowed_types=IMAGE_TYPES
        )
        
        return {
            "success": True,
            "file_url": file_url,
            "filename": file.filename,
            "content_type": file.content_type,
            "size": file.size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a document file (PDFs, Word docs, etc.)"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size (10MB limit for documents)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    
    try:
        file_url = file_storage.upload_file(
            file=file,
            folder="documents",
            allowed_types=DOCUMENT_TYPES
        )
        
        return {
            "success": True,
            "file_url": file_url,
            "filename": file.filename,
            "content_type": file.content_type,
            "size": file.size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload multiple files at once"""
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files allowed")
    
    results = []
    errors = []
    
    for file in files:
        try:
            if not file.filename:
                errors.append({"filename": "unknown", "error": "No filename provided"})
                continue
            
            # Determine folder based on content type
            folder = "images" if file.content_type in IMAGE_TYPES else "documents"
            allowed_types = IMAGE_TYPES if file.content_type in IMAGE_TYPES else DOCUMENT_TYPES
            
            # Check file size
            max_size = 10 * 1024 * 1024  # 10MB for all files
            if file.size and file.size > max_size:
                errors.append({
                    "filename": file.filename, 
                    "error": f"File too large. Maximum size is {max_size // (1024*1024)}MB"
                })
                continue
            
            file_url = file_storage.upload_file(
                file=file,
                folder=folder,
                allowed_types=allowed_types
            )
            
            results.append({
                "success": True,
                "file_url": file_url,
                "filename": file.filename,
                "content_type": file.content_type,
                "size": file.size
            })
            
        except Exception as e:
            errors.append({"filename": file.filename, "error": str(e)})
    
    return {
        "uploaded": results,
        "errors": errors,
        "total_uploaded": len(results),
        "total_errors": len(errors)
    }


@router.delete("/file")
async def delete_file(
    file_url: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a file by its URL"""
    try:
        success = file_storage.delete_file(file_url)
        if success:
            return {"success": True, "message": "File deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="File not found or already deleted")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
