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
import { format, differenceInMinutes } from 'date-fns';

import { Load, LoadStatus } from '@/types';

interface LoadControlPanelProps {
  selectedLoad: Load;
  onStatusChange: (loadId: number, status: LoadStatus) => void;
  onReservedSpacesChange: (loadId: number, spaces: number) => void;
  onDepartureTimeChange?: (loadId: number, time: string) => void;
  calculateAvailableSpaces: (load: Load) => number;
  onEditLoad?: (load: Load) => void;
  onDeleteLoad?: (load: Load) => void;
  onJumpDrop?: (jump: any, load: Load, reserved: boolean) => void;
}

const LoadControlPanel: React.FC<LoadControlPanelProps> = ({
  selectedLoad,
  onStatusChange,
  onReservedSpacesChange,
  onDepartureTimeChange,
  calculateAvailableSpaces,
  onEditLoad,
  onDeleteLoad,
  onJumpDrop,
}) => {
  // Use backend-calculated space information if available
  const publicSpaces = selectedLoad.remaining_public_spaces !== undefined 
    ? selectedLoad.remaining_public_spaces 
    : calculateAvailableSpaces(selectedLoad);
  const reservedSpaces = selectedLoad.remaining_reserved_spaces !== undefined
    ? selectedLoad.remaining_reserved_spaces
    : selectedLoad.reserved_spaces;
  const totalJumpers = (selectedLoad.occupied_public_spaces || 0) + (selectedLoad.occupied_reserved_spaces || 0);
  const totalOpenSlots = publicSpaces + reservedSpaces;

  const moveToReserved = () => {
    if (publicSpaces > 0) {
      onReservedSpacesChange(selectedLoad.id, selectedLoad.reserved_spaces + 1);
    }
  };

  const moveToPublic = () => {
    if (selectedLoad.reserved_spaces > 0) {
      onReservedSpacesChange(selectedLoad.id, selectedLoad.reserved_spaces - 1);
    }
  };

  const adjustDepartureTime = (minutes: number) => {
    if (onDepartureTimeChange) {
      const currentTime = new Date(selectedLoad.departure);
      const newTime = new Date(currentTime.getTime() + minutes * 60000);
      onDepartureTimeChange(selectedLoad.id, newTime.toISOString());
    }
  };

  const getMinutesUntilDeparture = (departure: string) => {
    return differenceInMinutes(new Date(departure), new Date());
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnPublic = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const jumpData = JSON.parse(e.dataTransfer.getData('application/json'));
      onJumpDrop?.(jumpData, selectedLoad, false); // reserved = false for public spaces
    } catch (error) {
      console.error('Failed to parse dropped jump data:', error);
    }
  };

  const handleDropOnReserved = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const jumpData = JSON.parse(e.dataTransfer.getData('application/json'));
      onJumpDrop?.(jumpData, selectedLoad, true); // reserved = true for reserved spaces
    } catch (error) {
      console.error('Failed to parse dropped jump data:', error);
    }
  };

  return (
    <Box>
      {/* Load Stats Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', textAlign: 'center', bgcolor: 'primary.50' }}>
        <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
          {selectedLoad.aircraft?.name} | 
          Jumpers: {totalJumpers} | 
          Open Slots: {totalOpenSlots} | 
          {(() => {
            const deptTime = format(new Date(selectedLoad.departure), 'HH:mm');
            const diffMins = getMinutesUntilDeparture(selectedLoad.departure);
            return ` Departs: ${diffMins} mins (${deptTime})`;
          })()}
        </Typography>
      </Box>

      {/* Space Management Section */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          {/* Public Spaces Box */}
          <Grid item xs={5}>
            <Box
              onDragOver={handleDragOver}
              onDrop={handleDropOnPublic}
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
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                '&::after': {
                  content: '"Drop here for public"',
                  position: 'absolute',
                  bottom: 4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                  opacity: 0.7,
                },
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
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
                disabled={selectedLoad.reserved_spaces <= 0}
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
                disabled={publicSpaces <= 0}
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
              onDragOver={handleDragOver}
              onDrop={handleDropOnReserved}
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
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                '&::after': {
                  content: '"Drop here for reserved"',
                  position: 'absolute',
                  bottom: 4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                  opacity: 0.7,
                },
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
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
