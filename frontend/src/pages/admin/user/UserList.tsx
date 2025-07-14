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
  Container
} from '@mui/material';
import { 
  Add as Plus, 
  Search, 
  FilterList as Filter
} from '@mui/icons-material';
import { useToastContext } from '@/components/common/ToastProvider';
import { usersService } from '@/services/users';
import UserTable from '@/components/admin/user/UserTable';
import { UserRole } from '@/types';

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');

  // Fetch users query - now handles both search and filter
  const usersQuery = useQuery({
    queryKey: ['users', roleFilter, searchQuery],
    queryFn: () => usersService.getUsers({ 
      role: roleFilter || undefined,
      search: searchQuery && searchQuery.length >= 2 ? searchQuery : undefined,
      limit: 100 
    }),
  });

  // Handle query errors with toast
  useEffect(() => {
    if (usersQuery.error && usersQuery.error instanceof Error) {
      toast.error(`Failed to load users: ${usersQuery.error.message}`);
    }
  }, [usersQuery.error]);

  const handleUserClick = (userId: number) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleAddUser = () => {
    navigate('/admin/users/new');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const users = usersQuery.data;
  const isLoading = usersQuery.isLoading;
  const error = usersQuery.error;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom>
                User Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage system users, roles, and permissions
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={handleAddUser}
              sx={{ mt: 1 }}
            >
              Add User
            </Button>
          </Box>
        </Box>

        {/* Search and Filter */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search users by name or username..."
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
              <InputLabel>Role Filter</InputLabel>
              <Select
                value={roleFilter}
                label="Role Filter"
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
            Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        )}

        {/* Users Table */}
        <UserTable
          users={users || []}
          onUserClick={handleUserClick}
          loading={isLoading}
        />

        {/* Results Info */}
        {users && users.length > 0 && (
          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="text.secondary">
              Showing {users.length} user{users.length !== 1 ? 's' : ''}
              {roleFilter && ` with role: ${roleFilter}`}
            </Typography>
          </Box>
        )}
      </Container>
  );
};

export default UserList;
