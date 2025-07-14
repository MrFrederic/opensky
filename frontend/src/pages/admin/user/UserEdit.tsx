import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Container,
} from '@mui/material';
import { 
  ArrowBack,
} from '@mui/icons-material';

import { UserRole } from '@/types';
import { useToastContext } from '@/components/common/ToastProvider';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useAuthStore } from '@/stores/auth';
import { usersService } from '@/services/users';
import UserInfoCard from '@/components/admin/user/UserInfoCard';
import UserForm, { UserFormData } from '@/components/admin/user/UserForm';
import { getUserRoles, processFieldValue, userToFormData, validateUserForm } from '@/utils/userManagement';
import { cleanUserFormData } from '@/lib/form-utils';

const AdminUserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const toast = useToastContext();
  const { user: currentUser } = useAuthStore();

  // Determine if we're creating a new user
  const isCreating = location.pathname.endsWith('/new') || id === 'new';
  const targetUserId = isCreating ? undefined : Number(id);

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
    telegram_id: isCreating ? '' : undefined, // Optional for new users
    photo_url: '',
    medical_clearance_date: '',
    medical_clearance_is_confirmed: false,
    is_active: true,
  });

  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(
    isCreating ? [UserRole.TANDEM_JUMPER] : []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stagedPhotoUrl, setStagedPhotoUrl] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Fetch user data
  const userQuery = useQuery({
    queryKey: ['user', targetUserId],
    queryFn: () => usersService.getUser(targetUserId!),
    enabled: !isCreating && !!targetUserId,
  });

  const user = userQuery.data;

  // Permission checks
  const canDeleteUser = !isCreating && currentUser && user && currentUser.id !== user.id;
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
      return usersService.updateUser(targetUserId!, updateData);
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

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: usersService.createUser,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      navigate(`/admin/users/${user.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: () => usersService.deleteUser(targetUserId!),
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

      if (isCreating) {
        // Validate form for creation
        const validationErrors = validateUserForm(formData, selectedRoles);
        
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }

        // Clean and transform formData to API format for creation
        const userData = cleanUserFormData({
          ...formData,
          roles: selectedRoles,
        });
        
        await createUserMutation.mutateAsync(userData);
      } else {
        // Clean form data for update
        const dataToSave = cleanUserFormData(formData);
        if (stagedPhotoUrl) {
          dataToSave.photo_url = stagedPhotoUrl;
        }
        await updateUserMutation.mutateAsync({ userData: dataToSave, roles: selectedRoles });
      }
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

  if (userQuery.isLoading && !isCreating) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="25%" height={40} sx={{ mb: 2 }} />
        <Paper sx={{ p: 3, height: '60vh' }}>
          <Skeleton variant="rectangular" width="100%" height="100%" />
        </Paper>
      </Box>
    );
  }

  if ((userQuery.error || !user) && !isCreating) {
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {isCreating ? (
        // Creation Mode UI
        <>
          {/* Header */}
          <Box mb={4}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <IconButton onClick={handleBack} size="small">
                <ArrowBack />
              </IconButton>
            </Box>
          </Box>
          
          {/* Unified Form */}
          <UserForm
            formData={formData}
            selectedRoles={selectedRoles}
            errors={errors}
            canEditRoles={true}
            showAdminFields={true}
            isSaving={createUserMutation.isPending}
            isCreating={true}
            onInputChange={handleInputChange}
            onRoleToggle={handleRoleToggle}
            onSave={handleSave}
            onCancel={handleBack}
          />
          
          {/* Error Message */}
          {createUserMutation.error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              Error: {createUserMutation.error instanceof Error ? createUserMutation.error.message : 'Unknown error'}
            </Alert>
          )}
        </>
      ) : (
        // Edit Mode UI (existing layout)
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
                {user && (
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
                )}
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
                  isCreating={false}
                  onInputChange={handleInputChange}
                  onRoleToggle={handleRoleToggle}
                  onSave={handleSave}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default AdminUserDetails;
