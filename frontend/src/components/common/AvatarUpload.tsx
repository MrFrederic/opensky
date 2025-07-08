import React, { useState, useRef } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  Typography,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users';
import { useToastContext } from '@/components/common/ToastProvider';
import { User } from '@/types';

interface AvatarUploadProps {
  user: User;
  size?: number;
  editable?: boolean;
  onAvatarUpdate?: (user: User) => void;
  currentUserId?: number; // Add this prop to distinguish admin vs self
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  user,
  size = 120,
  editable = true,
  onAvatarUpdate,
  currentUserId,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const toast = useToastContext();

  // Choose upload function based on context
  const uploadFn = (file: File) => {
    if (currentUserId && user.id !== currentUserId) {
      // Admin uploading for another user
      console.log(`Admin (${currentUserId}) uploading avatar for user ${user.id}`);
      return usersService.uploadAvatarForUser(user.id!, file);
    }
    // Self upload
    console.log(`User uploading own avatar (${user.id})`);
    return usersService.uploadAvatar(file);
  };

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: uploadFn,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Avatar updated successfully');
      onAvatarUpdate?.(updatedUser);
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(`Failed to upload avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsUploading(false);
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

    setIsUploading(true);
    uploadAvatarMutation.mutate(file);
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
          src={user.avatar_url}
          sx={{
            width: size,
            height: size,
            fontSize: size / 3,
            border: '3px solid',
            borderColor: 'background.paper',
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
          <Tooltip title="Upload new avatar">
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
      </Box>

      {editable && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          Click the camera icon to upload a new avatar
          <br />
          Max size: 10MB • Formats: JPG, PNG, GIF, WebP
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
