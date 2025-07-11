import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Paper,
  Box,
  Alert,
  Skeleton,
  IconButton,
  Tab,
  Tabs,
  Grid,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

import { UserRole } from '@/types';
import { useToastContext } from '@/components/common/ToastProvider';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useAuthStore } from '@/stores/auth';
import { usersService } from '@/services/users';
import UserInfoCard from '@/components/admin/UserInfoCard';
import UserForm, { UserFormData } from '@/components/admin/UserForm';
import { getUserRoles, processFieldValue, userToFormData } from '@/utils/userManagement';

const AdminUserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToastContext();
  const { user: currentUser } = useAuthStore();

  const targetUserId = Number(id);

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    first_name: '',
    middle_name: '',
    last_name: '',
    display_name: '',
    date_of_birth: '',
    username: '',
    email: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    gender: undefined,
    telegram_id: '',
    medical_clearance_date: '',
    medical_clearance_is_confirmed: false,
    is_active: true,
  });

  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stagedPhotoUrl, setStagedPhotoUrl] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Fetch user data
  const userQuery = useQuery({
    queryKey: ['user', targetUserId],
    queryFn: () => usersService.getUser(targetUserId),
    enabled: !!targetUserId,
  });

  const user = userQuery.data;

  // Permission checks
  const canDeleteUser = currentUser && user && currentUser.id !== user.id;
  const canEditRoles = currentUser?.roles?.some(r => r.role === UserRole.ADMINISTRATOR);

  // Track unsaved changes
  const { hasUnsavedChanges, resetUnsavedChanges } = useUnsavedChanges({
    originalData: user ? { ...userToFormData(user), roles: getUserRoles(user) } : null,
    currentData: { ...formData, roles: selectedRoles },
    additionalChanges: [stagedPhotoUrl],
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setFormData(userToFormData(user));
      setSelectedRoles(getUserRoles(user));
    }
  }, [user]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data: { userData: any; roles: UserRole[] }) => {
      const updateData = { ...data.userData };
      if (canEditRoles) {
        updateData.roles = data.roles;
      }
      return usersService.updateUser(targetUserId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', targetUserId] });
      toast.success('User updated successfully');
      setStagedPhotoUrl(null);
      resetUnsavedChanges();
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: () => usersService.deleteUser(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
      navigate('/admin/users');
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSave = async () => {
    try {
      if (selectedRoles.length === 0) {
        setErrors({ roles: 'At least one role must be selected' });
        return;
      }

      setErrors({});

      const dataToSave = { ...formData };
      if (stagedPhotoUrl) {
        dataToSave.photo_url = stagedPhotoUrl;
      }

      await updateUserMutation.mutateAsync({ userData: dataToSave, roles: selectedRoles });
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUserMutation.mutateAsync();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleBack = () => {
    navigate('/admin/users');
  };

  if (userQuery.isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="25%" height={40} sx={{ mb: 2 }} />
        <Paper sx={{ p: 3, height: '60vh' }}>
          <Skeleton variant="rectangular" width="100%" height="100%" />
        </Paper>
      </Box>
    );
  }

  if (userQuery.error || !user) {
    return (
      <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="error">
          {userQuery.error
            ? `Error loading user: ${userQuery.error instanceof Error ? userQuery.error.message : 'Unknown error'}`
            : 'User not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        height: '100%',
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Main content */}
      <Box sx={{ flex: 1, overflow: 'visible' }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Row 1: Back button | Tabs */}
          <Grid item xs={12} md={4} lg={3}>
            {/* Back Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <IconButton onClick={handleBack} size="small">
                <ArrowBack />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12} md={8} lg={9}>
            {/* Tabs */}
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="user detail tabs" sx={{ mb: 2 }}>
              <Tab label="Info" id="user-tab-0" aria-controls="user-tabpanel-0" />
            </Tabs>
          </Grid>

          {/* Row 2: User Card | Tab Content */}
          <Grid item xs={12} md={4} lg={3}>
            {/* User Info Card */}
            <UserInfoCard
              user={user}
              canDelete={!!canDeleteUser}
              stagedPhotoUrl={stagedPhotoUrl}
              onPhotoUrlChange={(photoUrl) => {
                setStagedPhotoUrl(photoUrl);
              }}
              onDelete={handleDelete}
              isDeleting={deleteUserMutation.isPending}
            />
          </Grid>

          {/* User Form */}
          <Grid item xs={12} md={8} lg={9} sx={{ height: '100%' }}>
            <UserForm
              formData={formData}
              selectedRoles={selectedRoles}
              errors={errors}
              canEditRoles={canEditRoles}
              showAdminFields={true}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={updateUserMutation.isPending}
              onInputChange={handleInputChange}
              onRoleToggle={handleRoleToggle}
              onSave={handleSave}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminUserDetails;
