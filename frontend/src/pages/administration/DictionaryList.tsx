import React, { useState, useEffect } from 'react';
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
  Container
} from '@mui/material';
import { 
  Search, 
  FilterList as Filter 
} from '@mui/icons-material';
import { dictionariesService } from '@/services/dictionaries';
import DictionaryTable from '@/components/admin/DictionaryTable';
import { useToast } from '@/hooks/useToast';

const DictionaryList: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'custom'>('all');

  // Fetch dictionaries query
  const dictionariesQuery = useQuery({
    queryKey: ['dictionaries', statusFilter, typeFilter, searchQuery],
    queryFn: () => dictionariesService.getDictionaries({ 
      name: searchQuery && searchQuery.length >= 2 ? searchQuery : undefined,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      is_system: typeFilter === 'all' ? undefined : typeFilter === 'system',
      limit: 100 
    }),
  });

  // Handle query errors with toast
  useEffect(() => {
    if (dictionariesQuery.error && dictionariesQuery.error instanceof Error) {
      toast.error('Failed to load dictionaries', dictionariesQuery.error);
    }
  }, [dictionariesQuery.error, toast]);

  // Add dictionary mutation
  const addDictionaryMutation = useMutation({
    mutationFn: async (name: string) => {
      await dictionariesService.createDictionary({ name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionaries'] });
      toast.success('Dictionary created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create dictionary', error);
    },
  });

  // Edit dictionary mutation
  const editDictionaryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await dictionariesService.updateDictionary(id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionaries'] });
      toast.success('Dictionary updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update dictionary', error);
    },
  });

  // Delete/restore dictionary mutation
  const deleteRestoreDictionaryMutation = useMutation({
    mutationFn: async ({ id }: { id: number; isActive: boolean }) => {
      await dictionariesService.deleteDictionary(id);
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['dictionaries'] });
      toast.success(isActive ? 'Dictionary deactivated successfully' : 'Dictionary restored successfully');
    },
    onError: (error) => {
      toast.error('Failed to update dictionary status', error);
    },
  });

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const dictionaries = dictionariesQuery.data;
  const isLoading = dictionariesQuery.isLoading;
  const error = dictionariesQuery.error;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            Dictionary Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage system dictionaries and their values
          </Typography>
        </Box>

        {/* Search and Filter */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search dictionaries by name..."
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
            Error loading dictionaries: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        )}

        {/* Dictionaries Table */}
        <DictionaryTable
          dictionaries={dictionaries || []}
          loading={isLoading}
          onAdd={async (name) => addDictionaryMutation.mutateAsync(name)}
          onEdit={async (id, name) => editDictionaryMutation.mutateAsync({ id, name })}
          onDeleteRestore={async (id, isActive) => deleteRestoreDictionaryMutation.mutateAsync({ id, isActive })}
        />

        {/* Results Info */}
        {dictionaries && dictionaries.length > 0 && (
          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="text.secondary">
              Showing {dictionaries.length} dictionar{dictionaries.length !== 1 ? 'ies' : 'y'}
              {statusFilter !== 'all' && ` (${statusFilter})`}
              {typeFilter !== 'all' && ` (${typeFilter})`}
            </Typography>
          </Box>
        )}
      </Container>
  );
};

export default DictionaryList;
