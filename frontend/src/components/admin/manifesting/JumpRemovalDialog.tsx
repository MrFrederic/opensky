import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import { Jump } from '@/types';
import { JumpSummary } from '@/services/manifest';

interface JumpRemovalDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (clearStaffAssignments: boolean) => void;
  jump: Jump | JumpSummary | null;
}

const JumpRemovalDialog: React.FC<JumpRemovalDialogProps> = ({
  open,
  onClose,
  onConfirm,
  jump,
}) => {
  if (!jump) {
    return null;
  }

  const handleKeepStaff = () => {
    onConfirm(false); // Don't clear staff assignments
  };

  const handleClearStaff = () => {
    onConfirm(true); // Clear staff assignments
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Remove Jump from Load
      </DialogTitle>
      <DialogContent>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This jump has staff assignments. What would you like to do with them?
          </Alert>
      </DialogContent>

      <DialogActions sx={{ flexDirection: 'row', gap: 1, p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth
        >
          Cancel
        </Button>
        <Button
          onClick={handleClearStaff}
          variant="contained"
          color="error"
          fullWidth
        >
          Clear
        </Button>
        <Button
          onClick={handleKeepStaff}
          variant="contained"
          color="primary"
          fullWidth
        >
          Keep
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JumpRemovalDialog;
