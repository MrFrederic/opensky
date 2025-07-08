import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Box,
  Button,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  IconButton,
} from '@mui/material';
import { ErrorOutline as AlertTriangle } from '@mui/icons-material';
import { ArrowBack, Edit, Delete, Check, Close } from '@mui/icons-material';

import { User, UserRole } from '@/types';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/auth';
import { usersService } from '@/services/users';
import { AdminOnly } from '@/components/auth/RoleGuard';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import UserForm, { UserFormData } from '@/components/admin/UserForm';
import { getUserRoles, processFieldValue, userToFormData, getRoleDisplayName } from '@/utils/userManagement';

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user: currentUser, logout } = useAuthStore();

  // Determine if this is current user's profile or admin viewing another user
  const isCurrentUserProfile = !id; // /profile route has no id parameter
  const targetUserId = isCurrentUserProfile ? currentUser?.id : Number(id);

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    license_document_url: '',
  });

  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch user data
  const userQuery = useQuery({
    queryKey: ['user', targetUserId],
    queryFn: () => isCurrentUserProfile ? 
      authService.getCurrentUser() : 
      usersService.getUser(Number(targetUserId)),
    enabled: !!targetUserId,
  });

  // Handle query errors with toast
  useEffect(() => {
    if (userQuery.error && userQuery.error instanceof Error) {
      toast.error(`Error loading user: ${userQuery.error.message}`);
    }
  }, [userQuery.error, toast]);

  const user = userQuery.data;

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setFormData(userToFormData(user));
      setSelectedRoles(getUserRoles(user));
    }
  }, [user]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data: { userData: Partial<User>; roles: UserRole[] }) => {
      return isCurrentUserProfile ? 
        authService.updateCurrentUser(data.userData) :
        usersService.updateUser(Number(targetUserId), data.userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', targetUserId] });
      if (isCurrentUserProfile) {
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      }
      toast.success('User updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Update user roles mutation (admin only)
  const updateRolesMutation = useMutation({
    mutationFn: (roles: UserRole[]) => usersService.updateUserRoles(Number(targetUserId), roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', targetUserId] });
      toast.success('User roles updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update user roles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Delete user mutation (admin only)
  const deleteUserMutation = useMutation({
    mutationFn: () => usersService.deleteUser(Number(targetUserId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
      // If the deleted user is the current user, log them out
      if (currentUser && currentUser.id === Number(targetUserId)) {
        logout();
        navigate('/');
      } else {
        navigate('/admin/users');
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = processFieldValue(name, value);
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSave = async () => {
    try {
      // Validate form
      if (selectedRoles.length === 0) {
        setErrors({ roles: 'At least one role must be selected' });
        return;
      }
      
      // Clear errors
      setErrors({});
      
      // Prepare data for saving
      const dataToSave = {
        ...formData,
        username: formData.username
      };
      
      await updateUserMutation.mutateAsync({ userData: dataToSave, roles: selectedRoles });
      
      // Update roles if they changed
      if (user && JSON.stringify(getUserRoles(user)) !== JSON.stringify(selectedRoles)) {
        await updateRolesMutation.mutateAsync(selectedRoles);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUserMutation.mutateAsync();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleBack = () => {
    if (isCurrentUserProfile) {
      navigate('/');
    } else {
      navigate('/admin/users');
    }
  };

  const canDeleteUser = !isCurrentUserProfile && currentUser && user && currentUser.id !== user.id;
  const canEditRoles = !isCurrentUserProfile && currentUser?.roles?.some(r => r.role === UserRole.ADMINISTRATOR);

  const loading = userQuery.isLoading;
  const error = userQuery.error;

  const renderActionButtons = () => (
    <Box display="flex" justifyContent="flex-end" gap={1}>
      {!isEditing ? (
        <>
          <Button 
            variant="outlined" 
            startIcon={<Edit />} 
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
          {canDeleteUser && (
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<Delete />} 
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </Button>
          )}
        </>
      ) : (
        <>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<Close />} 
            onClick={() => {
              setIsEditing(false);
              if (user) {
                setFormData(userToFormData(user));
                setSelectedRoles(getUserRoles(user));
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Check />}
            onClick={handleSave}
            disabled={updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </>
      )}
    </Box>
  );

  const renderPageHeader = () => (
    <Box mb={4}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <IconButton onClick={handleBack} size="small">
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isCurrentUserProfile ? 'My Profile' : user ? `${user.first_name} ${user.last_name}` : 'User Profile'}
        </Typography>
      </Box>
      
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        {user && (
          <Typography color="text.secondary">
            {user.roles?.map((r: { role: UserRole }) => r.role).map((role: UserRole) => (
              <Typography component="span" key={role} sx={{
                backgroundColor: 'action.selected',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                mr: 1,
                display: 'inline-block',
                fontSize: '0.8rem',
                mb: 1
              }}>
                {getRoleDisplayName(role)}
              </Typography>
            ))}
          </Typography>
        )}
        
        {user && renderActionButtons()}
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {!isCurrentUserProfile && !currentUser?.roles?.some(r => r.role === UserRole.ADMINISTRATOR) ? (
        <AdminOnly fallback={
          <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You need administrator privileges to access this page.
            </Typography>
          </Container>
        }>
          {renderPageHeader()}
        </AdminOnly>
      ) : (
        <>
          {renderPageHeader()}

          {/* Loading State */}
          {loading && (
            <Paper sx={{ p: 3 }}>
              <Skeleton variant="text" width="25%" height={32} sx={{ mb: 2 }} />
              <Box display="flex" flexDirection="column" gap={1}>
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="75%" />
                <Skeleton variant="text" width="50%" />
              </Box>
            </Paper>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Error loading user: {error instanceof Error ? error.message : 'Unknown error'}
            </Alert>
          )}

          {/* User not found */}
          {!loading && !error && !user && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                User not found
              </Typography>
            </Paper>
          )}

          {/* User Form */}
          {user && (
            <Paper elevation={2}>
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" component="h2">
                  Personal Information
                </Typography>
              </Box>
              
              <Box sx={{ p: 3 }}>
                {/* Avatar Upload */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                  <AvatarUpload 
                    user={user} 
                    size={120}
                    editable={isEditing}
                    currentUserId={currentUser?.id}
                    onAvatarUpdate={(updatedUser) => {
                      queryClient.setQueryData(['user', targetUserId], updatedUser);
                    }}
                  />
                </Box>
                
                {/* User Form Component */}
                <UserForm 
                  formData={formData}
                  selectedRoles={selectedRoles}
                  errors={errors}
                  isEditing={isEditing}
                  canEditRoles={canEditRoles}
                  onInputChange={handleInputChange}
                  onRoleToggle={handleRoleToggle}
                />

                {/* System Information */}
                {user && (
                  <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      System Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {user.created_at && (
                        <Typography variant="body2">
                          <strong>Created:</strong> {new Date(user.created_at).toLocaleString()}
                        </Typography>
                      )}
                      {user.updated_at && (
                        <Typography variant="body2">
                          <strong>Last Updated:</strong> {new Date(user.updated_at).toLocaleString()}
                        </Typography>
                      )}
                      {user.id && (
                        <Typography variant="body2">
                          <strong>User ID:</strong> {user.id}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          )}

          {/* Error Messages */}
          {(updateUserMutation.error || updateRolesMutation.error || deleteUserMutation.error) && (
            <Alert severity="error" sx={{ mt: 3 }}>
              Error: {updateUserMutation.error?.message || updateRolesMutation.error?.message || deleteUserMutation.error?.message}
            </Alert>
          )}

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
              {user && (
                <Typography variant="body2" fontWeight="medium">
                  User: {user.first_name} {user.last_name} ({user.username || user.email || user.telegram_id})
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteUserMutation.isPending}
                color="error"
                variant="contained"
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Container>
  );
};

export default UserProfile;
