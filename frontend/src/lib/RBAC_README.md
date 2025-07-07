# Role-Based Access Control (RBAC) Framework

This framework provides a simple, declarative way to control UI element visibility and functionality based on user roles received from the backend API (`/api/v1/users/me`).

## Overview

The RBAC framework follows the KISS (Keep It Simple, Stupid) principle and provides:
- Type-safe role checking
- Declarative component-based access control
- React hooks for conditional logic
- Pre-defined convenience components
- Aligned with backend `UserRole` enum

## User Roles

The system supports the following roles (matching backend implementation):

```typescript
enum UserRole {
  TANDEM_JUMPER = "tandem_jumper",        // Basic role for new users
  AFF_STUDENT = "aff_student",            // AFF learning students
  SPORT_PAID = "sport_paid",              // Licensed sport jumpers (paid)
  SPORT_FREE = "sport_free",              // Licensed sport jumpers (free)
  TANDEM_INSTRUCTOR = "tandem_instructor", // Tandem instructors
  AFF_INSTRUCTOR = "aff_instructor",       // AFF instructors
  ADMINISTRATOR = "administrator"          // System administrators
}
```

## Core Components

### 1. RoleGuard Component

The main component for conditional rendering based on roles or permissions:

```tsx
import { RoleGuard } from '@/components/auth/RoleGuard';
import { UserRole } from '@/types';

// Permission-based (recommended)
<RoleGuard permission="VIEW_MANIFEST">
  <ManifestComponent />
</RoleGuard>

// Specific role
<RoleGuard role={UserRole.ADMINISTRATOR}>
  <AdminPanel />
</RoleGuard>

// Any of multiple roles
<RoleGuard anyRole={[UserRole.SPORT_PAID, UserRole.SPORT_FREE]}>
  <SportJumperFeatures />
</RoleGuard>

// All roles required
<RoleGuard allRoles={[UserRole.TANDEM_INSTRUCTOR, UserRole.AFF_INSTRUCTOR]}>
  <FullInstructorPanel />
</RoleGuard>

// With fallback content
<RoleGuard 
  permission="ADMIN_ACCESS"
  fallback={<div>Access denied</div>}
>
  <AdminContent />
</RoleGuard>
```

### 2. Convenience Components

Pre-built components for common role checks:

```tsx
import { AdminOnly, InstructorOnly, SportJumperOnly, ExcludeNewUsers } from '@/components/auth/RoleGuard';

<AdminOnly>
  <DeleteButton />
</AdminOnly>

<InstructorOnly>
  <ApprovalPanel />
</InstructorOnly>

<SportJumperOnly>
  <ManifestJoinButton />
</SportJumperOnly>

<ExcludeNewUsers>
  <AdvancedFeatures />
</ExcludeNewUsers>
```

### 3. useRoleCheck Hook

For conditional logic within components:

```tsx
import { useRoleCheck } from '@/components/auth/RoleGuard';
import { UserRole } from '@/types';

const MyComponent = () => {
  const { hasRole, hasAnyRole, hasPermission } = useRoleCheck();

  const canApprove = hasPermission('INSTRUCTOR_ACCESS');
  const isAdmin = hasRole(UserRole.ADMINISTRATOR);
  const canJumpSolo = hasAnyRole([UserRole.SPORT_PAID, UserRole.SPORT_FREE]);

  return (
    <div>
      {canApprove && <ApprovalButton />}
      {isAdmin && <AdminSettings />}
      {canJumpSolo && <SoloJumpOptions />}
    </div>
  );
};
```

## Utility Functions

Direct utility functions are available in `@/lib/rbac`:

```typescript
import { 
  hasRole, 
  hasAnyRole, 
  hasAllRoles, 
  hasPermission, 
  isAdmin, 
  isInstructor, 
  isSportJumper, 
  isNewUser 
} from '@/lib/rbac';

// Usage
const userCanApprove = hasPermission(user, 'INSTRUCTOR_ACCESS');
const userIsAdmin = isAdmin(user);
const userCanJump = isSportJumper(user);
```

## Permissions

Pre-defined permissions provide a higher-level abstraction over roles:

### Available Permissions

- `VIEW_DASHBOARD` - All authenticated users
- `VIEW_TANDEMS` - All authenticated users  
- `VIEW_MANIFEST` - Sport jumpers, instructors, admins
- `VIEW_LOGBOOK` - Sport jumpers, instructors, admins
- `VIEW_LOADS` - Sport jumpers, instructors, admins
- `ADMIN_ACCESS` - Administrators only
- `INSTRUCTOR_ACCESS` - Any instructor + admins
- `TANDEM_INSTRUCTOR_ACCESS` - Tandem instructors + admins
- `AFF_INSTRUCTOR_ACCESS` - AFF instructors + admins

### Using Permissions vs Roles

**Recommended: Use permissions for feature access**
```tsx
// Good - semantic and maintainable
<RoleGuard permission="VIEW_MANIFEST">
  <ManifestComponent />
</RoleGuard>
```

**Use roles for specific business logic**
```tsx
// When you specifically need a role check
<RoleGuard role={UserRole.TANDEM_INSTRUCTOR}>
  <TandemInstructorBadge />
</RoleGuard>
```

## Navigation Example

Here's how the Header component uses RBAC:

```tsx
<nav className="hidden md:flex space-x-8">
  <Link to="/">Home</Link>
  {isAuthenticated && (
    <>
      <RoleGuard permission="VIEW_DASHBOARD">
        <Link to="/dashboard">Dashboard</Link>
      </RoleGuard>
      
      <RoleGuard permission="VIEW_TANDEMS">
        <Link to="/tandems">Tandems</Link>
      </RoleGuard>
      
      <ExcludeNewUsers>
        <RoleGuard permission="VIEW_MANIFEST">
          <Link to="/manifest">Manifest</Link>
        </RoleGuard>
        
        <RoleGuard permission="VIEW_LOADS">
          <Link to="/loads">Loads</Link>
        </RoleGuard>
      </ExcludeNewUsers>
      
      {/* Administration dropdown - only for admins */}
      <AdminOnly>
        <div className="relative" onMouseEnter={() => setShowAdminDropdown(true)}>
          <button>Administration ⌄</button>
          {showAdminDropdown && (
            <div className="absolute dropdown-menu">
              <Link to="/admin/users">Users</Link>
            </div>
          )}
        </div>
      </AdminOnly>
    </>
  )}
</nav>
```

## Data Model Alignment

The frontend User type is now aligned with the backend:

```typescript
interface User {
  id: number;
  telegram_id: string;
  first_name: string;
  last_name: string;
  username?: string;
  email?: string;
  phone?: string;
  license_document_url?: string;
  roles: UserRoleAssignment[];  // NEW: Replaces status/is_admin
  created_at: string;
  updated_at?: string;
}

interface UserRoleAssignment {
  role: UserRole;
  created_at: string;
}
```

## Best Practices

1. **Use permissions over roles** when possible for maintainability
2. **Keep access control declarative** - prefer components over imperative checks
3. **Provide fallback content** for better UX when access is denied
4. **Use convenience components** for common patterns (AdminOnly, InstructorOnly, etc.)
5. **Test with different role combinations** to ensure proper access control

## Migration from Old System

The old system used `status` and `is_admin` fields:

```tsx
// OLD - Don't use anymore
{user?.status !== 'newby' && <AdvancedFeatures />}
{user?.is_admin && <AdminPanel />}

// NEW - Use RBAC
<ExcludeNewUsers>
  <AdvancedFeatures />
</ExcludeNewUsers>
<AdminOnly>
  <AdminPanel />
</AdminOnly>
```

## Examples

See `@/components/examples/RoleBasedExamples.tsx` for comprehensive usage examples of all RBAC features.
