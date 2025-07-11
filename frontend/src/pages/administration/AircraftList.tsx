import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  InputAdornment,
  Alert,
  Container,
} from '@mui/material';
import { 
  Add as Plus, 
  Search, 
  FilterList as Filter
} from '@mui/icons-material';
import { useToastContext } from '@/components/common/ToastProvider';
import { aircraftService } from '@/services/aircraft';
import AircraftTable from '@/components/admin/AircraftTable';
import { AircraftType } from '@/types';

const AircraftList: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AircraftType | ''>('');

  // Fetch aircraft query
  const aircraftQuery = useQuery({
    queryKey: ['aircraft', typeFilter, searchQuery],
    queryFn: () => aircraftService.getAircraft({ 
      aircraft_type: typeFilter || undefined,
      search: searchQuery && searchQuery.length >= 2 ? searchQuery : undefined,
      limit: 100 
    }),
  });

  // Handle query errors with toast
  useEffect(() => {
    if (aircraftQuery.error && aircraftQuery.error instanceof Error) {
      toast.error(`Failed to load aircraft: ${aircraftQuery.error.message}`);
    }
  }, [aircraftQuery.error]);

  const handleAircraftClick = (aircraftId: number) => {
    navigate(`/admin/aircraft/${aircraftId}`);
  };

  const handleAddAircraft = () => {
    navigate('/admin/aircraft/new');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const aircraft = aircraftQuery.data;
  const isLoading = aircraftQuery.isLoading;
  const error = aircraftQuery.error;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom>
                Aircraft Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage aircraft fleet and capacity
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={handleAddAircraft}
              sx={{ mt: 1 }}
            >
              Add Aircraft
            </Button>
          </Box>
        </Box>

        {/* Search and Filter */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} mb={2}>
            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search aircraft by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={handleClearSearch}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      ×
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />

            {/* Type Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Aircraft Type</InputLabel>
              <Select
                value={typeFilter}
                label="Aircraft Type"
                onChange={(e) => setTypeFilter(e.target.value as AircraftType | '')}
                startAdornment={<Filter sx={{ mr: 1, color: 'action.disabled' }} />}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value={AircraftType.PLANE}>Plane</MenuItem>
                <MenuItem value={AircraftType.HELI}>Helicopter</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {searchQuery && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {searchQuery.length < 2 ? 'Enter at least 2 characters to search' : 
               `Searching for "${searchQuery}"`}
            </Typography>
          )}
        </Paper>

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error loading aircraft: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        )}

        {/* Aircraft Table */}
        <AircraftTable
          aircraft={aircraft || []}
          onAircraftClick={handleAircraftClick}
          loading={isLoading}
        />

        {/* Results Info */}
        {aircraft && aircraft.length > 0 && (
          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="text.secondary">
              Showing {aircraft.length} aircraft
              {typeFilter && ` of type: ${typeFilter}`}
            </Typography>
          </Box>
        )}
      </Container>
  );
};

export default AircraftList;
