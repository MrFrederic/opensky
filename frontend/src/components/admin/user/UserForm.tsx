import React from 'react';
import {
  TextField,
  Grid,
  InputAdornment,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  MenuItem,
  Select,
  InputLabel,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import { Phone, Email as Mail, Security as Shield, Check, Save as SaveIcon } from '@mui/icons-material';
import { UserRole, Gender } from '@/types';
import { getRoleDisplayName } from '@/utils/userManagement';
import { DateInput } from '@/components/common';

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
            <TextField
              fullWidth
              required
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={onInputChange}
              error={!!errors.first_name}
              helperText={errors.first_name}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <TextField
              fullWidth
              label="Middle Name"
              name="middle_name"
              value={formData.middle_name || ''}
              onChange={onInputChange}
              error={!!errors.middle_name}
              helperText={errors.middle_name}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <TextField
              fullWidth
              required
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={onInputChange}
              error={!!errors.last_name}
              helperText={errors.last_name}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <TextField
              fullWidth
              label="Display Name"
              name="display_name"
              value={formData.display_name || ''}
              onChange={onInputChange}
              error={!!errors.display_name}
              helperText={errors.display_name || "How the user prefers to be called"}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <DateInput
              label="Date of Birth"
              value={formData.date_of_birth || ''}
              onChange={(value) => onInputChange({ target: { name: 'date_of_birth', value } } as any)}
              error={!!errors.date_of_birth}
              helperText={errors.date_of_birth}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                value={formData.gender || ''}
                onChange={(e) => onInputChange({ target: { name: 'gender', value: e.target.value } } as any)}
                label="Gender"
                error={!!errors.gender}
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                <MenuItem value={Gender.MALE}>Male</MenuItem>
                <MenuItem value={Gender.FEMALE}>Female</MenuItem>
                <MenuItem value={Gender.OTHER}>Other</MenuItem>
                <MenuItem value={Gender.PREFER_NOT_TO_SAY}>Prefer not to say</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {showAdminFields && formData.telegram_id !== undefined && (
            <Grid item xs={12} sm={6} lg={4}>
              <TextField
                fullWidth
                label="Telegram ID"
                name="telegram_id"
                value={formData.telegram_id}
                onChange={onInputChange}
                placeholder="e.g., 123456789"
                error={!!errors.telegram_id}
                helperText={errors.telegram_id || "Numeric Telegram user ID (not the username) - optional for manual creation"}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6} lg={4}>
            <TextField
              fullWidth
              label="Telegram Username"
              name="username"
              value={formData.username ? `@${formData.username}` : ''}
              onChange={onInputChange}
              placeholder="@username"
              helperText="Telegram username (stored without @)"
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <TextField
              fullWidth
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              onChange={onInputChange}
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

          <Grid item xs={12} sm={6} lg={4}>
            <TextField
              fullWidth
              type="tel"
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={onInputChange}
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

          {/* Emergency Contact Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Emergency Contact
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <TextField
              fullWidth
              label="Emergency Contact Name"
              name="emergency_contact_name"
              value={formData.emergency_contact_name || ''}
              onChange={onInputChange}
              error={!!errors.emergency_contact_name}
              helperText={errors.emergency_contact_name}
            />
          </Grid>

          <Grid item xs={12} sm={6} lg={4}>
            <TextField
              fullWidth
              type="tel"
              label="Emergency Contact Phone"
              name="emergency_contact_phone"
              value={formData.emergency_contact_phone || ''}
              onChange={onInputChange}
              placeholder="+1234567890"
              error={!!errors.emergency_contact_phone}
              helperText={errors.emergency_contact_phone}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone />
                  </InputAdornment>
                ),
              }}
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
                <DateInput
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
                <TextField
                  fullWidth
                  type="number"
                  label="Starting Number of Jumps"
                  name="starting_number_of_jumps"
                  value={formData.starting_number_of_jumps || 0}
                  onChange={onInputChange}
                  error={!!errors.starting_number_of_jumps}
                  helperText={errors.starting_number_of_jumps || "Number of jumps user had before being added to the system"}
                  inputProps={{ min: 0 }}
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
                <Shield />
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
