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
} from '@mui/material';
import { Phone, Email as Mail, Tag as Hash, Security as Shield } from '@mui/icons-material';
import { UserRole } from '@/types';
import { getRoleDisplayName } from '@/utils/userManagement';

export interface UserFormData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  telegram_id?: string;
  license_document_url?: string;
}

interface UserFormProps {
  formData: UserFormData;
  selectedRoles?: UserRole[];
  errors?: Record<string, string>;
  isEditing: boolean;
  canEditRoles?: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRoleToggle?: (role: UserRole) => void;
}

// Role labels are now handled by getRoleDisplayName from userManagement utils

const UserForm: React.FC<UserFormProps> = ({
  formData,
  selectedRoles = [],
  errors = {},
  isEditing,
  canEditRoles = false,
  onInputChange,
  onRoleToggle,
}) => {
  return (
    <>
      {/* Basic Information */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={onInputChange}
            disabled={!isEditing}
            error={!!errors.first_name}
            helperText={errors.first_name}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            required
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={onInputChange}
            disabled={!isEditing}
            error={!!errors.last_name}
            helperText={errors.last_name}
          />
        </Grid>

        {formData.telegram_id !== undefined && (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Telegram ID"
              name="telegram_id"
              value={formData.telegram_id}
              onChange={onInputChange}
              placeholder="e.g., 123456789"
              disabled={!isEditing}
              error={!!errors.telegram_id}
              helperText={errors.telegram_id || "Numeric Telegram user ID (not the username)"}
            />
          </Grid>
        )}
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username ? `@${formData.username}` : ''}
            onChange={onInputChange}
            disabled={!isEditing}
            placeholder="@username"
            helperText="Telegram username (stored without @)"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Hash />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="email"
            label="Email"
            name="email"
            value={formData.email}
            onChange={onInputChange}
            disabled={!isEditing}
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
            onChange={onInputChange}
            disabled={!isEditing}
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
        
        {formData.license_document_url !== undefined && (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="url"
              label="License Document URL"
              name="license_document_url"
              value={formData.license_document_url}
              onChange={onInputChange}
              disabled={!isEditing}
            />
          </Grid>
        )}
      </Grid>

      {/* Roles Selection */}
      {canEditRoles && isEditing && onRoleToggle && (
        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 3 }}>
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
            
            <FormGroup>
              <Grid container spacing={1}>
                {Object.values(UserRole).map((role) => (
                  <Grid item xs={12} md={6} key={role}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedRoles.includes(role)}
                          onChange={() => onRoleToggle(role)}
                          color="primary"
                        />
                      }
                      label={getRoleDisplayName(role)}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>
          </FormControl>
        </Box>
      )}
    </>
  );
};

export default UserForm;
