import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Jump, CreateJumpData, UpdateJumpData } from '@/types';
import { usersService } from '@/services/users';
import { jumpTypesService } from '@/services/jump-types';

interface JumpModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateJumpData | UpdateJumpData) => void;
  jump?: Jump | null;
  loading?: boolean;
}

const JumpModal: React.FC<JumpModalProps> = ({
  open,
  onClose,
  onSave,
  jump,
  loading = false,
}) => {
  const [userId, setUserId] = useState<number | null>(null);
  const [jumpTypeId, setJumpTypeId] = useState<number | ''>('');
  const [comment, setComment] = useState('');

  // Fetch users for autocomplete
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers({ limit: 1000 }),
    enabled: open,
  });

  // Fetch jump types
  const jumpTypesQuery = useQuery({
    queryKey: ['jump-types'],
    queryFn: () => jumpTypesService.getJumpTypes({ limit: 100 }),
    enabled: open,
  });

  // Reset form when modal opens/closes or jump changes
  useEffect(() => {
    if (open) {
      if (jump) {
        setUserId(jump.user_id);
        setJumpTypeId(jump.jump_type_id);
        setComment(jump.comment || '');
      } else {
        setUserId(null);
        setJumpTypeId('');
        setComment('');
      }
    }
  }, [open, jump]);

  const handleSubmit = () => {
    if (!userId || !jumpTypeId) return;

    const data = {
      user_id: userId,
      jump_type_id: jumpTypeId as number,
      comment: comment || undefined,
    };

    onSave(data);
  };

  const users = usersQuery.data || [];
  const jumpTypes = jumpTypesQuery.data || [];
  const isValid = userId && jumpTypeId;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {jump ? 'Edit Jump' : 'Create Jump'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* User Selection */}
          <Autocomplete
            value={users.find(u => u.id === userId) || null}
            onChange={(_, newValue) => setUserId(newValue?.id || null)}
            options={users}
            getOptionLabel={(user) => `${user.first_name} ${user.last_name}${user.display_name ? ` (${user.display_name})` : ''}`}
            loading={usersQuery.isLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="User"
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

          {/* Jump Type Selection */}
          <FormControl fullWidth required>
            <InputLabel>Jump Type</InputLabel>
            <Select
              value={jumpTypeId}
              label="Jump Type"
              onChange={(e) => setJumpTypeId(e.target.value as number)}
              disabled={jumpTypesQuery.isLoading}
            >
              {jumpTypes.map((jumpType) => (
                <MenuItem key={jumpType.id} value={jumpType.id}>
                  {jumpType.name} ({jumpType.short_name})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Comment */}
          <TextField
            label="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JumpModal;
