import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  InputAdornment,
  Alert,
  Container,
  Chip,
  Avatar
} from '@mui/material';
import { 
  Search, 
  FilterList as Filter, 
  ArrowBack as ArrowLeft, 
  Storage as Database 
} from '@mui/icons-material';
import { dictionariesService } from '@/services/dictionaries';
import DictionaryValueTable from '@/components/admin/config/DictionaryValueTable';
import { useToastContext } from '@/components/common/ToastProvider';

const DictionaryEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const toast = useToastContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'custom'>('all');

  const dictionaryId = parseInt(id || '0', 10);

  // Fetch dictionary with values
  const dictionaryQuery = useQuery({
    queryKey: ['dictionary', dictionaryId],
    queryFn: () => dictionariesService.getDictionary(dictionaryId),
    enabled: !!dictionaryId,
  });

  // Handle query errors with toast
  useEffect(() => {
    if (dictionaryQuery.error && dictionaryQuery.error instanceof Error) {
      toast.error('Failed to load dictionary', dictionaryQuery.error);
    }
  }, [dictionaryQuery.error, toast]);

  // Add value mutation
  const addValueMutation = useMutation({
    mutationFn: async (value: string) => {
      await dictionariesService.createDictionaryValue(dictionaryId, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary', dictionaryId] });
      toast.success('Value created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create value', error);
    },
  });

  // Edit value mutation
  const editValueMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: string }) => {
      await dictionariesService.updateDictionaryValue(id, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary', dictionaryId] });
      toast.success('Value updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update value', error);
    },
  });

  // Delete/restore value mutation
  const deleteRestoreValueMutation = useMutation({
    mutationFn: async ({ id }: { id: number; isActive: boolean }) => {
      await dictionariesService.deleteDictionaryValue(id);
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['dictionary', dictionaryId] });
      toast.success(isActive ? 'Value deactivated successfully' : 'Value restored successfully');
    },
    onError: (error) => {
      toast.error('Failed to update value status', error);
    },
  });

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Filter values based on current filters
  const filteredValues = React.useMemo(() => {
    if (!dictionaryQuery.data?.values) return [];
    
    let filtered = dictionaryQuery.data.values;

    // Filter by search query
    if (searchQuery && searchQuery.length >= 2) {
      filtered = filtered.filter(value => 
        value.value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(value => 
        statusFilter === 'active' ? value.is_active : !value.is_active
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(value => 
        typeFilter === 'system' ? value.is_system : !value.is_system
      );
    }

    return filtered;
  }, [dictionaryQuery.data?.values, searchQuery, statusFilter, typeFilter]);

  const dictionary = dictionaryQuery.data;
  const isLoading = dictionaryQuery.isLoading;
  const error = dictionaryQuery.error;

  // Handle invalid dictionary ID
  if (!dictionaryId || isNaN(dictionaryId)) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Invalid Dictionary
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The dictionary ID provided is not valid.
        </Typography>
        <Box component={Link} to="/admin/dictionaries" sx={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          px: 2, 
          py: 1, 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText', 
          borderRadius: 1, 
          textDecoration: 'none',
          '&:hover': { bgcolor: 'primary.dark' }
        }}>
          <ArrowLeft sx={{ mr: 1 }} />
          Back to Dictionaries
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box component={Link} to="/admin/dictionaries" sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': { color: 'text.primary' }
            }}>
              <ArrowLeft sx={{ mr: 1 }} />
              Back to Dictionaries
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar sx={{ 
              width: 48, 
              height: 48,
              bgcolor: dictionary?.is_active ? 'primary.light' : 'grey.300',
              color: dictionary?.is_active ? 'primary.main' : 'grey.500'
            }}>
              <Database />
            </Avatar>
            <Box>
              <Typography variant="h3" component="h1">
                {isLoading ? 'Loading...' : dictionary?.name || 'Unknown Dictionary'}
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mt={1}>
                <Typography variant="body1" color="text.secondary">
                  Manage values for this dictionary
                </Typography>
                {dictionary && (
                  <Box display="flex" gap={1}>
                    <Chip
                      label={dictionary.is_active ? 'Active' : 'Inactive'}
                      color={dictionary.is_active ? 'success' : 'error'}
                      size="small"
                    />
                    <Chip
                      label={dictionary.is_system ? 'System' : 'Custom'}
                      color={dictionary.is_system ? 'default' : 'primary'}
                      size="small"
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Search and Filter */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search values..."
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
                    <Box
                      component="button"
                      onClick={handleClearSearch}
                      sx={{ 
                        border: 'none', 
                        background: 'none', 
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        p: 0.5
                      }}
                    >
                      ×
                    </Box>
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />

            {/* Status Filter */}
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                startAdornment={<Filter sx={{ mr: 1, color: 'action.disabled' }} />}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            {/* Type Filter */}
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'system' | 'custom')}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="system">System</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
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
            Error loading dictionary: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        )}

        {/* Values Table */}
        <DictionaryValueTable
          values={filteredValues}
          loading={isLoading}
          onAdd={async (value) => addValueMutation.mutateAsync(value)}
          onEdit={async (id, value) => editValueMutation.mutateAsync({ id, value })}
          onDeleteRestore={async (id, isActive) => deleteRestoreValueMutation.mutateAsync({ id, isActive })}
        />

        {/* Results Info */}
        {dictionary?.values && dictionary.values.length > 0 && (
          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredValues.length} of {dictionary.values.length} value{dictionary.values.length !== 1 ? 's' : ''}
              {statusFilter !== 'all' && ` (${statusFilter})`}
              {typeFilter !== 'all' && ` (${typeFilter})`}
            </Typography>
          </Box>
        )}
      </Container>
  );
};

export default DictionaryEdit;
