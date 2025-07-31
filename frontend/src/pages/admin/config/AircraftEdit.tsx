import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowLeft,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useToastContext } from '@/components/common/ToastProvider';
import { aircraftService } from '@/services/aircraft';
import { getErrorMessage } from '@/lib/error-utils';
import { AircraftType } from '@/types';

const AircraftEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const toast = useToastContext();
  const isCreating = location.pathname.endsWith('/new');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: AircraftType.PLANE as AircraftType,
    max_load: '',
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch aircraft data (only if editing)
  const aircraftQuery = useQuery({
    queryKey: ['aircraft', id],
    queryFn: () => aircraftService.getAircraftById(parseInt(id!)),
    enabled: !isCreating && !!id && id !== 'new',
  });

  // Load data when fetched
  useEffect(() => {
    if (aircraftQuery.data) {
      const aircraft = aircraftQuery.data;
      setFormData({
        name: aircraft.name,
        type: aircraft.type,
        max_load: aircraft.max_load.toString(),
      });
    }
  }, [aircraftQuery.data]);

  // Create/Update mutations
  const createMutation = useMutation({
    mutationFn: aircraftService.createAircraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
      toast.success('Aircraft created successfully');
      navigate(`/admin/aircraft`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      aircraftService.updateAircraft(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
      queryClient.invalidateQueries({ queryKey: ['aircraft', id] });
      toast.success('Aircraft updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: aircraftService.deleteAircraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
      toast.success('Aircraft deleted successfully');
      navigate('/admin/aircraft');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (type: AircraftType) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleSave = () => {
    const maxLoad = parseInt(formData.max_load);
    
    if (!formData.name.trim()) {
      toast.error('Aircraft name is required');
      return;
    }
    
    if (!maxLoad || maxLoad <= 0) {
      toast.error('Max load must be a positive number');
      return;
    }

    const data = {
      name: formData.name.trim(),
      type: formData.type,
      max_load: maxLoad,
    };

    if (isCreating) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({ id: parseInt(id!), data });
    }
  };

  const handleDelete = () => {
    if (id && !isCreating) {
      deleteMutation.mutate(parseInt(id));
    }
  };

  const handleBack = () => {
    navigate('/admin/aircraft');
  };

  const isLoading = aircraftQuery.isLoading || createMutation.isPending || updateMutation.isPending;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={handleBack} size="large">
              <ArrowLeft />
            </IconButton>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom>
                {isCreating ? 'Create Aircraft' : 'Edit Aircraft'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isCreating ? 'Add a new aircraft to the fleet' : 'Modify aircraft details and capacity'}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isLoading}
            >
              Save
            </Button>
            {!isCreating && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isLoading}
              >
                Delete
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Aircraft Form */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Aircraft Details
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Aircraft Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="e.g., Cessna 172, Robinson R44"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Aircraft Type</InputLabel>
              <Select
                value={formData.type}
                label="Aircraft Type"
                onChange={(e) => handleTypeChange(e.target.value as AircraftType)}
              >
                <MenuItem value={AircraftType.PLANE}>Plane</MenuItem>
                <MenuItem value={AircraftType.HELI}>Helicopter</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Maximum Load"
              name="max_load"
              type="number"
              value={formData.max_load}
              onChange={handleInputChange}
              required
              inputProps={{ min: 1 }}
              helperText="Maximum number of passengers"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Aircraft</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this aircraft? This action cannot be undone and will affect any associated loads.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AircraftEdit;
