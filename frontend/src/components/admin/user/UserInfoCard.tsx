import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Delete, ErrorOutline as AlertTriangle } from '@mui/icons-material';
import { User } from '@/types';
import { formatDateConsistent } from '@/lib/utils';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import { getRoleDisplayName } from '@/utils/userManagement';


interface UserInfoCardProps {
  user: User;
  canDelete?: boolean;
  stagedPhotoUrl?: string | null;
  isPhotoUploading?: boolean;
  onPhotoUrlChange?: (photoUrl: string | null) => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({
  user,
  canDelete = false,
  stagedPhotoUrl,
  isPhotoUploading = false,
  onPhotoUrlChange,
  onDelete,
  isDeleting = false,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete?.();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Paper sx={{ p: 3, height: 'fit-content' }}>
        {/* Avatar */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <AvatarUpload
            user={user}
            size={100}
            editable={true}
            stagedPhotoUrl={stagedPhotoUrl}
            isUploading={isPhotoUploading}
            onPhotoUrlChange={onPhotoUrlChange}
          />
        </Box>

        {/* Quick Info */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {user.display_name || `${user.first_name} ${user.last_name}`}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {user.username && `@${user.username}`}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {user.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {user.id}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Roles */}
        {user.roles && user.roles.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Roles:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {user.roles.map((r) => (
                <Chip
                  key={r.role}
                  label={getRoleDisplayName(r.role)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Status */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Status: {user.is_active ?
              <Chip label="Active" color="success" size="small" /> :
              <Chip label="Inactive" color="error" size="small" />
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Medical: {user.medical_clearance_is_confirmed ?
              <Chip label="Cleared" color="success" size="small" /> :
              <Chip label="Not Cleared" color="error" size="small" />
            }
          </Typography>
        </Box>

        {/* System Info */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Created:</strong> {user.created_at ? formatDateConsistent(user.created_at) : 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Updated:</strong> {user.updated_at ? formatDateConsistent(user.updated_at) : 'N/A'}
          </Typography>
        </Box>

        {/* Delete Button */}
        {canDelete && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              fullWidth
              startIcon={<Delete />}
              onClick={handleDeleteClick}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AlertTriangle color="error" />
            <Typography variant="h6">Delete User</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            User: {user.first_name} {user.last_name} ({user.username || user.email})
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            color="error"
            variant="contained"
          >
            {isDeleting ? 'Deleting...' : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserInfoCard;
