import { User, UserRole } from '@/types';

/**
 * Simple RBAC utility functions following KISS principle
 */

/**
 * Get all roles for a user as an array
 */
export const getUserRoles = (user: User | null): UserRole[] => {
  if (!user || !user.roles) return [];
  return user.roles.map(roleAssignment => roleAssignment.role);
};

/**
 * Check if user has a specific role
 */
export const hasRole = (user: User | null, role: UserRole): boolean => {
  const userRoles = getUserRoles(user);
  return userRoles.includes(role);
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user: User | null, roles: UserRole[]): boolean => {
  const userRoles = getUserRoles(user);
  return roles.some(role => userRoles.includes(role));
};

/**
 * Check if user has all of the specified roles
 */
export const hasAllRoles = (user: User | null, roles: UserRole[]): boolean => {
  const userRoles = getUserRoles(user);
  return roles.every(role => userRoles.includes(role));
};

/**
 * Check if user is an administrator
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, UserRole.ADMINISTRATOR);
};

/**
 * Check if user is an instructor (any type)
 */
export const isInstructor = (user: User | null): boolean => {
  return hasAnyRole(user, [UserRole.TANDEM_INSTRUCTOR, UserRole.AFF_INSTRUCTOR]);
};

/**
 * Check if user is a sport jumper (paid or free)
 */
export const isSportJumper = (user: User | null): boolean => {
  return hasAnyRole(user, [UserRole.SPORT_PAID, UserRole.SPORT_FREE]);
};

/**
 * Check if user is a new/basic user (only tandem jumper role)
 */
export const isNewUser = (user: User | null): boolean => {
  const userRoles = getUserRoles(user);
  return userRoles.length === 1 && userRoles.includes(UserRole.TANDEM_JUMPER);
};

/**
 * Role hierarchy definitions for permission checking
 */
export const ROLE_PERMISSIONS = {
  // Basic access - all authenticated users
  VIEW_DASHBOARD: [
    UserRole.TANDEM_JUMPER,
    UserRole.AFF_STUDENT,
    UserRole.SPORT_PAID,
    UserRole.SPORT_FREE,
    UserRole.TANDEM_INSTRUCTOR,
    UserRole.AFF_INSTRUCTOR,
    UserRole.ADMINISTRATOR
  ],
  
  // Tandem bookings - all users can view/book
  VIEW_TANDEMS: [
    UserRole.TANDEM_JUMPER,
    UserRole.AFF_STUDENT,
    UserRole.SPORT_PAID,
    UserRole.SPORT_FREE,
    UserRole.TANDEM_INSTRUCTOR,
    UserRole.AFF_INSTRUCTOR,
    UserRole.ADMINISTRATOR
  ],
  
  // Manifest - sport jumpers and instructors
  VIEW_MANIFEST: [
    UserRole.AFF_STUDENT,
    UserRole.SPORT_PAID,
    UserRole.SPORT_FREE,
    UserRole.TANDEM_INSTRUCTOR,
    UserRole.AFF_INSTRUCTOR,
    UserRole.ADMINISTRATOR
  ],
  
  // Logbook - sport jumpers and instructors
  VIEW_LOGBOOK: [
    UserRole.AFF_STUDENT,
    UserRole.SPORT_PAID,
    UserRole.SPORT_FREE,
    UserRole.TANDEM_INSTRUCTOR,
    UserRole.AFF_INSTRUCTOR,
    UserRole.ADMINISTRATOR
  ],
  
  // Loads - sport jumpers and instructors
  VIEW_LOADS: [
    UserRole.AFF_STUDENT,
    UserRole.SPORT_PAID,
    UserRole.SPORT_FREE,
    UserRole.TANDEM_INSTRUCTOR,
    UserRole.AFF_INSTRUCTOR,
    UserRole.ADMINISTRATOR
  ],
  
  // Admin features
  ADMIN_ACCESS: [UserRole.ADMINISTRATOR],
  
  // Instructor features
  INSTRUCTOR_ACCESS: [
    UserRole.TANDEM_INSTRUCTOR,
    UserRole.AFF_INSTRUCTOR,
    UserRole.ADMINISTRATOR
  ],
  
  // Tandem instructor specific
  TANDEM_INSTRUCTOR_ACCESS: [
    UserRole.TANDEM_INSTRUCTOR,
    UserRole.ADMINISTRATOR
  ],
  
  // AFF instructor specific
  AFF_INSTRUCTOR_ACCESS: [
    UserRole.AFF_INSTRUCTOR,
    UserRole.ADMINISTRATOR
  ]
} as const;

/**
 * Check if user has permission for a specific action
 */
export const hasPermission = (user: User | null, permission: keyof typeof ROLE_PERMISSIONS): boolean => {
  return hasAnyRole(user, [...ROLE_PERMISSIONS[permission]]);
};
