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

import { useToast } from '@/hooks/useToast';
import { AdminOnly } from '@/components/auth/RoleGuard';
import { usersService } from '@/services/users';
import { UserRole } from '@/types';
import UserForm, { UserFormData } from '@/components/admin/UserForm';
import { validateUserForm, processFieldValue } from '@/utils/userManagement';

const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    telegram_id: '', // Required for new users
    license_document_url: '',
  });

  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([UserRole.TANDEM_JUMPER]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: { 
      first_name: string;
      last_name: string;
      username?: string;
      email?: string;
      phone?: string;
      telegram_id: string;
      roles: UserRole[];
      // Note: photo_url is intentionally omitted as it's causing backend errors
      // The backend will handle Telegram avatar separately if needed
    }) => usersService.createUser(data),
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
      // Transform formData to API format - note that the backend expects telegram_id to be a string
      // Explicitly defining only the fields we want to send to avoid any unwanted fields
      const userData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        username: formData.username || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        telegram_id: formData.telegram_id!,
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
            <UserForm
              formData={formData}
              selectedRoles={selectedRoles}
              errors={errors}
              isEditing={true}
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
    </AdminOnly>
  );
};

export default UserCreate;
