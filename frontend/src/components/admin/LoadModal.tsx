import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  TextField,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { Load, CreateLoadData, UpdateLoadData } from '@/types';
import { aircraftService } from '@/services/aircraft';

interface LoadModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateLoadData | UpdateLoadData) => void;
  load?: Load | null;
  loading?: boolean;
}

const LoadModal: React.FC<LoadModalProps> = ({
  open,
  onClose,
  onSave,
  load,
  loading = false,
}) => {
  const isEditing = !!load;
  
  // Form state
  const [departure, setDeparture] = useState<Date | null>(null);
  const [aircraftId, setAircraftId] = useState<number | ''>('');
  const [minutesInput, setMinutesInput] = useState<string>('');
  const [timeInput, setTimeInput] = useState<string>('');

  // Fetch aircraft for dropdown
  const aircraftQuery = useQuery({
    queryKey: ['aircraft'],
    queryFn: () => aircraftService.getAircraft({ limit: 100 }),
    enabled: open,
  });

  // Initialize form when load changes
  useEffect(() => {
    if (isEditing && load) {
      const loadDate = new Date(load.departure);
      setDeparture(loadDate);
      setAircraftId(load.aircraft_id);
      setMinutesInput(Math.round((loadDate.getTime() - Date.now()) / 60000).toString());
      setTimeInput(`${loadDate.getHours().toString().padStart(2, '0')}:${loadDate.getMinutes().toString().padStart(2, '0')}`);
    } else {
      // Default to current time + 30 minutes for new loads
      const defaultTime = new Date();
      defaultTime.setMinutes(defaultTime.getMinutes() + 30);
      setDeparture(defaultTime);
      setAircraftId('');
      setMinutesInput('30');
      setTimeInput(`${defaultTime.getHours().toString().padStart(2, '0')}:${defaultTime.getMinutes().toString().padStart(2, '0')}`);
    }
  }, [load, isEditing, open]);

  const handleSave = () => {
    if (!departure || !aircraftId) return;

    const data = {
      departure: departure.toISOString(),
      aircraft_id: Number(aircraftId),
    };

    onSave(data);
  };

  const handleClose = () => {
    setDeparture(null);
    setAircraftId('');
    setMinutesInput('');
    setTimeInput('');
    onClose();
  };

  const isValid = departure && aircraftId;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { minHeight: 300 }
        }}
      >
        <DialogTitle>
          <Typography variant="h6">
            {isEditing ? 'Edit Load' : 'Create New Load'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditing ? 'Modify load departure time and aircraft' : 'Schedule a new load with departure time and aircraft'}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Departure Time Fields */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Minutes from now */}
              <TextField
                label="Minutes from now"
                type="number"
                size="small"
                value={minutesInput}
                onChange={e => {
                  const value = e.target.value;
                  setMinutesInput(value);
                  const minutes = Number(value);
                  if (!isNaN(minutes) && value !== '') {
                    const newDate = new Date(Date.now() + minutes * 60000);
                    setDeparture(newDate);
                    setTimeInput(`${newDate.getHours().toString().padStart(2, '0')}:${newDate.getMinutes().toString().padStart(2, '0')}`);
                  }
                }}
                placeholder="30"
                sx={{ width: 150 }}
              />
              {/* 24h time field */}
              <TextField
                label="Time (24h)"
                size="small"
                value={timeInput}
                onChange={e => {
                  const value = e.target.value;
                  setTimeInput(value);
                  // Simple HH:MM validation
                  const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
                  if (timeRegex.test(value)) {
                    const [hours, minutes] = value.split(':');
                    const now = new Date();
                    const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours), Number(minutes), 0, 0);
                    setDeparture(newDate);
                    setMinutesInput(Math.round((newDate.getTime() - Date.now()) / 60000).toString());
                  }
                }}
                placeholder="14:30"
                inputProps={{ pattern: '[0-2][0-9]:[0-5][0-9]' }}
                sx={{ width: 150 }}
              />
            </Box>

            {/* Aircraft Selection */}
            <FormControl fullWidth required error={!aircraftId}>
              <InputLabel>Aircraft</InputLabel>
              <Select
                value={aircraftId}
                label="Aircraft"
                onChange={(e) => setAircraftId(e.target.value as number)}
                disabled={aircraftQuery.isLoading}
              >
                {aircraftQuery.isLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading aircraft...
                  </MenuItem>
                ) : aircraftQuery.data ? (
                  aircraftQuery.data.map((aircraft) => (
                    <MenuItem key={aircraft.id} value={aircraft.id}>
                      {aircraft.name} ({aircraft.type.toUpperCase()}) - Max {aircraft.max_load} pax
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No aircraft available</MenuItem>
                )}
              </Select>
              {!aircraftId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  Aircraft selection is required
                </Typography>
              )}
            </FormControl>

            {aircraftQuery.error && (
              <Typography variant="body2" color="error">
                Error loading aircraft: {aircraftQuery.error instanceof Error ? aircraftQuery.error.message : 'Unknown error'}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!isValid || loading}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Load' : 'Create Load'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default LoadModal;
