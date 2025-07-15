import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper,
  CircularProgress
} from '@mui/material';
import { 
  Lock as LockIcon 
} from '@mui/icons-material';
import { useUser } from '@/hooks/useUser';
import { useAuthStore } from '@/stores/auth';
import LoginModal from './LoginModal';
import NotFoundPage from '@/pages/public/NotFoundPage';

interface RoleGuardProps {
  children: React.ReactNode;
  /** Show content only if user has this permission */
  permission: string;
  /** Show this content if user doesn't have required permission */
  fallback?: React.ReactNode;
  /** If true, show loading state while user data is being fetched */
  showLoadingState?: boolean;
  /** If true, show full-page authentication required screen for unauthenticated users */
  requireAuth?: boolean;
  /** If true, use 404 page as fallback for access denied (default: true for page-level guards) */
  use404Fallback?: boolean;
}

/**
 * Component that conditionally renders children based on user permissions
 * Unified permission-based access control system
 * 
 * @example
 * // Route protection
 * <RoleGuard permission="VIEW_ADMIN_PANEL" requireAuth={true}>
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * @example
 * // Permission-based UI
 * <RoleGuard permission="MANAGE_USERS">
 *   <UserManagementButton />
 * </RoleGuard>
 * 
 * @example
 * // With fallback
 * <RoleGuard permission="CREATE_LOAD" fallback={<UpgradePrompt />}>
 *   <CreateLoadButton />
 * </RoleGuard>
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  permission,
  fallback = null,
  showLoadingState = false,
  requireAuth = false,
  use404Fallback = false
}) => {
  const { user, isLoading } = useUser();
  const { isAuthenticated, hasPermission } = useAuthStore();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Show loading state if requested and user data is being fetched
  if (isLoading && showLoadingState) {
    return <CircularProgress size={20} />;
  }

  // Check authentication if required
  if (requireAuth && (!isAuthenticated || !user)) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <LockIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
              Authentication Required
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Please log in to access this page.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => setLoginModalOpen(true)}
            >
              Log In
            </Button>
            
            <LoginModal 
              open={loginModalOpen} 
              onClose={() => setLoginModalOpen(false)} 
            />
          </Paper>
        </Container>
      </Box>
    );
  }

  // Check if user has the required permission
  const userHasPermission = hasPermission(permission);

  if (userHasPermission) {
    return <>{children}</>;
  }

  // If access denied, use 404 fallback if requested, otherwise use provided fallback
  if (use404Fallback) {
    return <NotFoundPage />;
  }

  return <>{fallback}</>;
};

/**
 * Hook for permission-based conditional logic in components
 */
export const useRoleCheck = () => {
  const { user, isLoading } = useUser();
  const { hasPermission } = useAuthStore();

  return {
    user,
    isLoading,
    hasPermission,
  };
};

/**
 * Convenience components for common permission checks
 * These use 404 fallback by default for page-level protection
 */

export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode; use404?: boolean }> = ({ 
  children, 
  fallback,
  use404 = false
}) => (
  <RoleGuard permission="ADMIN_ACCESS" fallback={fallback} use404Fallback={use404}>
    {children}
  </RoleGuard>
);

export const InstructorOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode; use404?: boolean }> = ({ 
  children, 
  fallback,
  use404 = false
}) => (
  <RoleGuard permission="INSTRUCTOR_ACCESS" fallback={fallback} use404Fallback={use404}>
    {children}
  </RoleGuard>
);

export const ManifestAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode; use404?: boolean }> = ({ 
  children, 
  fallback,
  use404 = false
}) => (
  <RoleGuard permission="VIEW_MANIFEST" fallback={fallback} use404Fallback={use404}>
    {children}
  </RoleGuard>
);

export const LoadManagementAccess: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode; use404?: boolean }> = ({ 
  children, 
  fallback,
  use404 = false
}) => (
  <RoleGuard permission="CREATE_LOAD" fallback={fallback} use404Fallback={use404}>
    {children}
  </RoleGuard>
);

/**
 * Convenience component for protecting entire routes/pages
 */
export const AuthRequired: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard permission="VIEW_DASHBOARD" requireAuth={true}>
    {children}
  </RoleGuard>
);

export default RoleGuard;
