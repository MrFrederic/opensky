import React, { useState, useRef } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  Typography,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { PhotoCamera, Close } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { fileService } from '@/services/files';
import { useToastContext } from '@/components/common/ToastProvider';
import { User } from '@/types';

interface AvatarUploadProps {
  user: User;
  size?: number;
  editable?: boolean;
  onPhotoUrlChange?: (photoUrl: string | null) => void; // Callback to update form data
  stagedPhotoUrl?: string | null; // Photo URL staged for saving
  isUploading?: boolean; // External upload state
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  user,
  size = 120,
  editable = true,
  onPhotoUrlChange,
  stagedPhotoUrl,
  isUploading: externalUploading = false,
}) => {
  const [isLocalUploading, setIsLocalUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToastContext();

  const isUploading = externalUploading || isLocalUploading;

  // File upload mutation - only uploads file and returns URL
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const uploadResponse = await fileService.uploadImage(file);
      return uploadResponse.file_url;
    },
    onSuccess: (fileUrl) => {
      toast.success('Photo uploaded successfully. Click Save to update your profile.');
      onPhotoUrlChange?.(fileUrl);
      setIsLocalUploading(false);
    },
    onError: (error) => {
      toast.error(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLocalUploading(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB limit for avatars)
    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsLocalUploading(true);
    uploadFileMutation.mutate(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (lastName) {
      return lastName[0].toUpperCase();
    } else if (user.username) {
      return user.username[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 2 
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Avatar
          src={stagedPhotoUrl || user.photo_url}
          sx={{
            width: size,
            height: size,
            fontSize: size / 3,
            border: '3px solid',
            borderColor: stagedPhotoUrl ? 'warning.main' : 'background.paper',
            boxShadow: 2
          }}
        >
          {getInitials()}
        </Avatar>
        
        {isUploading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%'
            }}
          >
            <CircularProgress size={size / 4} sx={{ color: 'white' }} />
          </Box>
        )}

        {editable && (
          <Tooltip title="Upload new photo">
            <IconButton
              onClick={handleUploadClick}
              disabled={isUploading}
              sx={{
                position: 'absolute',
                bottom: -8,
                right: -8,
                backgroundColor: 'primary.main',
                color: 'white',
                width: 40,
                height: 40,
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                boxShadow: 2
              }}
            >
              <PhotoCamera fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {editable && stagedPhotoUrl && (
          <Tooltip title="Remove staged photo">
            <IconButton
              onClick={() => onPhotoUrlChange?.(null)}
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: 'error.main',
                color: 'white',
                width: 32,
                height: 32,
                '&:hover': {
                  backgroundColor: 'error.dark',
                },
                boxShadow: 2
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {editable && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          {stagedPhotoUrl ? (
            <>
              Click Save to update your avatar
            </>
          ) : (
            <>
              Max size: 10MB
            </>
          )}
        </Typography>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </Box>
  );
};

export default AvatarUpload;
