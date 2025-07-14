import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Box,
  Typography,
  Alert,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Phone, Email as Mail } from '@mui/icons-material';
import { DateInput } from '@/components/common';

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
            <TextField
              fullWidth
              required
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              error={!!errors.first_name}
              helperText={errors.first_name}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Middle Name"
              name="middle_name"
              value={formData.middle_name || ''}
              onChange={handleInputChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              error={!!errors.last_name}
              helperText={errors.last_name}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Display Name"
              name="display_name"
              value={formData.display_name || ''}
              onChange={handleInputChange}
              helperText="How you prefer to be called"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DateInput
              label="Date of Birth"
              value={formData.date_of_birth || ''}
              onChange={(value) => handleInputChange({ target: { name: 'date_of_birth', value } } as any)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                value={formData.gender || ''}
                onChange={(e) => handleInputChange({ target: { name: 'gender', value: e.target.value } } as any)}
                label="Gender"
              >
                <MenuItem value="">
                  <em>Prefer not to say</em>
                </MenuItem>
                <MenuItem value={Gender.MALE}>Male</MenuItem>
                <MenuItem value={Gender.FEMALE}>Female</MenuItem>
                <MenuItem value={Gender.OTHER}>Other</MenuItem>
                <MenuItem value={Gender.PREFER_NOT_TO_SAY}>Prefer not to say</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Contact Information */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Contact Information
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username ? `@${formData.username}` : ''}
              onChange={handleInputChange}
              placeholder="@username"
              helperText="Your Telegram username"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="user@example.com"
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="tel"
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1234567890"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        {/* Emergency Contact */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Emergency Contact
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Emergency Contact Name"
              name="emergency_contact_name"
              value={formData.emergency_contact_name || ''}
              onChange={handleInputChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="tel"
              label="Emergency Contact Phone"
              name="emergency_contact_phone"
              value={formData.emergency_contact_phone || ''}
              onChange={handleInputChange}
              placeholder="+1234567890"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        {/* Medical Clearance */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 3 }}>
          Medical Clearance
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <DateInput
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
