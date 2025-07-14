import React, { useState } from 'react';
import { Outlet, useMatches } from 'react-router-dom';
import { Box, Drawer } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

const RootLayout: React.FC = () => {

  const matches = useMatches();
  // Find the deepest matched route with a hideHeader handle (with type guard)
  type HandleType = { hideHeader?: boolean };
  const hideHeader = matches
    .slice() // copy to avoid mutating original
    .reverse()
    .find((m): m is typeof m & { handle: HandleType } => typeof m.handle === 'object' && m.handle !== null && 'hideHeader' in m.handle)
    ?.handle.hideHeader;

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Show header in drawer when hidden and user hovers at top
  const handleMouseMove = (e: React.MouseEvent) => {
    if (hideHeader && e.clientY <= 8) {
      setDrawerOpen(true);
    }
  };
  const handleDrawerClose = () => setDrawerOpen(false);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseMove={hideHeader ? handleMouseMove : undefined}
    >
      {!hideHeader && (
        <Box sx={{ }}>
          <Header />
        </Box>
      )}
      {hideHeader && (
        <Drawer
          anchor="top"
          open={drawerOpen}
          onClose={handleDrawerClose}
          PaperProps={{ sx: { background: 'transparent', boxShadow: 'none', pointerEvents: 'none' } }}
          ModalProps={{ keepMounted: true }}
        >
          <Box sx={{ pointerEvents: 'auto' }} onMouseLeave={handleDrawerClose}>
            <Header />
          </Box>
        </Drawer>
      )}
      <Box
        component="main"
        sx={{
          flex: '1 1 0',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        <Outlet />
        <Footer />
      </Box>
    </Box>
  );
};

export default RootLayout;
