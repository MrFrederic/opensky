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
import { UserRole } from '@/types';
import { hasRole, hasAnyRole, hasAllRoles, hasPermission, ROLE_PERMISSIONS } from '@/lib/rbac';
import LoginModal from './LoginModal';

interface RoleGuardProps {
  children: React.ReactNode;
  /** Show content only if user has this specific role */
  role?: UserRole;
  /** Show content only if user has any of these roles */
  anyRole?: UserRole[];
  /** Show content only if user has all of these roles */
  allRoles?: UserRole[];
  /** Show content only if user has this permission */
  permission?: keyof typeof ROLE_PERMISSIONS;
  /** Show this content if user doesn't have required roles/permissions */
  fallback?: React.ReactNode;
  /** If true, show loading state while user data is being fetched */
  showLoadingState?: boolean;
  /** If true, show full-page authentication required screen for unauthenticated users */
  requireAuth?: boolean;
}

/**
 * Component that conditionally renders children based on user roles or permissions
 * Following KISS principle - simple, declarative role checking with authentication support
 * 
 * @example
 * // Route protection (replaces ProtectedRoute)
 * <RoleGuard requireAuth={true}>
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * @example
 * // Permission-based UI
 * <RoleGuard permission="ADMIN_ACCESS">
 *   <AdminButton />
 * </RoleGuard>
 * 
 * @example
 * // Role-based UI
 * <RoleGuard role={UserRole.TANDEM_INSTRUCTOR}>
 *   <InstructorTools />
 * </RoleGuard>
 * 
 * @example
 * // Multiple roles with fallback
 * <RoleGuard anyRole={[UserRole.SPORT_PAID, UserRole.SPORT_FREE]} fallback={<UpgradePrompt />}>
 *   <SportJumperFeatures />
 * </RoleGuard>
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  role,
  anyRole,
  allRoles,
  permission,
  fallback = null,
  showLoadingState = false,
  requireAuth = false
}) => {
  const { user, isLoading } = useUser();
  const { isAuthenticated } = useAuthStore();
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

  // If authentication is required but we're here, user is authenticated
  // OR if authentication is not required, proceed with role/permission checks
  let hasAccess = true; // Default to true if no specific checks are required

  if (permission) {
    hasAccess = hasPermission(user, permission);
  } else if (role) {
    hasAccess = hasRole(user, role);
  } else if (anyRole) {
    hasAccess = hasAnyRole(user, anyRole);
  } else if (allRoles) {
    hasAccess = hasAllRoles(user, allRoles);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

/**
 * Hook for role-based conditional logic in components
 */
export const useRoleCheck = () => {
  const { user, isLoading } = useUser();

  return {
    user,
    isLoading,
    hasRole: (role: UserRole) => hasRole(user, role),
    hasAnyRole: (roles: UserRole[]) => hasAnyRole(user, roles),
    hasAllRoles: (roles: UserRole[]) => hasAllRoles(user, roles),
    hasPermission: (permission: keyof typeof ROLE_PERMISSIONS) => hasPermission(user, permission),
  };
};

/**
 * Convenience components for common role checks
 */

export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard permission="ADMIN_ACCESS" fallback={fallback}>
    {children}
  </RoleGuard>
);

export const InstructorOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard permission="INSTRUCTOR_ACCESS" fallback={fallback}>
    {children}
  </RoleGuard>
);

export const SportJumperOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard anyRole={[UserRole.SPORT_PAID, UserRole.SPORT_FREE, UserRole.AFF_STUDENT]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const ExcludeNewUsers: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <RoleGuard 
    anyRole={[
      UserRole.AFF_STUDENT,
      UserRole.SPORT_PAID, 
      UserRole.SPORT_FREE, 
      UserRole.TANDEM_INSTRUCTOR, 
      UserRole.AFF_INSTRUCTOR, 
      UserRole.ADMINISTRATOR
    ]} 
    fallback={fallback}
  >
    {children}
  </RoleGuard>
);

/**
 * Convenience component for protecting entire routes/pages
 * Equivalent to the old ProtectedRoute but using RoleGuard
 */
export const AuthRequired: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard requireAuth={true}>
    {children}
  </RoleGuard>
);
