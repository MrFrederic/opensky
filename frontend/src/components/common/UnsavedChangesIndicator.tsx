import React from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { Warning, Save } from '@mui/icons-material';

interface UnsavedChangesIndicatorProps {
  hasUnsavedChanges: boolean;
  onSave: () => void;
  isSaving?: boolean;
  saveButtonText?: string;
  savingText?: string;
  disabled?: boolean;
  variant?: 'inline' | 'chip' | 'header';
  size?: 'small' | 'medium' | 'large';
}

const UnsavedChangesIndicator: React.FC<UnsavedChangesIndicatorProps> = ({
  hasUnsavedChanges,
  onSave,
  isSaving = false,
  saveButtonText = 'Save Changes',
  savingText = 'Saving...',
  disabled = false,
  variant = 'inline',
  size = 'medium',
}) => {
  if (!hasUnsavedChanges && !isSaving) {
    return null;
  }

  const renderIndicator = () => {
    switch (variant) {
      case 'chip':
        return (
          <Chip
            icon={<Warning />}
            label="Unsaved changes"
            color="warning"
            variant="outlined"
            size={size === 'large' ? 'medium' : 'small'}
          />
        );

      case 'header':
        return (
          <Box display="flex" alignItems="center" gap={2}>
            <Box>
              <Typography variant="body2" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Warning fontSize="small" />
                You have unsaved changes
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              size={size}
              startIcon={<Save />}
              onClick={onSave}
              disabled={disabled || isSaving || !hasUnsavedChanges}
            >
              {isSaving ? savingText : saveButtonText}
            </Button>
          </Box>
        );

      case 'inline':
      default:
        return (
          <Box 
            display="flex" 
            alignItems="center" 
            gap={1}
            sx={{
              p: 1.5,
              borderRadius: 1,
              backgroundColor: 'warning.light',
              color: 'warning.contrastText',
              border: 1,
              borderColor: 'warning.main',
            }}
          >
            <Warning fontSize="small" />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              You have unsaved changes
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              size="small"
              startIcon={<Save />}
              onClick={onSave}
              disabled={disabled || isSaving || !hasUnsavedChanges}
            >
              {isSaving ? savingText : saveButtonText}
            </Button>
          </Box>
        );
    }
  };

  return renderIndicator();
};

export default UnsavedChangesIndicator;
