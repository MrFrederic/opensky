import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { Load, CreateLoadData, UpdateLoadData } from '@/types';
import { aircraftService } from '@/services/aircraft';
import { UniversalInputField } from '@/components/common';

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
              <UniversalInputField
                type="number"
                label="Minutes from now"
                value={Number(minutesInput) || 0}
                onChange={(value) => {
                  const stringValue = String(value);
                  setMinutesInput(stringValue);
                  const minutes = Number(value);
                  if (!isNaN(minutes) && stringValue !== '') {
                    const newDate = new Date(Date.now() + minutes * 60000);
                    setDeparture(newDate);
                    setTimeInput(`${newDate.getHours().toString().padStart(2, '0')}:${newDate.getMinutes().toString().padStart(2, '0')}`);
                  }
                }}
                placeholder="30"
                fullWidth={false}
              />
              {/* 24h time field */}
              <UniversalInputField
                type="text"
                label="Time (24h)"
                value={timeInput}
                onChange={(value) => {
                  const stringValue = String(value);
                  setTimeInput(stringValue);
                  // Simple HH:MM validation
                  const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
                  if (timeRegex.test(stringValue)) {
                    const [hours, minutes] = stringValue.split(':');
                    const now = new Date();
                    const newDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours), Number(minutes), 0, 0);
                    setDeparture(newDate);
                    setMinutesInput(Math.round((newDate.getTime() - Date.now()) / 60000).toString());
                  }
                }}
                placeholder="14:30"
                fullWidth={false}
              />
            </Box>

            {/* Aircraft Selection */}
            <UniversalInputField
              type="dropdown"
              label="Aircraft"
              value={aircraftId}
              onChange={(value) => setAircraftId(value as number)}
              error={!aircraftId}
              helperText={!aircraftId ? "Aircraft selection is required" : ""}
              required
              options={
                aircraftQuery.isLoading 
                  ? [{ value: '', label: 'Loading aircraft...' }]
                  : aircraftQuery.data 
                    ? aircraftQuery.data.map((aircraft) => ({
                        value: aircraft.id,
                        label: `${aircraft.name} (${aircraft.type.toUpperCase()}) - Max ${aircraft.max_load} pax`
                      }))
                    : [{ value: '', label: 'No aircraft available' }]
              }
              disabled={aircraftQuery.isLoading}
            />

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
