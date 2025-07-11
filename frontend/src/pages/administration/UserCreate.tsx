import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  IconButton,
} from '@mui/material';
import { 
  ArrowBack as ArrowLeft, 
  PersonAdd as UserPlus, 
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import { useToastContext } from '@/components/common/ToastProvider';
import { usersService } from '@/services/users';
import { UserRole } from '@/types';
import UserForm, { UserFormData } from '@/components/admin/UserForm';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import { validateUserForm, processFieldValue } from '@/utils/userManagement';

const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToastContext();

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
    telegram_id: '', // Required for new users
    photo_url: '',
    medical_clearance_date: '',
    medical_clearance_is_confirmed: false,
    is_active: true,
  });

  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([UserRole.TANDEM_JUMPER]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stagedPhotoUrl, setStagedPhotoUrl] = useState<string | null>(null);

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
    // Validate form
    const validationErrors = validateUserForm(formData, selectedRoles);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Clear errors
    setErrors({});

    try {
      // Transform formData to API format
      const userData = {
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name?.trim() || undefined,
        last_name: formData.last_name.trim(),
        display_name: formData.display_name?.trim() || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        username: formData.username || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        emergency_contact_name: formData.emergency_contact_name?.trim() || undefined,
        emergency_contact_phone: formData.emergency_contact_phone || undefined,
        gender: formData.gender || undefined,
        telegram_id: formData.telegram_id!,
        photo_url: stagedPhotoUrl || undefined,
        medical_clearance_date: formData.medical_clearance_date || undefined,
        medical_clearance_is_confirmed: formData.medical_clearance_is_confirmed,
        is_active: formData.is_active,
        roles: selectedRoles,
      };
      
      await createUserMutation.mutateAsync(userData);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleCancel = () => {
    navigate('/admin/users');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <IconButton onClick={handleCancel} size="small">
              <ArrowLeft />
            </IconButton>
            <Typography variant="h4" component="h1">
              Create New User
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Add a new user to the system with specific roles and permissions
          </Typography>
        </Box>
        
        {/* Form */}
        <Paper elevation={2}>
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Box display="flex" alignItems="center" gap={2}>
              <UserPlus />
              <Typography variant="h6" component="h2">
                User Information
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ p: 3 }}>
            {/* Avatar Upload */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <AvatarUpload 
                user={{
                  id: 0,
                  telegram_id: '',
                  first_name: formData.first_name || 'New',
                  last_name: formData.last_name || 'User',
                  photo_url: undefined,
                  roles: [],
                  created_at: '',
                }}
                size={120}
                editable={true}
                stagedPhotoUrl={stagedPhotoUrl}
                onPhotoUrlChange={(photoUrl) => setStagedPhotoUrl(photoUrl)}
              />
            </Box>

            <UserForm
              formData={formData}
              selectedRoles={selectedRoles}
              errors={errors}
              canEditRoles={true}
              onInputChange={handleInputChange}
              onRoleToggle={handleRoleToggle}
            />
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </Box>
        
        {/* Error Message */}
        {createUserMutation.error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            Error: {createUserMutation.error instanceof Error ? createUserMutation.error.message : 'Unknown error'}
          </Alert>
        )}
      </Container>
  );
};

export default UserCreate;
