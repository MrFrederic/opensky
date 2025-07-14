import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { 
  ArrowBack as ArrowLeft, 
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

import { useToastContext } from '@/components/common/ToastProvider';
import { jumpTypesService } from '@/services/jump-types';
import { UserRole } from '@/types';
import { getErrorMessage } from '@/lib/error-utils';

interface AdditionalStaffItem {
  staff_required_role: UserRole;
  staff_default_jump_type_id?: number;
}

const roleLabels: Record<UserRole, string> = {
  [UserRole.TANDEM_JUMPER]: 'Tandem Jumper',
  [UserRole.AFF_STUDENT]: 'AFF Student',
  [UserRole.SPORT_PAID]: 'Sport Paid',
  [UserRole.SPORT_FREE]: 'Sport Free',
  [UserRole.TANDEM_INSTRUCTOR]: 'Tandem Instructor',
  [UserRole.AFF_INSTRUCTOR]: 'AFF Instructor',
  [UserRole.ADMINISTRATOR]: 'Administrator',
};

const JumpTypeEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const toast = useToastContext();
  const isCreating = location.pathname.endsWith('/new');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    description: '',
    exit_altitude: '',
    price: '',
    is_available: true,
  });

  const [allowedRoles, setAllowedRoles] = useState<UserRole[]>([]);
  const [additionalStaff, setAdditionalStaff] = useState<AdditionalStaffItem[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch jump type data (only if editing)
  const jumpTypeQuery = useQuery({
    queryKey: ['jumpType', id],
    queryFn: () => jumpTypesService.getJumpType(parseInt(id!)),
    enabled: !isCreating && !!id && id !== 'new',
  });

  // Fetch all jump types for additional staff dropdown with role filtering
  const [jumpTypesCache, setJumpTypesCache] = useState<Record<UserRole, any[]>>({} as Record<UserRole, any[]>);
  
  // Query for fetching jump types by role - we'll call this when roles change
  const fetchJumpTypesForRole = async (role: UserRole) => {
    if (jumpTypesCache[role]) {
      return jumpTypesCache[role];
    }
    
    try {
      const jumpTypes = await jumpTypesService.getJumpTypes({ 
        limit: 1000, 
        allowed_role: role 
      });
      setJumpTypesCache(prev => ({ ...prev, [role]: jumpTypes }));
      return jumpTypes;
    } catch (error) {
      console.error('Failed to fetch jump types for role:', role, error);
      return [];
    }
  };

  // Effect to prefetch jump types when additional staff roles change
  useEffect(() => {
    const uniqueRoles = [...new Set(additionalStaff.map(s => s.staff_required_role))];
    uniqueRoles.forEach(role => {
      if (!jumpTypesCache[role]) {
        fetchJumpTypesForRole(role);
      }
    });
  }, [additionalStaff, jumpTypesCache]);

  // Load data when fetched
  useEffect(() => {
    if (jumpTypeQuery.data) {
      const jumpType = jumpTypeQuery.data;
      setFormData({
        name: jumpType.name,
        short_name: jumpType.short_name,
        description: jumpType.description || '',
        exit_altitude: jumpType.exit_altitude?.toString() || '',
        price: jumpType.price?.toString() || '',
        is_available: jumpType.is_available,
      });
      setAllowedRoles(jumpType.allowed_roles.map(r => r.role));
      setAdditionalStaff(jumpType.additional_staff.map(s => ({
        staff_required_role: s.staff_required_role,
        staff_default_jump_type_id: s.staff_default_jump_type_id,
      })));
    }
  }, [jumpTypeQuery.data]);

  // Create/Update mutations
  const createMutation = useMutation({
    mutationFn: jumpTypesService.createJumpType,
    onSuccess: (jumpType) => {
      queryClient.invalidateQueries({ queryKey: ['jumpTypes'] });
      toast.success('Jump type created successfully');
      navigate(`/admin/jump-types/${jumpType.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      jumpTypesService.updateJumpType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jumpTypes'] });
      queryClient.invalidateQueries({ queryKey: ['jumpType', id] });
      toast.success('Jump type updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: jumpTypesService.deleteJumpType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jumpTypes'] });
      toast.success('Jump type deleted successfully');
      navigate('/admin/jump-types');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleToggle = (role: UserRole) => {
    setAllowedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleAddStaff = () => {
    const defaultRole = UserRole.TANDEM_INSTRUCTOR;
    setAdditionalStaff(prev => [...prev, { staff_required_role: defaultRole }]);
    // Fetch jump types for the default role if not already cached
    if (!jumpTypesCache[defaultRole]) {
      fetchJumpTypesForRole(defaultRole);
    }
  };

  const handleRemoveStaff = (index: number) => {
    setAdditionalStaff(prev => prev.filter((_, i) => i !== index));
  };

  const handleStaffChange = (index: number, field: keyof AdditionalStaffItem, value: any) => {
    setAdditionalStaff(prev => prev.map((staff, i) => 
      i === index ? { ...staff, [field]: value } : staff
    ));
  };

  const handleSave = () => {
    const data = {
      name: formData.name.trim(),
      short_name: formData.short_name.trim(),
      description: formData.description.trim() || undefined,
      exit_altitude: formData.exit_altitude ? parseInt(formData.exit_altitude) : undefined,
      price: formData.price ? parseInt(formData.price) : undefined,
      is_available: formData.is_available,
      allowed_roles: allowedRoles,
      additional_staff: additionalStaff,
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
    navigate('/admin/jump-types');
  };

  const isLoading = jumpTypeQuery.isLoading || createMutation.isPending || updateMutation.isPending;

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
                {isCreating ? 'Create Jump Type' : 'Edit Jump Type'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isCreating ? 'Add a new jump type to the system' : 'Modify jump type details and permissions'}
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

      <Grid container spacing={3}>
        {/* Left Side - Jump Type Fields */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Jump Type Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Short Name"
                  name="short_name"
                  value={formData.short_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Exit Altitude (m)"
                  name="exit_altitude"
                  type="number"
                  value={formData.exit_altitude}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price (BYN)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_available}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                    />
                  }
                  label="Available"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Right Side - Additional Staff */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Additional Staff
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddStaff}
              >
                Add
              </Button>
            </Box>
            
            {additionalStaff.map((staff, index) => {
              // Get jump types for the selected role from cache
              const jumpTypesForRole = jumpTypesCache[staff.staff_required_role] || [];
              const isLoadingJumpTypes = !jumpTypesCache[staff.staff_required_role];
              
              return (
                <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight="medium">
                      Staff #{index + 1}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveStaff(index)}
                    >
                      <RemoveIcon />
                    </IconButton>
                  </Box>
                  
                  <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Required Role</InputLabel>
                    <Select
                      value={staff.staff_required_role}
                      label="Required Role"
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        // Reset the jump type when role changes
                        handleStaffChange(index, 'staff_required_role', newRole);
                        handleStaffChange(index, 'staff_default_jump_type_id', undefined);
                        // Fetch jump types for the new role if not cached
                        if (!jumpTypesCache[newRole]) {
                          fetchJumpTypesForRole(newRole);
                        }
                      }}
                    >
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>Default Jump Type</InputLabel>
                    <Select
                      value={staff.staff_default_jump_type_id || ''}
                      label="Default Jump Type"
                      onChange={(e) => handleStaffChange(index, 'staff_default_jump_type_id', e.target.value || undefined)}
                      disabled={isLoadingJumpTypes}
                    >
                      <MenuItem value="">---</MenuItem>
                      {jumpTypesForRole.map((jt: any) => (
                        <MenuItem key={jt.id} value={jt.id}>
                          {jt.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {isLoadingJumpTypes && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        Loading jump types for selected role...
                      </Typography>
                    )}
                    {jumpTypesForRole.length === 0 && !isLoadingJumpTypes && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        No jump types available for this role
                      </Typography>
                    )}
                  </FormControl>
                </Box>
              );
            })}
            
            {additionalStaff.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No additional staff required
              </Typography>
            )}
          </Paper>

          {/* Allowed Roles */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Allowed Roles
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select which user roles can use this jump type
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={1}>
              {Object.entries(roleLabels).map(([role, label]) => (
                <FormControlLabel
                  key={role}
                  control={
                    <Checkbox
                      checked={allowedRoles.includes(role as UserRole)}
                      onChange={() => handleRoleToggle(role as UserRole)}
                      size="small"
                    />
                  }
                  label={label}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Jump Type</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this jump type? This action cannot be undone.
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

export default JumpTypeEdit;
