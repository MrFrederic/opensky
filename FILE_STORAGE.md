# File Storage Implementation

This implementation adds MinIO-based file storage to the Dropzone Management System. All file uploads are handled through MinIO (S3-compatible storage) and accessible via nginx proxy on port 80.

## Architecture

```
Frontend (port 80) → nginx → MinIO (internal:9000)
                          → Backend (internal:8000)
```

## URLs Structure

- **Frontend**: `http://localhost/`
- **API**: `http://localhost/api/`
- **Files**: `http://localhost/files/bucket-name/object-path`
- **MinIO Console** (dev only): `http://localhost/minio-console/`

## Backend Implementation

### Configuration (`app/core/config.py`)
```python
# MinIO settings
minio_endpoint: str = "localhost:9000"
minio_access_key: str = "minioadmin"
minio_secret_key: str = "minioadmin123"
minio_bucket_name: str = "dropzone-files"
minio_secure: bool = False
files_base_url: str = "http://localhost/files"
```

### File Storage Service (`app/core/storage.py`)
- `upload_file()` - Upload files with validation
- `delete_file()` - Delete files by URL
- `get_presigned_url()` - Generate secure access URLs

### API Endpoints (`app/api/v1/files.py`)
- `POST /api/files/upload/image` - Upload images (5MB limit)
- `POST /api/files/upload/document` - Upload documents (10MB limit)
- `POST /api/files/upload/multiple` - Upload multiple files
- `DELETE /api/files/file` - Delete a file

## Frontend Implementation

### File Service (`services/files.ts`)
```typescript
import { fileService } from '../services/files';

// Upload single image
const response = await fileService.uploadImage(file);

// Upload document
const response = await fileService.uploadDocument(file);

// Upload multiple files
const response = await fileService.uploadMultiple(files);

// Delete file
await fileService.deleteFile(fileUrl);
```

### React Component (`components/common/FileUpload.tsx`)
```tsx
import { FileUpload } from '../components/common/FileUpload';

<FileUpload
  onUpload={(response) => console.log('Uploaded:', response)}
  acceptedTypes="images" // or "documents" or "all"
  maxSizeMB={5}
  multiple={false}
/>
```

## File Types Supported

### Images
- JPEG, JPG, PNG, GIF, WebP
- Max size: 5MB (configurable)
- Stored in: `/images/` folder

### Documents  
- PDF, DOC, DOCX
- Max size: 10MB (configurable)
- Stored in: `/documents/` folder

## Usage Examples

### Basic Upload
```tsx
const handleUpload = (response: UploadResponse) => {
  console.log('File uploaded:', response.file_url);
  // Save URL to your model/database
};

<FileUpload onUpload={handleUpload} acceptedTypes="images" />
```

### Drag & Drop Multiple Files
```tsx
<FileUpload 
  onUpload={handleUpload}
  multiple={true}
  acceptedTypes="all"
  maxSizeMB={10}
/>
```

### Profile Picture Upload
```tsx
<FileUpload
  onUpload={(response) => updateUserAvatar(response.file_url)}
  acceptedTypes="images"
  maxSizeMB={2}
  multiple={false}
/>
```

### Upload Avatar via API
```typescript
import { usersService } from '../services/users';

const handleAvatarUpload = async (file: File) => {
  const updatedUser = await usersService.uploadAvatar(file);
  console.log('Avatar updated:', updatedUser.avatar_url);
};
```

### Avatar Upload Component
```tsx
import AvatarUpload from '@/components/common/AvatarUpload';

<AvatarUpload 
  user={user} 
  size={120}
  editable={true}
  onAvatarUpdate={(updatedUser) => {
    console.log('Avatar uploaded:', updatedUser.avatar_url);
  }}
/>
```

## Development Setup

1. **Start services**:
   ```bash
   docker-compose up
   ```

2. **Access MinIO Console** (development):
   - URL: http://localhost/minio-console/
   - User: `minioadmin`
   - Password: `minioadmin123`

3. **Test file upload**:
   - Go to http://localhost/ 
   - Navigate to file upload demo
   - Upload files and verify they appear in MinIO

## Telegram Avatar Integration

### Automatic Avatar Download
- **New Users**: When users authenticate via Telegram for the first time, their profile photo is automatically downloaded and stored in MinIO
- **Existing Users**: When users without an avatar log in via Telegram, their profile photo is automatically downloaded and saved
- **Storage Location**: Telegram avatars are stored in the `avatars/` folder in MinIO
- **Fallback**: If avatar download fails, authentication still proceeds normally

### Avatar Update Process
1. User authenticates via Telegram
2. System checks if user has an existing avatar
3. If no avatar exists and Telegram provides `photo_url`, the system:
   - Downloads the image from Telegram
   - Uploads it to MinIO bucket
   - Updates the user's `avatar_url` field
   - Continues with normal authentication

## File URL Format

Uploaded files are accessible at:
```
http://localhost/files/dropzone-files/images/uuid.jpg
http://localhost/files/dropzone-files/documents/uuid.pdf
```

## Telegram Avatar Integration

### Automatic Avatar Download
When users authenticate via Telegram, the system automatically:
1. **New Users**: Downloads and saves their Telegram profile photo during registration
2. **Existing Users**: If they don't have an avatar yet, downloads and saves their Telegram photo during login

### Avatar Storage
- Telegram avatars are automatically stored in the `/avatars/` folder in MinIO
- Images are validated and converted to supported formats (JPEG, PNG, WebP)
- If photo download fails, authentication still proceeds (error is logged)

### Manual Avatar Upload
Users can also upload new avatars manually via:
- **User Profile Page**: Click on user avatar in header to access `/profile`
- **Admin User Management**: Admins can upload avatars for any user in `/admin/users/:id`
- **API Endpoint**: Direct API calls to `/users/me/avatar`

### User Profile Access
- **Current User**: Click on your avatar in the header to access your profile at `/profile`
- **Admin Access**: Admins can access any user's profile via `/admin/users/:id`
- **Avatar Upload**: Available in both profile views with appropriate permissions

## Security Notes

- Files are publicly readable (good for images, avatars)
- Upload requires authentication
- File deletion requires authentication
- File types are validated on upload
- File size limits enforced

## Adding to Your Models

To store file URLs in your database models:

```python
# In your SQLAlchemy model
class User(Base):
    # ...existing fields...
    avatar_url: Optional[str] = Column(String, nullable=True)
    
class Equipment(Base):
    # ...existing fields...
    photo_url: Optional[str] = Column(String, nullable=True)
```

Then in your API:
```python
@router.post("/users/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Upload file
    file_url = file_storage.upload_file(file, folder="avatars", allowed_types=IMAGE_TYPES)
    
    # Update user record
    updated_user = user_crud.update_avatar(db, user=current_user, avatar_url=file_url)
    
    return updated_user
```

## Troubleshooting

### MinIO Connection Issues
- Check docker logs: `docker-compose logs minio`
- Verify environment variables in docker-compose.yml
- Ensure MinIO container is healthy

### File Upload Fails
- Check backend logs for detailed errors
- Verify file size and type restrictions
- Check authentication token

### Files Not Accessible
- Verify nginx proxy configuration
- Check MinIO bucket policy
- Ensure bucket exists and has correct permissions
