import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Jump, User } from '@/types';
import { usersService } from '@/services/users';
import { formatSingleRole, formatUserName } from '@/lib/utils';

interface StaffAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (staffAssignments: Record<string, number>) => void;
  jump: Jump | null;
  loading?: boolean;
}

// Utility functions following KISS principle
const getUserDisplayName = (user: User): string => {
  return formatUserName(user);
};

const getStaffKey = (index: number): string => `staff_${index}`;

const StaffAssignmentModal: React.FC<StaffAssignmentModalProps> = ({
  open,
  onClose,
  onConfirm,
  jump,
  loading = false,
}) => {
  const [staffAssignments, setStaffAssignments] = useState<Record<string, number>>({});
  
  const additionalStaff = jump?.jump_type?.additional_staff || [];

  // Memoize users query for performance
  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'staff-assignment'],
    queryFn: () => usersService.getUsers({ limit: 1000 }),
    enabled: open,
  });

  // Reset assignments when modal opens or jump changes
  useEffect(() => {
    if (open) {
      setStaffAssignments({});
    }
  }, [open, jump]);

  const handleStaffAssignment = (staffIndex: number, userId: number | null) => {
    setStaffAssignments(prev => {
      const updated = { ...prev };
      const key = getStaffKey(staffIndex);
      if (userId) {
        updated[key] = userId;
      } else {
        delete updated[key];
      }
      return updated;
    });
  };

  const handleConfirm = () => {
    // Convert index-based assignments to role-based for API
    const roleAssignments: Record<string, number> = {};
    additionalStaff.forEach((staff, index) => {
      const userId = staffAssignments[getStaffKey(index)];
      if (userId) {
        roleAssignments[staff.staff_required_role] = userId;
      }
    });
    onConfirm(roleAssignments);
  };

  // Simplified completion check
  const isComplete = useMemo(() => {
    return additionalStaff.length === 0 || 
           additionalStaff.every((_, index) => staffAssignments[getStaffKey(index)]);
  }, [additionalStaff, staffAssignments]);

  // Extract filtering logic to separate function for clarity
  const getAvailableUsersForStaff = (staffIndex: number, requiredRole: string) => {
    // Users with the required role
    const roleUsers = allUsers.filter((user: User) => 
      user.roles?.some(userRole => userRole.role === requiredRole)
    );
    
    // Users already assigned to other positions
    const assignedUserIds = Object.entries(staffAssignments)
      .filter(([key]) => key !== getStaffKey(staffIndex))
      .map(([, userId]) => userId);

    // Available users (with role, not assigned elsewhere)
    return roleUsers.filter(user => !assignedUserIds.includes(user.id));
  };

  const getSelectedUser = (staffIndex: number): User | null => {
    const userId = staffAssignments[getStaffKey(staffIndex)];
    return userId ? allUsers.find(user => user.id === userId) || null : null;
  };

  // Check if role appears multiple times (for numbering)
  const getRoleCount = (role: string): number => {
    return additionalStaff.filter(staff => staff.staff_required_role === role).length;
  };

  if (!jump) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Assign Staff for {formatUserName(jump.user!)}'s Jump
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body1" gutterBottom>
            Jump Type: <strong>{jump.jump_type?.name}</strong>
          </Typography>
          
          {additionalStaff.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              This jump type does not require additional staff.
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                This jump type requires the following additional staff roles:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {additionalStaff.map((staff, index) => {
                  const availableUsers = getAvailableUsersForStaff(index, staff.staff_required_role);
                  const selectedUser = getSelectedUser(index);
                  const roleCount = getRoleCount(staff.staff_required_role);
                  const roleName = formatSingleRole(staff.staff_required_role);

                  return (
                    <Box key={getStaffKey(index)}>
                      <Typography variant="subtitle2" gutterBottom>
                        {roleName} *
                        {roleCount > 1 && <span> #{index + 1}</span>}
                      </Typography>
                      <Autocomplete
                        value={selectedUser}
                        onChange={(_, newValue) => 
                          handleStaffAssignment(index, newValue?.id || null)
                        }
                        options={availableUsers}
                        getOptionLabel={getUserDisplayName}
                        loading={isLoadingUsers}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={`Select ${roleName}`}
                            required
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {isLoadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                      {staff.staff_default_jump_type_id && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Will use default jump type for this role
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!isComplete || loading}
        >
          {loading ? 'Assigning...' : 'Assign to Load'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StaffAssignmentModal;
