import React from 'react';
import { useUser } from '@/hooks/useUser';
import { UserRole } from '@/types';
import { hasRole, hasAnyRole, hasAllRoles, hasPermission, ROLE_PERMISSIONS } from '@/lib/rbac';

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
}

/**
 * Component that conditionally renders children based on user roles or permissions
 * Following KISS principle - simple, declarative role checking
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  role,
  anyRole,
  allRoles,
  permission,
  fallback = null,
  showLoadingState = false
}) => {
  const { user, isLoading } = useUser();

  // Show loading state if requested and user data is being fetched
  if (isLoading && showLoadingState) {
    return <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>;
  }

  // Check permissions based on provided props
  let hasAccess = false;

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
