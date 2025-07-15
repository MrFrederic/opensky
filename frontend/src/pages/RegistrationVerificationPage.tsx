import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    CircularProgress,
} from '@mui/material';
import { useAuthStore } from '@/stores/auth';
import { authService, RegistrationCompleteRequest } from '@/services/auth';
import { useToastContext } from '@/components/common/ToastProvider';
import { Gender } from '@/types';
import { UniversalInputField } from '@/components/common';

const RegistrationVerificationPage: React.FC = () => {
    const navigate = useNavigate();
    const { tempToken, userStatus, telegramUserData, setAuth, setTokens, clearTempToken } = useAuthStore();
    const toast = useToastContext();

    // Remove activeStep state since we no longer use it
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<RegistrationCompleteRequest>>({
        first_name: '',
        middle_name: '',
        last_name: '',
        display_name: '',
        email: '',
        phone: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        gender: undefined,
        photo_url: '',
        date_of_birth: '',
        medical_clearance_date: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Check for temp token and fetch existing user data
    useEffect(() => {
        if (!tempToken) {
            toast.error('No authentication session found. Please log in again.');
            navigate('/');
            return;
        }

        // Pre-fill form with Telegram data or existing user data
        if (telegramUserData) {
            setFormData(prev => ({
                ...prev,
                first_name: telegramUserData.first_name || prev.first_name,
                last_name: telegramUserData.last_name || prev.last_name,
                photo_url: telegramUserData.photo_url || prev.photo_url,
                // For incomplete users, use existing data
                middle_name: telegramUserData.middle_name || prev.middle_name,
                display_name: telegramUserData.display_name || prev.display_name,
                email: telegramUserData.email || prev.email,
                phone: telegramUserData.phone || prev.phone,
                emergency_contact_name: telegramUserData.emergency_contact_name || prev.emergency_contact_name,
                emergency_contact_phone: telegramUserData.emergency_contact_phone || prev.emergency_contact_phone,
                gender: telegramUserData.gender || prev.gender,
                date_of_birth: telegramUserData.date_of_birth || prev.date_of_birth,
                medical_clearance_date: telegramUserData.medical_clearance_date || prev.medical_clearance_date,
            }));
        }

        // For incomplete users, fetch additional data if needed
        if (userStatus === 'incomplete') {
            setIsLoading(true);
            authService.checkRegistrationStatus()
                .then(() => {
                    // Additional data handling if needed
                })
                .catch(error => {
                    console.error('Failed to fetch registration status:', error);
                    toast.error('Failed to load your profile data.');
                })
                .finally(() => setIsLoading(false));
        }
    }, [tempToken, userStatus, telegramUserData, navigate, toast]);

    const handleInputChange = (field: keyof RegistrationCompleteRequest, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Basic validation
        if (!formData.first_name?.trim()) {
            errors.first_name = 'First name is required';
        }
        if (!formData.last_name?.trim()) {
            errors.last_name = 'Last name is required';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Additional required fields for registration
        if (!formData.phone?.trim()) {
            errors.phone = 'Phone number is required';
        }
        if (!formData.emergency_contact_name?.trim()) {
            errors.emergency_contact_name = 'Emergency contact name is required';
        }
        if (!formData.emergency_contact_phone?.trim()) {
            errors.emergency_contact_phone = 'Emergency contact phone is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        if (!tempToken) {
            toast.error('Authentication session expired. Please log in again.');
            navigate('/');
            return;
        }

        setIsLoading(true);

        try {
            const registrationData: RegistrationCompleteRequest = {
                temp_token: tempToken,
                first_name: formData.first_name!,
                middle_name: formData.middle_name || undefined,
                last_name: formData.last_name!,
                display_name: formData.display_name || undefined,
                email: formData.email || undefined,
                phone: formData.phone!,
                emergency_contact_name: formData.emergency_contact_name!,
                emergency_contact_phone: formData.emergency_contact_phone!,
                gender: formData.gender || undefined,
                photo_url: formData.photo_url || undefined,
                date_of_birth: formData.date_of_birth || undefined,
                medical_clearance_date: formData.medical_clearance_date || undefined,
            };

            // Complete registration and get tokens
            const tokens = await authService.completeRegistration(registrationData);
            
            // Set tokens first to enable authenticated requests
            setTokens(tokens);
            
            // Now get the user data with the new tokens
            const userData = await authService.getCurrentUser();

            // Update auth store with complete user data and tokens
            setAuth(userData, tokens);
            
            // Clear temp token
            clearTempToken();

            toast.success('Registration completed successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Registration failed:', error);
            toast.error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!tempToken) {
        return null;
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Welcome! Please complete Your Profile
                </Typography>

                <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
                    Please fill in the required information to complete your registration.
                </Typography>

                <Box>

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <UniversalInputField
                                    type="text"
                                    label="First Name"
                                    value={formData.first_name || ''}
                                    onChange={(value) => handleInputChange('first_name', value)}
                                    error={!!formErrors.first_name}
                                    helperText={formErrors.first_name}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <UniversalInputField
                                    type="text"
                                    label="Last Name"
                                    value={formData.last_name || ''}
                                    onChange={(value) => handleInputChange('last_name', value)}
                                    error={!!formErrors.last_name}
                                    helperText={formErrors.last_name}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <UniversalInputField
                                    type="text"
                                    label="Middle Name"
                                    value={formData.middle_name || ''}
                                    onChange={(value) => handleInputChange('middle_name', value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <UniversalInputField
                                    type="text"
                                    label="Display Name"
                                    value={formData.display_name || ''}
                                    onChange={(value) => handleInputChange('display_name', value)}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <UniversalInputField
                                    type="phone"
                                    label="Phone"
                                    value={formData.phone || ''}
                                    onChange={(value) => handleInputChange('phone', value)}
                                    error={!!formErrors.phone}
                                    helperText={formErrors.phone}
                                    placeholder="+1234567890"
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <UniversalInputField
                                    type="dropdown"
                                    label="Gender"
                                    value={formData.gender || ''}
                                    onChange={(value) => handleInputChange('gender', value as Gender)}
                                    options={[
                                        { value: Gender.MALE, label: 'Male' },
                                        { value: Gender.FEMALE, label: 'Female' },
                                        { value: Gender.OTHER, label: 'Other' }
                                    ]}
                                    placeholder="Select Gender"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <UniversalInputField
                                    type="text"
                                    label="Emergency Contact Name"
                                    value={formData.emergency_contact_name || ''}
                                    onChange={(value) => handleInputChange('emergency_contact_name', value)}
                                    error={!!formErrors.emergency_contact_name}
                                    helperText={formErrors.emergency_contact_name}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <UniversalInputField
                                    type="phone"
                                    label="Emergency Contact Phone"
                                    value={formData.emergency_contact_phone || ''}
                                    onChange={(value) => handleInputChange('emergency_contact_phone', value)}
                                    error={!!formErrors.emergency_contact_phone}
                                    helperText={formErrors.emergency_contact_phone}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <UniversalInputField
                                    type="email"
                                    label="Email"
                                    value={formData.email || ''}
                                    onChange={(value) => handleInputChange('email', value)}
                                    error={!!formErrors.email}
                                    helperText={formErrors.email}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <UniversalInputField
                                    type="date"
                                    label="Date of Birth"
                                    value={formData.date_of_birth || ''}
                                    onChange={(value) => handleInputChange('date_of_birth', value)}
                                />
                            </Grid>

                        </Grid>
                    </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        onClick={() => navigate('/')}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <CircularProgress size={24} />
                        ) : (
                            'Complete Registration'
                        )}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default RegistrationVerificationPage;
