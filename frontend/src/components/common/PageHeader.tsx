import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { ArrowBack as ArrowLeft } from '@mui/icons-material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backLabel,
  actions,
}) => {
  return (
    <Box mb={4}>
      {onBack && (
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <IconButton onClick={onBack} color="primary">
            <ArrowLeft />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {backLabel || 'Back'}
          </Typography>
        </Box>
      )}
      
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {actions && (
          <Box display="flex" gap={1}>
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
