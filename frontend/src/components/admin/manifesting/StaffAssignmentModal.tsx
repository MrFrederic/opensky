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
import { JumpSummary } from '@/services/manifest';
import { usersService } from '@/services/users';
import { formatSingleRole, formatUserName } from '@/lib/utils';

interface StaffAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (staffAssignments: Record<string, number>) => void;
  jump: Jump | JumpSummary | null;
  loading?: boolean;
}

// Utility functions following KISS principle
const getUserDisplayName = (user: User): string => {
  return formatUserName(user);
};

const getStaffKey = (additionalStaffId: number): string => `staff_${additionalStaffId}`;

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
    if (open && jump) {
      // Pre-populate with existing staff assignments if available
      const existingAssignments: Record<string, number> = {};
      if (jump.staff_assignments) {
        Object.entries(jump.staff_assignments).forEach(([additionalStaffId, userId]) => {
          existingAssignments[getStaffKey(parseInt(additionalStaffId))] = userId;
        });
      }
      setStaffAssignments(existingAssignments);
    }
  }, [open, jump]);

  const handleStaffAssignment = (additionalStaffId: number, userId: number | null) => {
    setStaffAssignments(prev => {
      const updated = { ...prev };
      const key = getStaffKey(additionalStaffId);
      if (userId) {
        updated[key] = userId;
      } else {
        delete updated[key];
      }
      return updated;
    });
  };

  const handleConfirm = () => {
    // Convert additional_staff_id-based assignments to the format expected by backend
    const staffAssignmentsByAdditionalStaffId: Record<string, number> = {};
    additionalStaff.forEach((staff) => {
      const userId = staffAssignments[getStaffKey(staff.id)];
      if (userId) {
        staffAssignmentsByAdditionalStaffId[staff.id.toString()] = userId;
      }
    });
    onConfirm(staffAssignmentsByAdditionalStaffId);
  };

  // Extract filtering logic to separate function for clarity
  const getAvailableUsersForStaff = (additionalStaffId: number, requiredRole: string) => {
    // Get parent jump user ID
    const parentJumpUserId = jump && 'user' in jump && jump.user 
      ? jump.user.id 
      : jump && 'user_id' in jump 
      ? jump.user_id 
      : null;

    // Users with the required role
    const roleUsers = allUsers.filter((user: User) => 
      user.roles?.some(userRole => userRole.role === requiredRole)
    );
    
    // Users already assigned to other positions
    const assignedUserIds = Object.entries(staffAssignments)
      .filter(([key]) => key !== getStaffKey(additionalStaffId))
      .map(([, userId]) => userId);

    // Available users (with role, not assigned elsewhere, not the parent jump user)
    return roleUsers.filter(user => 
      !assignedUserIds.includes(user.id) && 
      user.id !== parentJumpUserId
    );
  };

  // Validation function for duplicate users
  const getValidationMessage = (additionalStaffId: number): string | null => {
    const selectedUserId = staffAssignments[getStaffKey(additionalStaffId)];
    if (!selectedUserId) return null;

    // Check if user is the parent jump user
    const parentJumpUserId = jump && 'user' in jump && jump.user 
      ? jump.user.id 
      : jump && 'user_id' in jump 
      ? jump.user_id 
      : null;

    if (selectedUserId === parentJumpUserId) {
      return "Staff user cannot be the same as the jump user";
    }

    // Check if user is selected for another position
    const duplicateKeys = Object.entries(staffAssignments)
      .filter(([key, userId]) => key !== getStaffKey(additionalStaffId) && userId === selectedUserId)
      .map(([key]) => key);

    if (duplicateKeys.length > 0) {
      return "This user is already assigned to another staff position";
    }

    return null;
  };

  // Simplified completion check
  const isComplete = useMemo(() => {
    if (additionalStaff.length === 0) return true;
    
    // Check if all positions are filled
    const allPositionsFilled = additionalStaff.every((staff) => 
      staffAssignments[getStaffKey(staff.id)]
    );
    
    // Check if there are any validation errors
    const hasValidationErrors = additionalStaff.some((staff) => 
      getValidationMessage(staff.id) !== null
    );
    
    return allPositionsFilled && !hasValidationErrors;
  }, [additionalStaff, staffAssignments]);

  const getSelectedUser = (additionalStaffId: number): User | null => {
    const userId = staffAssignments[getStaffKey(additionalStaffId)];
    return userId ? allUsers.find(user => user.id === userId) || null : null;
  };

  // Check if role appears multiple times (for numbering)
  const getRoleCount = (role: string): number => {
    return additionalStaff.filter(staff => staff.staff_required_role === role).length;
  };

  if (!jump) {
    return null;
  }

  const jumpUserName = 'user' in jump && jump.user 
    ? formatUserName(jump.user) 
    : 'user_name' in jump 
    ? jump.user_name 
    : 'Unknown User';

  const jumpTypeName = jump.jump_type?.name || 'Unknown Jump Type';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Assign Staff for {jumpUserName}'s Jump
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body1" gutterBottom>
            Jump Type: <strong>{jumpTypeName}</strong>
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
                  const availableUsers = getAvailableUsersForStaff(staff.id, staff.staff_required_role);
                  const selectedUser = getSelectedUser(staff.id);
                  const roleCount = getRoleCount(staff.staff_required_role);
                  const roleName = formatSingleRole(staff.staff_required_role);
                  const validationMessage = getValidationMessage(staff.id);

                  return (
                    <Box key={getStaffKey(staff.id)}>
                      <Typography variant="subtitle2" gutterBottom>
                        {roleName} *
                        {roleCount > 1 && <span> #{index + 1}</span>}
                      </Typography>
                      <Autocomplete
                        value={selectedUser}
                        onChange={(_, newValue) => 
                          handleStaffAssignment(staff.id, newValue?.id || null)
                        }
                        options={availableUsers}
                        getOptionLabel={getUserDisplayName}
                        loading={isLoadingUsers}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={`Select ${roleName}`}
                            required
                            error={!!validationMessage}
                            helperText={validationMessage}
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
