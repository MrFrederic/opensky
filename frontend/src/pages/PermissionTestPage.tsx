import React from 'react';
import { useAuthStore } from '@/stores/auth';
import { RoleGuard, useRoleCheck, AdminOnly, InstructorOnly, ManifestAccess, LoadManagementAccess } from '@/components/auth/RoleGuard';
import { Button, Box, Typography, Paper, Chip, Alert } from '@mui/material';

const PermissionTestPage: React.FC = () => {
  const { user, isAuthenticated, permissions, fetchPermissions } = useAuthStore();
  const { hasPermission } = useRoleCheck();
  const { hasPermission: hasRolePermission } = useRoleCheck();

  const testPermissions = [
    'VIEW_DASHBOARD',
    'VIEW_TANDEMS',
    'VIEW_MANIFEST',
    'VIEW_LOADS',
    'CREATE_LOAD',
    'MANAGE_LOADS',
    'INSTRUCTOR_ACCESS',
    'ADMIN_ACCESS',
    'APPROVE_JUMPS',
    'MANAGE_USERS',
  ];

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Permission System Test Page
      </Typography>

      {!isAuthenticated ? (
        <Alert severity="warning" sx={{ mb: 4 }}>
          Please log in to test the permission system. This page demonstrates both the new permission-based
          and legacy role-based access control systems.
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 4 }}>
          Logged in as: {user?.first_name} {user?.last_name} ({user?.username})
        </Alert>
      )}

      {/* User Information */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Current User Information
        </Typography>
        
        {user && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Roles:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {user.roles?.map((roleAssignment, index) => (
                <Chip key={index} label={roleAssignment.role} color="primary" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        <Typography variant="h6" gutterBottom>
          Current Permissions: ({permissions.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {permissions.map((permission, index) => (
            <Chip key={index} label={permission} color="success" size="small" />
          ))}
        </Box>

        <Button 
          variant="outlined" 
          onClick={fetchPermissions}
          sx={{ mb: 2 }}
        >
          Refresh Permissions
        </Button>
      </Paper>

      {/* Permission Testing Grid */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Permission Testing
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
          {testPermissions.map((permission) => (
            <Box key={permission} sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                {permission}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  New System: {hasPermission(permission) ? '✅ Has Permission' : '❌ No Permission'}
                </Typography>
                <Typography variant="body2">
                  Legacy System: {hasRolePermission(permission as any) ? '✅ Has Permission' : '❌ No Permission'}
                </Typography>
              </Box>

              <RoleGuard 
                permission={permission}
                fallback={<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Permission Guard: Hidden</Typography>}
              >
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  Permission Guard: Visible ✅
                </Typography>
              </RoleGuard>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Component Testing */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Component Testing
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
          <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Admin Only</Typography>
            <AdminOnly fallback={<Typography color="text.secondary">Admin access required</Typography>}>
              <Typography color="success.main">✅ Admin content visible</Typography>
            </AdminOnly>
          </Box>

          <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Instructor Only</Typography>
            <InstructorOnly fallback={<Typography color="text.secondary">Instructor access required</Typography>}>
              <Typography color="success.main">✅ Instructor content visible</Typography>
            </InstructorOnly>
          </Box>

          <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Manifest Access</Typography>
            <ManifestAccess fallback={<Typography color="text.secondary">Manifest access required</Typography>}>
              <Typography color="success.main">✅ Manifest content visible</Typography>
            </ManifestAccess>
          </Box>

          <Box sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Load Management</Typography>
            <LoadManagementAccess fallback={<Typography color="text.secondary">Load management access required</Typography>}>
              <Typography color="success.main">✅ Load management visible</Typography>
            </LoadManagementAccess>
          </Box>
        </Box>
      </Paper>

      {/* Legacy vs New System Comparison */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Legacy vs New System Comparison
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              New Permission System
            </Typography>
            <RoleGuard permission="CREATE_LOAD">
              <Button variant="contained" fullWidth>
                Create Load (Permission-based)
              </Button>
            </RoleGuard>
            <RoleGuard permission="MANAGE_USERS">
              <Button variant="contained" sx={{ mt: 1 }} fullWidth>
                Manage Users (Permission-based)
              </Button>
            </RoleGuard>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom color="secondary">
              Legacy Role System
            </Typography>
            <RoleGuard permission="ADMIN_ACCESS">
              <Button variant="outlined" fullWidth>
                Create Load (Role-based)
              </Button>
            </RoleGuard>
            <RoleGuard permission="ADMIN_ACCESS">
              <Button variant="outlined" sx={{ mt: 1 }} fullWidth>
                Admin Panel (Role-based)
              </Button>
            </RoleGuard>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PermissionTestPage;
