import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

const RootLayout: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1100 }}>
        <Header />
      </Box>
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default RootLayout;
