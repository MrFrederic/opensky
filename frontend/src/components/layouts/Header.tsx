import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/auth';
import { useUser } from '@/hooks/useUser';
import { useToastContext } from '@/components/common/ToastProvider';
import { AdminOnly } from '@/components/auth/RoleGuard';
import User from '@/components/common/User';
import LoginModal from '@/components/auth/LoginModal';

const Header: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const toast = useToastContext();
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<null | HTMLElement>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Successfully logged out');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Even if the API call fails, clear local state and redirect
      useAuthStore.getState().logout();
      navigate('/');
    }
  };

  const handleAdminMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAdminMenuAnchor(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchor(null);
  };

  return (
    <AppBar position="static" color="inherit" elevation={1}>
      <Toolbar>
        {/* Logo */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 0,
            textDecoration: 'none',
            color: 'text.primary',
            fontWeight: 'bold',
            mr: 4,
          }}
        >
          DZM
        </Typography>

        {/* Navigation - Desktop */}
        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
          <Button component={Link} to="/" color="inherit">
            Home
          </Button>
          {isAuthenticated && (
            <>
              {/* Manifesting Link */}
              <AdminOnly>
                <Button component={Link} to="/manifesting" color="inherit">
                  Manifesting
                </Button>
              </AdminOnly>

              {/* Administration Menu */}
              <AdminOnly>
                <Button
                  color="inherit"
                  onClick={handleAdminMenuClick}
                  endIcon={<ExpandMoreIcon />}
                >
                  Administration
                </Button>
                <Menu
                  anchorEl={adminMenuAnchor}
                  open={Boolean(adminMenuAnchor)}
                  onClose={handleAdminMenuClose}
                >
                  <MenuItem component={Link} to="/admin/users" onClick={handleAdminMenuClose}>
                    Users
                  </MenuItem>
                  <MenuItem component={Link} to="/admin/jump-types" onClick={handleAdminMenuClose}>
                    Jump Types
                  </MenuItem>
                  <MenuItem component={Link} to="/admin/aircraft" onClick={handleAdminMenuClose}>
                    Aircraft
                  </MenuItem>
                  <MenuItem component={Link} to="/admin/dictionaries" onClick={handleAdminMenuClose}>
                    Dictionaries
                  </MenuItem>
                </Menu>
              </AdminOnly>
            </>
          )}
        </Box>

        {/* User menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isAuthenticated ? (
            <>
              {isLoading ? (
                <CircularProgress size={24} />
              ) : user ? (
                <Box
                  component={Link}
                  to="/profile"
                  sx={{
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:hover': { opacity: 0.8 }
                  }}
                >
                  <User user={user} size="small" />
                </Box>
              ) : null}
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button variant="contained" color="primary" onClick={() => setLoginModalOpen(true)}>
              Login
            </Button>
          )}
        </Box>

        {/* Login Modal */}
        <LoginModal
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
