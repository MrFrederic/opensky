import React, { useState } from 'react';
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
import { Jump } from '@/types';
import { usersService } from '@/services/users';

interface StaffAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (staffAssignments: Record<string, number>) => void;
  jump: Jump | null;
  loading?: boolean;
}

const StaffAssignmentModal: React.FC<StaffAssignmentModalProps> = ({
  open,
  onClose,
  onConfirm,
  jump,
  loading = false,
}) => {
  const [staffAssignments, setStaffAssignments] = useState<Record<string, number>>({});

  // Fetch users for autocomplete
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers({ limit: 1000 }),
    enabled: open,
  });

  const users = usersQuery.data || [];
  const additionalStaff = jump?.jump_type?.additional_staff || [];

  // Reset assignments when modal opens or jump changes
  React.useEffect(() => {
    if (open && jump) {
      setStaffAssignments({});
    }
  }, [open, jump]);

  const handleStaffAssignment = (role: string, userId: number | null) => {
    setStaffAssignments(prev => {
      const updated = { ...prev };
      if (userId) {
        updated[role] = userId;
      } else {
        delete updated[role];
      }
      return updated;
    });
  };

  const handleConfirm = () => {
    onConfirm(staffAssignments);
  };

  const isComplete = additionalStaff.length === 0 || 
    additionalStaff.every(staff => staffAssignments[staff.staff_required_role]);

  const getUserDisplayName = (user: any) => {
    if (user.display_name) {
      return user.display_name;
    }
    return `${user.first_name} ${user.last_name}`;
  };

  if (!jump) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Assign Staff for {jump.user?.first_name} {jump.user?.last_name}'s Jump
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
                  // Exclude users already assigned to other roles
                  const assignedUserIds = Object.entries(staffAssignments)
                    .filter(([role]) => role !== staff.staff_required_role)
                    .map(([, userId]) => userId);

                  const availableUsers = users.filter(
                    (u) => !assignedUserIds.includes(u.id)
                  );

                  return (
                    <Box key={index}>
                      <Typography variant="subtitle2" gutterBottom>
                        {staff.staff_required_role.replace('_', ' ').toUpperCase()} *
                      </Typography>
                      <Autocomplete
                        value={users.find(u => u.id === staffAssignments[staff.staff_required_role]) || null}
                        onChange={(_, newValue) => 
                          handleStaffAssignment(staff.staff_required_role, newValue?.id || null)
                        }
                        options={availableUsers}
                        getOptionLabel={getUserDisplayName}
                        loading={usersQuery.isLoading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={`Select ${staff.staff_required_role.replace('_', ' ')}`}
                            required
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {usersQuery.isLoading ? <CircularProgress color="inherit" size={20} /> : null}
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
