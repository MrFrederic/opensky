import React from 'react';
import {
  Grid,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import { Check, Save as SaveIcon, Security } from '@mui/icons-material';
import { UserRole, Gender } from '@/types';
import { getRoleDisplayName } from '@/utils/userManagement';
import { UniversalInputField } from '@/components/common';

export interface UserFormData {
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
  telegram_id?: string;
  photo_url?: string;
  medical_clearance_date?: string;
  medical_clearance_is_confirmed?: boolean;
  starting_number_of_jumps?: number;
  is_active?: boolean;
}

interface UserFormProps {
  formData: UserFormData;
  selectedRoles?: UserRole[];
  errors?: Record<string, string>;
  canEditRoles?: boolean;
  showAdminFields?: boolean;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  isCreating?: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRoleToggle?: (role: UserRole) => void;
  onSave?: () => void;
  onCancel?: () => void;
}

// Role labels are now handled by getRoleDisplayName from userManagement utils

const UserForm: React.FC<UserFormProps> = ({
  formData,
  selectedRoles = [],
  errors = {},
  canEditRoles = false,
  showAdminFields = true,
  hasUnsavedChanges = false,
  isSaving = false,
  isCreating = false,
  onInputChange,
  onRoleToggle,
  onSave,
  onCancel,
}) => {
  return (
    <>
      {/* Creation Mode: Warning Message */}
      {isCreating && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Manual User Creation</strong> - This is not the standard user registration flow. 
            Users typically join through Telegram authentication. Please proceed with caution.
          </Typography>
        </Alert>
      )}

      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
        {/* Edit Mode: Save Button at top */}
      {!isCreating && onSave && (
        <Box sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Check />}
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      )}
      
      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflow: 'visible', pr: 1 }}>
        {/* Basic Information */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} lg={4}>
            <UniversalInputField
              type="text"
              label="First Name"
              value={formData.first_name}
              onChange={(value) => onInputChange({ target: { name: 'first_name', value } } as any)}
              error={!!errors.first_name}
              helperText={errors.first_name}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <UniversalInputField
              type="text"
              label="Middle Name"
              value={formData.middle_name || ''}
              onChange={(value) => onInputChange({ target: { name: 'middle_name', value } } as any)}
              error={!!errors.middle_name}
              helperText={errors.middle_name}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <UniversalInputField
              type="text"
              label="Last Name"
              value={formData.last_name}
              onChange={(value) => onInputChange({ target: { name: 'last_name', value } } as any)}
              error={!!errors.last_name}
              helperText={errors.last_name}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <UniversalInputField
              type="text"
              label="Display Name"
              value={formData.display_name || ''}
              onChange={(value) => onInputChange({ target: { name: 'display_name', value } } as any)}
              error={!!errors.display_name}
              helperText={errors.display_name || "How the user prefers to be called"}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <UniversalInputField
              type="date"
              label="Date of Birth"
              value={formData.date_of_birth || ''}
              onChange={(value) => onInputChange({ target: { name: 'date_of_birth', value } } as any)}
              error={!!errors.date_of_birth}
              helperText={errors.date_of_birth}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <UniversalInputField
              type="dropdown"
              label="Gender"
              value={formData.gender || ''}
              onChange={(value) => onInputChange({ target: { name: 'gender', value } } as any)}
              error={!!errors.gender}
              options={[
                { value: '', label: 'Not specified' },
                { value: Gender.MALE, label: 'Male' },
                { value: Gender.FEMALE, label: 'Female' },
                { value: Gender.OTHER, label: 'Other' },
                { value: Gender.PREFER_NOT_TO_SAY, label: 'Prefer not to say' },
              ]}
            />
          </Grid>

          {showAdminFields && formData.telegram_id !== undefined && (
            <Grid item xs={12} sm={6} lg={4}>
              <UniversalInputField
                type="text"
                label="Telegram ID"
                value={formData.telegram_id}
                onChange={(value) => onInputChange({ target: { name: 'telegram_id', value } } as any)}
                placeholder="e.g., 123456789"
                error={!!errors.telegram_id}
                helperText={errors.telegram_id || "Numeric Telegram user ID (not the username) - optional for manual creation"}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6} lg={4}>
            <UniversalInputField
              type="telegram"
              label="Telegram Username"
              value={formData.username || ''}
              onChange={(value) => onInputChange({ target: { name: 'username', value } } as any)}
              placeholder="username"
              helperText="Telegram username (stored without @)"
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <UniversalInputField
              type="text"
              label="Email"
              value={formData.email}
              onChange={(value) => onInputChange({ target: { name: 'email', value } } as any)}
              placeholder="user@example.com"
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <UniversalInputField
              type="phone"
              label="Phone"
              value={formData.phone}
              onChange={(value) => onInputChange({ target: { name: 'phone', value } } as any)}
              placeholder="+1234567890"
            />
          </Grid>

          {/* Emergency Contact Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Emergency Contact
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <UniversalInputField
              type="text"
              label="Emergency Contact Name"
              value={formData.emergency_contact_name || ''}
              onChange={(value) => onInputChange({ target: { name: 'emergency_contact_name', value } } as any)}
              error={!!errors.emergency_contact_name}
              helperText={errors.emergency_contact_name}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <UniversalInputField
              type="phone"
              label="Emergency Contact Phone"
              value={formData.emergency_contact_phone || ''}
              onChange={(value) => onInputChange({ target: { name: 'emergency_contact_phone', value } } as any)}
              placeholder="+1234567890"
              error={!!errors.emergency_contact_phone}
              helperText={errors.emergency_contact_phone}
            />
          </Grid>

          {/* Medical Clearance Information */}
          {showAdminFields && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Medical Clearance
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} lg={4}>
                <UniversalInputField
                  type="date"
                  label="Medical Clearance Date"
                  value={formData.medical_clearance_date || ''}
                  onChange={(value) => onInputChange({ target: { name: 'medical_clearance_date', value } } as any)}
                  error={!!errors.medical_clearance_date}
                  helperText={errors.medical_clearance_date}
                />
              </Grid>

              <Grid item xs={12} sm={6} lg={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.medical_clearance_is_confirmed || false}
                      onChange={(e) => onInputChange({ target: { name: 'medical_clearance_is_confirmed', value: e.target.checked } } as any)}
                      color="primary"
                    />
                  }
                  label="Medical Clearance Confirmed"
                />
              </Grid>

              <Grid item xs={12} sm={6} lg={4}>
                <UniversalInputField
                  type="number"
                  label="Starting Number of Jumps"
                  value={formData.starting_number_of_jumps || 0}
                  onChange={(value) => onInputChange({ target: { name: 'starting_number_of_jumps', value } } as any)}
                  error={!!errors.starting_number_of_jumps}
                  helperText={errors.starting_number_of_jumps || "Number of jumps user had before being added to the system"}
                  min={0}
                />
              </Grid>

              <Grid item xs={12} sm={6} lg={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.is_active !== false}
                      onChange={(e) => onInputChange({ target: { name: 'is_active', value: e.target.checked } } as any)}
                      color="primary"
                    />
                  }
                  label="User Active"
                />
              </Grid>
            </>
          )}
        </Grid>

        {/* Roles Selection */}
        {canEditRoles && onRoleToggle && (
          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 3, mt: 3 }}>
            <FormControl error={!!errors.roles}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Security />
                <Typography variant="subtitle2">User Roles</Typography>
              </Box>
              {errors.roles && (
                <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                  {errors.roles}
                </Typography>
              )}

              <FormGroup row sx={{ flexWrap: 'wrap' }}>
                {Object.values(UserRole).map((role) => (
                  <FormControlLabel
                    key={role}
                    control={
                      <Checkbox
                        checked={selectedRoles.includes(role)}
                        onChange={() => onRoleToggle(role)}
                        color="primary"
                      />
                    }
                    label={getRoleDisplayName(role)}
                    sx={{ minWidth: '180px', mr: 2, mb: 1 }}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Box>
        )}

        {/* Creation Mode: Action Buttons */}
        {isCreating && onSave && (
          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 3, mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? 'Creating...' : 'Create User'}
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
    </>
  );
};

export default UserForm;
