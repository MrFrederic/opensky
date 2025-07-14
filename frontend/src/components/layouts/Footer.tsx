import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        py: 1,
        width: '100vw',
        position: 'fixed',
        left: 0,
        bottom: 0,
        zIndex: 1300,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          minHeight: 40,
          px: { xs: 1, sm: 2 },
        }}
      >
        {/* Left: Contact */}
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Contact:&nbsp;
          <a href="https://t.me/mrfrederic" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
            @MrFrederic
          </a>
        </Typography>
        {/* Center: System Info */}
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', flex: 1 }}>
          &copy; 2025 Dropzone Management System &mdash; React & FastAPI
        </Typography>
        {/* Right: License */}
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          <a href="https://github.com/MrFrederic/dropzone-management-system/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
            MIT License
          </a>
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;
