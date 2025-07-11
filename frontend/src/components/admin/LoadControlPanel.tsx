import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Button,
  InputLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import { Load, LoadStatus } from '@/types';

interface LoadControlPanelProps {
  selectedLoad: Load;
  onStatusChange: (loadId: number, status: LoadStatus) => void;
  onReservedSpacesChange: (loadId: number, spaces: number) => void;
  onDepartureTimeChange?: (loadId: number, time: string) => void;
  calculateAvailableSpaces: (load: Load) => number;
  onEditLoad?: (load: Load) => void;
  onDeleteLoad?: (load: Load) => void;
}

const LoadControlPanel: React.FC<LoadControlPanelProps> = ({
  selectedLoad,
  onStatusChange,
  onReservedSpacesChange,
  onDepartureTimeChange,
  calculateAvailableSpaces,
  onEditLoad,
  onDeleteLoad,
}) => {
  const publicSpaces = calculateAvailableSpaces(selectedLoad);
  const reservedSpaces = selectedLoad.reserved_spaces;

  const moveToReserved = () => {
    if (publicSpaces > 0) {
      onReservedSpacesChange(selectedLoad.id, reservedSpaces + 1);
    }
  };

  const moveToPublic = () => {
    if (reservedSpaces > 0) {
      onReservedSpacesChange(selectedLoad.id, reservedSpaces - 1);
    }
  };

  const adjustDepartureTime = (minutes: number) => {
    if (onDepartureTimeChange) {
      const currentTime = new Date(selectedLoad.departure);
      const newTime = new Date(currentTime.getTime() + minutes * 60000);
      onDepartureTimeChange(selectedLoad.id, newTime.toISOString());
    }
  };
  return (
    <Box>
      {/* Load Stats Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', textAlign: 'center', bgcolor: 'primary.50' }}>
        <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
          {selectedLoad.aircraft?.name} | 
          Jumpers: {/* TODO */} | 
          Open Slots: {/* TODO */} | 
          {(() => {
            const depDate = new Date(selectedLoad.departure);
            const now = new Date();
            const diffMins = Math.max(0, Math.round((depDate.getTime() - now.getTime()) / 60000));
            return ` Departs: ${diffMins} mins (${format(depDate, 'HH:mm')})`;
          })()}
        </Typography>
      </Box>

      {/* Space Management Section */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          {/* Public Spaces Box */}
          <Grid item xs={5}>
            <Box
              sx={{
                border: 1,
                borderColor: 'grey.300',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                minHeight: 80,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                bgcolor: 'primary.50',
                '&:hover': { bgcolor: 'primary.100' },
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {publicSpaces}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Public spaces
              </Typography>
            </Box>
          </Grid>

          {/* Arrow Controls */}
          <Grid item xs={2}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              
              <IconButton
                onClick={moveToPublic}
                disabled={reservedSpaces === 0}
                sx={{ 
                  width: 40,
                  height: 40,
                  bgcolor: 'background.paper',
                  border: 1, 
                  borderColor: 'grey.300',
                  '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.400' },
                  '&:disabled': { bgcolor: 'grey.100', borderColor: 'grey.200' }
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={moveToReserved}
                disabled={publicSpaces === 0}
                sx={{ 
                  width: 40,
                  height: 40,
                  bgcolor: 'background.paper',
                  border: 1, 
                  borderColor: 'grey.300',
                  '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.400' },
                  '&:disabled': { bgcolor: 'grey.100', borderColor: 'grey.200' }
                }}
              >
                <ArrowForwardIcon fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          {/* Reserved Spaces Box */}
          <Grid item xs={5}>
            <Box
              sx={{
                border: 1,
                borderColor: 'grey.300',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                minHeight: 80,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                bgcolor: 'success.50',
                '&:hover': { bgcolor: 'success.100' },
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {reservedSpaces}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reserved spaces
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Load Controls */}
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Departure Time Adjustment */}
          <Grid item>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Departure Time
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => adjustDepartureTime(-1)}
                  sx={{ 
                    width: 36, 
                    height: 36,
                    border: 1,
                    borderColor: 'grey.300'
                  }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'center' }}>
                  ±1 min
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => adjustDepartureTime(1)}
                  sx={{ 
                    width: 36, 
                    height: 36,
                    border: 1,
                    borderColor: 'grey.300'
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Grid>

          {/* Load Status */}
          <Grid item>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedLoad.status}
                label="Status"
                onChange={(e) => onStatusChange(selectedLoad.id, e.target.value as LoadStatus)}
              >
                <MenuItem value={LoadStatus.FORMING}>Forming</MenuItem>
                <MenuItem value={LoadStatus.ON_CALL}>On Call</MenuItem>
                <MenuItem value={LoadStatus.DEPARTED}>Departed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Action Buttons */}
          <Grid item sx={{ ml: 'auto' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onEditLoad && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => onEditLoad(selectedLoad)}
                >
                  Edit
                </Button>
              )}
              {onDeleteLoad && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => onDeleteLoad(selectedLoad)}
                >
                  Delete
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default LoadControlPanel;
