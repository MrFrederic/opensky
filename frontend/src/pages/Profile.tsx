import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Box,
  Typography,
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import { UniversalInputField } from '@/components/common';

import { Gender } from '@/types';
import { useToastContext } from '@/components/common/ToastProvider';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { authService } from '@/services/auth';
import { AvatarUpload } from '@/components/common/AvatarUpload';
import UnsavedChangesIndicator from '@/components/common/UnsavedChangesIndicator';
import { processFieldValue, userToFormData } from '@/utils/userManagement';
import { cleanUserFormData } from '@/lib/form-utils';

interface ProfileFormData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  display_name?: string;
  date_of_birth?: string;
  username: string;
  email: string;
  phone: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  gender?: Gender;
  photo_url?: string;
  medical_clearance_date?: string;
  medical_clearance_is_confirmed?: boolean;
}

const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToastContext();

  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
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
    medical_clearance_date: '',
    medical_clearance_is_confirmed: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stagedPhotoUrl, setStagedPhotoUrl] = useState<string | null>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  // Fetch current user data
  const userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
  });

  const user = userQuery.data;

  // Track unsaved changes
  const { hasUnsavedChanges, resetUnsavedChanges } = useUnsavedChanges({
    originalData: user ? userToFormData(user) : null,
    currentData: formData,
    additionalChanges: [stagedPhotoUrl],
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      const userData = userToFormData(user);
      setFormData({
        first_name: userData.first_name,
        middle_name: userData.middle_name,
        last_name: userData.last_name,
        display_name: userData.display_name,
        date_of_birth: userData.date_of_birth,
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        emergency_contact_name: userData.emergency_contact_name,
        emergency_contact_phone: userData.emergency_contact_phone,
        gender: userData.gender,
        medical_clearance_date: userData.medical_clearance_date,
        medical_clearance_is_confirmed: userData.medical_clearance_is_confirmed,
      });
    }
  }, [user]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data: any) => authService.updateCurrentUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Profile updated successfully');
      setStagedPhotoUrl(null);
      resetUnsavedChanges();
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = processFieldValue(name, value);
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSave = async () => {
    try {
      setErrors({});
      
      const dataToSave = cleanUserFormData(formData);
      
      // Include staged photo URL if available
      if (stagedPhotoUrl) {
        dataToSave.photo_url = stagedPhotoUrl;
      }
      
      await updateUserMutation.mutateAsync(dataToSave);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  if (userQuery.isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography>Loading...</Typography>
        </Paper>
      </Container>
    );
  }

  if (userQuery.error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>
        <Alert severity="error">
          Error loading profile: {userQuery.error instanceof Error ? userQuery.error.message : 'Unknown error'}
        </Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Profile not found
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Profile
        </Typography>
        
        <UnsavedChangesIndicator
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
          isSaving={updateUserMutation.isPending}
          variant="header"
        />
      </Box>

      {/* Profile Form */}
      <Paper elevation={2} sx={{ p: 4 }}>
        {/* Avatar */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <AvatarUpload 
            user={user} 
            size={120}
            editable={true}
            stagedPhotoUrl={stagedPhotoUrl}
            isUploading={isPhotoUploading}
            onPhotoUrlChange={(photoUrl) => {
              setStagedPhotoUrl(photoUrl);
              setIsPhotoUploading(false);
            }}
          />
        </Box>

        {/* Personal Information */}
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Personal Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <UniversalInputField
              type="text"
              label="First Name"
              value={formData.first_name}
              onChange={(value) => handleInputChange({ target: { name: 'first_name', value } } as any)}
              error={!!errors.first_name}
              helperText={errors.first_name}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <UniversalInputField
              type="text"
              label="Middle Name"
              value={formData.middle_name || ''}
              onChange={(value) => handleInputChange({ target: { name: 'middle_name', value } } as any)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <UniversalInputField
              type="text"
              label="Last Name"
              value={formData.last_name}
              onChange={(value) => handleInputChange({ target: { name: 'last_name', value } } as any)}
              error={!!errors.last_name}
              helperText={errors.last_name}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <UniversalInputField
              type="text"
              label="Display Name"
              value={formData.display_name || ''}
              onChange={(value) => handleInputChange({ target: { name: 'display_name', value } } as any)}
              helperText="How you prefer to be called"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <UniversalInputField
              type="date"
              label="Date of Birth"
              value={formData.date_of_birth || ''}
              onChange={(value) => handleInputChange({ target: { name: 'date_of_birth', value } } as any)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <UniversalInputField
              type="dropdown"
              label="Gender"
              value={formData.gender || ''}
              onChange={(value) => handleInputChange({ target: { name: 'gender', value } } as any)}
              options={[
                { value: '', label: 'Prefer not to say' },
                { value: Gender.MALE, label: 'Male' },
                { value: Gender.FEMALE, label: 'Female' },
                { value: Gender.OTHER, label: 'Other' },
                { value: Gender.PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
              ]}
            />
          </Grid>
        </Grid>

        {/* Contact Information */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Contact Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <UniversalInputField
              type="telegram"
              label="Username"
              value={formData.username || ''}
              onChange={(value) => handleInputChange({ target: { name: 'username', value } } as any)}
              placeholder="username"
              helperText="Your Telegram username"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <UniversalInputField
              type="text"
              label="Email"
              value={formData.email}
              onChange={(value) => handleInputChange({ target: { name: 'email', value } } as any)}
              placeholder="user@example.com"
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <UniversalInputField
              type="phone"
              label="Phone"
              value={formData.phone}
              onChange={(value) => handleInputChange({ target: { name: 'phone', value } } as any)}
              placeholder="+1234567890"
            />
          </Grid>
        </Grid>

        {/* Emergency Contact */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Emergency Contact
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <UniversalInputField
              type="text"
              label="Emergency Contact Name"
              value={formData.emergency_contact_name || ''}
              onChange={(value) => handleInputChange({ target: { name: 'emergency_contact_name', value } } as any)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <UniversalInputField
              type="phone"
              label="Emergency Contact Phone"
              value={formData.emergency_contact_phone || ''}
              onChange={(value) => handleInputChange({ target: { name: 'emergency_contact_phone', value } } as any)}
              placeholder="+1234567890"
            />
          </Grid>
        </Grid>

        {/* Medical Clearance */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Medical Clearance
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <UniversalInputField
              type="date"
              label="Medical Clearance Date"
              value={formData.medical_clearance_date || ''}
              onChange={(value) => handleInputChange({ target: { name: 'medical_clearance_date', value } } as any)}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Medical Clearance Confirmed
              </Typography>
              <Chip
                label={formData.medical_clearance_is_confirmed ? 'Confirmed' : 'Not Confirmed'}
                color={formData.medical_clearance_is_confirmed ? 'success' : 'default'}
                variant="outlined"
                size="medium"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Messages */}
      {updateUserMutation.error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          Error: {updateUserMutation.error.message}
        </Alert>
      )}
    </Container>
  );
};

export default Profile;
