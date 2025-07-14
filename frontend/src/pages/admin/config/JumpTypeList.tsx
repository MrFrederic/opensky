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
import { jumpTypesService } from '@/services/jump-types';
import JumpTypeTable from '@/components/admin/config/JumpTypeTable';
import { UserRole } from '@/types';

const JumpTypeList: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('');

  // Fetch jump types query
  const jumpTypesQuery = useQuery({
    queryKey: ['jumpTypes', roleFilter, availabilityFilter, searchQuery],
    queryFn: () => jumpTypesService.getJumpTypes({ 
      allowed_role: roleFilter || undefined,
      is_available: availabilityFilter !== '' ? availabilityFilter === 'true' : undefined,
      search: searchQuery && searchQuery.length >= 2 ? searchQuery : undefined,
      limit: 100 
    }),
  });

  // Handle query errors with toast
  useEffect(() => {
    if (jumpTypesQuery.error && jumpTypesQuery.error instanceof Error) {
      toast.error(`Failed to load jump types: ${jumpTypesQuery.error.message}`);
    }
  }, [jumpTypesQuery.error]);

  const handleJumpTypeClick = (jumpTypeId: number) => {
    navigate(`/admin/jump-types/${jumpTypeId}`);
  };

  const handleAddJumpType = () => {
    navigate('/admin/jump-types/new');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const jumpTypes = jumpTypesQuery.data;
  const isLoading = jumpTypesQuery.isLoading;
  const error = jumpTypesQuery.error;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom>
                Jump Type Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage jump types, pricing, and role permissions
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={handleAddJumpType}
              sx={{ mt: 1 }}
            >
              Add Jump Type
            </Button>
          </Box>
        </Box>

        {/* Search and Filter */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search jump types by name..."
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

            {/* Role Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Allowed Role Filter</InputLabel>
              <Select
                value={roleFilter}
                label="Allowed Role Filter"
                onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
                startAdornment={<Filter sx={{ mr: 1, color: 'action.disabled' }} />}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value={UserRole.TANDEM_JUMPER}>Tandem Jumper</MenuItem>
                <MenuItem value={UserRole.AFF_STUDENT}>AFF Student</MenuItem>
                <MenuItem value={UserRole.SPORT_PAID}>Sport Paid</MenuItem>
                <MenuItem value={UserRole.SPORT_FREE}>Sport Free</MenuItem>
                <MenuItem value={UserRole.TANDEM_INSTRUCTOR}>Tandem Instructor</MenuItem>
                <MenuItem value={UserRole.AFF_INSTRUCTOR}>AFF Instructor</MenuItem>
                <MenuItem value={UserRole.ADMINISTRATOR}>Administrator</MenuItem>
              </Select>
            </FormControl>

            {/* Availability Filter */}
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Availability</InputLabel>
              <Select
                value={availabilityFilter}
                label="Availability"
                onChange={(e) => setAvailabilityFilter(e.target.value as string)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Available</MenuItem>
                <MenuItem value="false">Unavailable</MenuItem>
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
            Error loading jump types: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        )}

        {/* Jump Types Table */}
        <JumpTypeTable
          jumpTypes={jumpTypes || []}
          onJumpTypeClick={handleJumpTypeClick}
          loading={isLoading}
        />

        {/* Results Info */}
        {jumpTypes && jumpTypes.length > 0 && (
          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="text.secondary">
              Showing {jumpTypes.length} jump type{jumpTypes.length !== 1 ? 's' : ''}
              {roleFilter && ` allowed for role: ${roleFilter}`}
              {availabilityFilter !== '' && ` (${availabilityFilter === 'true' ? 'available' : 'unavailable'})`}
            </Typography>
          </Box>
        )}
      </Container>
  );
};

export default JumpTypeList;
