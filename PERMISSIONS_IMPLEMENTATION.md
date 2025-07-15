# Permission-Based Access Control Implementation

## Overview

This document describes the implementation of the new permission-based access control system for the Dropzone Management System. The system provides centralized permission management from the backend while maintaining backward compatibility with the existing role-based approach.

## Architecture

### Backend Implementation

#### 1. Permission System (`app/core/permissions.py`)

The core of the system is a simple role-to-permission mapping dictionary:

```python
ROLE_PERMISSIONS = {
    UserRole.TANDEM_JUMPER: [
        "VIEW_DASHBOARD",
        "VIEW_TANDEMS",
    ],
    UserRole.SPORT_PAID: [
        "VIEW_DASHBOARD",
        "VIEW_TANDEMS",
        "VIEW_MANIFEST", 
        "CREATE_LOAD",
        "VIEW_LOADS",
        "VIEW_LOGBOOK",
        "JOIN_MANIFEST",
    ],
    # ... more roles
}
```

#### 2. Permission Functions

- `get_user_permissions(user_roles)`: Returns all permissions for a list of roles
- `has_permission(user_roles, permission)`: Checks if roles have a specific permission
- `@require_permission(permission)`: Decorator for protecting API endpoints

#### 3. API Endpoint

- `GET /users/me/permissions`: Returns the current user's permissions

### Frontend Implementation

#### 1. Auth Store Updates

The `useAuthStore` now includes:
- `permissions: string[]`: Cached user permissions
- `hasPermission(permission: string)`: Permission checking function
- `fetchPermissions()`: Fetches permissions from backend

#### 2. Permission Guard Component

New `PermissionGuard` component for permission-based UI control:

```tsx
<PermissionGuard permission="CREATE_LOAD">
  <CreateLoadButton />
</PermissionGuard>
```

#### 3. Updated Role Guard

The existing `RoleGuard` now supports both systems:
- Uses new permission system when available
- Falls back to role-based checking for backward compatibility

## Available Permissions

### Basic Access
- `VIEW_DASHBOARD`: Dashboard access
- `VIEW_TANDEMS`: Tandem booking views
- `VIEW_MANIFEST`: Manifest access
- `VIEW_LOADS`: Load listing/viewing
- `VIEW_LOGBOOK`: Logbook access

### Feature Permissions
- `CREATE_LOAD`: Create new loads
- `JOIN_MANIFEST`: Join manifest for jumps
- `APPROVE_JUMPS`: Approve/validate jumps
- `MANAGE_MANIFEST`: Manage manifest entries

### Administrative Permissions
- `ADMIN_ACCESS`: Administrative panel access
- `INSTRUCTOR_ACCESS`: General instructor features
- `TANDEM_INSTRUCTOR_ACCESS`: Tandem instructor features
- `AFF_INSTRUCTOR_ACCESS`: AFF instructor features
- `MANAGE_USERS`: User management
- `MANAGE_LOADS`: Load management
- `MANAGE_AIRCRAFT`: Aircraft management
- `MANAGE_JUMP_TYPES`: Jump type management
- `MANAGE_SETTINGS`: System settings

## Migration Strategy

### Phase 1: Backend Foundation ✅
- [x] Create permission system
- [x] Add permissions endpoint
- [x] Apply @require_permission decorator to key endpoints
- [x] Update auth store with permission support

### Phase 2: Frontend Integration ✅
- [x] Create PermissionGuard component
- [x] Update RoleGuard for hybrid support
- [x] Add permission hooks and utilities

### Phase 3: Gradual Migration (In Progress)
- [ ] Replace RoleGuard usage with PermissionGuard in new components
- [ ] Update existing components gradually
- [ ] Apply more @require_permission decorators to backend endpoints
- [ ] Update navigation and routing logic

### Phase 4: Cleanup (Future)
- [ ] Remove role-based fallbacks
- [ ] Consolidate to single permission system
- [ ] Remove deprecated RBAC utilities

## Usage Examples

### Backend API Protection

```python
@router.post("/", response_model=LoadResponse)
@require_permission("CREATE_LOAD")
def create_load(
    load_create: LoadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only users with CREATE_LOAD permission can access
    return load_crud.create(db, obj_in=load_create, created_by=current_user.id)
```

### Frontend Component Protection

```tsx
// New permission-based approach
<PermissionGuard permission="MANAGE_USERS">
  <UserManagementPanel />
</PermissionGuard>

// Backward-compatible RoleGuard (now supports permissions)
<RoleGuard permission="CREATE_LOAD">
  <CreateLoadButton />
</RoleGuard>

// Hook-based conditional logic
const { hasPermission } = usePermissionCheck();

if (hasPermission('APPROVE_JUMPS')) {
  // Show approval UI
}
```

### Convenience Components

```tsx
// Predefined permission guards
<AdminOnly>
  <AdminPanel />
</AdminOnly>

<InstructorOnly>
  <InstructorTools />
</InstructorOnly>

<ManifestAccess>
  <ManifestComponent />
</ManifestAccess>
```

## Benefits

1. **Centralized Control**: All permissions managed from backend
2. **Security**: Frontend cannot manipulate permissions
3. **Flexibility**: Easy to modify permissions without code changes
4. **Consistency**: Same permissions used for UI and API protection
5. **Backward Compatibility**: Existing code continues to work
6. **Performance**: Permissions cached on frontend
7. **Maintainability**: Single source of truth

## Testing

To test the permission system:

1. **Backend**: Check `/users/me/permissions` endpoint returns correct permissions
2. **Frontend**: Use PermissionGuard components with different permissions
3. **API Protection**: Try accessing protected endpoints without proper permissions
4. **Examples**: Check `PermissionBasedExamples.tsx` for comprehensive examples

## Configuration

Permissions are configured in `backend/app/core/permissions.py`. To add a new permission:

1. Add it to the relevant role(s) in `ROLE_PERMISSIONS`
2. Use `@require_permission("NEW_PERMISSION")` on backend endpoints
3. Use `<PermissionGuard permission="NEW_PERMISSION">` on frontend

## Security Considerations

- Permissions are always validated on the backend
- Frontend permission checks are for UX only
- All sensitive API endpoints must use `@require_permission`
- Permissions are fetched fresh on login/authentication
- Failed permission checks return appropriate HTTP status codes

## Future Enhancements

1. **Dynamic Permissions**: Database-stored permissions for runtime changes
2. **Resource-based Permissions**: Object-level permissions (e.g., "edit own loads")
3. **Permission Groups**: Hierarchical permission structures
4. **Audit Logging**: Track permission usage and changes
5. **Admin UI**: GUI for managing role-permission mappings
