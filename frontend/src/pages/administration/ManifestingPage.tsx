import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';
import {
    FlightTakeoff as FlightIcon,
} from '@mui/icons-material';

import { useToastContext } from '@/components/common/ToastProvider';
import { loadsService } from '@/services/loads';
import { aircraftService } from '@/services/aircraft';
import LoadTable from '@/components/admin/LoadTable';
import LoadControlPanel from '@/components/admin/LoadControlPanel';
import LoadModal from '@/components/admin/LoadModal';
import { Load, LoadStatus, CreateLoadData, UpdateLoadData } from '@/types';
import { getErrorMessage } from '@/lib/error-utils';

const ManifestingPage: React.FC = () => {
    const queryClient = useQueryClient();
    const toast = useToastContext();

    // Filter states
    const [statusFilter, setStatusFilter] = useState<LoadStatus | ''>('');
    const [aircraftFilter, setAircraftFilter] = useState<number | ''>('');

    // Modal states
    const [loadModalOpen, setLoadModalOpen] = useState(false);
    const [editingLoad, setEditingLoad] = useState<Load | null>(null);

    // Delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [loadToDelete, setLoadToDelete] = useState<Load | null>(null);

    // Selected load state
    const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);

    // Fetch loads with filters
    const loadsQuery = useQuery({
        queryKey: ['loads', statusFilter, aircraftFilter],
        queryFn: () => loadsService.getLoads({
            status: statusFilter || undefined,
            aircraft_id: aircraftFilter || undefined,
            limit: 100,
        }),
        refetchInterval: 5000, // Refetch every 5 seconds
        staleTime: 0, // Always consider data stale to ensure visual updates
        refetchIntervalInBackground: true, // Continue refetching even when window is not focused
    });

    // Fetch aircraft for filter dropdown
    const aircraftQuery = useQuery({
        queryKey: ['aircraft'],
        queryFn: () => aircraftService.getAircraft({ limit: 100 }),
    });

    // Create load mutation
    const createLoadMutation = useMutation({
        mutationFn: loadsService.createLoad,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loads'] });
            toast.success('Load created successfully');
            setLoadModalOpen(false);
            setEditingLoad(null);
        },
        onError: (error) => {
            toast.error(`Failed to create load: ${getErrorMessage(error)}`);
        },
    });

    // Update load mutation
    const updateLoadMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateLoadData }) =>
            loadsService.updateLoad(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loads'] });
            toast.success('Load updated successfully');
            setLoadModalOpen(false);
            setEditingLoad(null);
        },
        onError: (error) => {
            toast.error(`Failed to update load: ${getErrorMessage(error)}`);
        },
    });

    // Update load status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: LoadStatus }) =>
            loadsService.updateLoadStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loads'] });
            toast.success('Load status updated');
        },
        onError: (error) => {
            toast.error(`Failed to update status: ${getErrorMessage(error)}`);
        },
    });

    // Update reserved spaces mutation
    const updateSpacesMutation = useMutation({
        mutationFn: ({ id, spaces }: { id: number; spaces: number }) =>
            loadsService.updateLoadSpaces(id, spaces),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loads'] });
            toast.success('Reserved spaces updated');
        },
        onError: (error) => {
            toast.error(`Failed to update spaces: ${getErrorMessage(error)}`);
        },
    });

    // Delete load mutation
    const deleteLoadMutation = useMutation({
        mutationFn: loadsService.deleteLoad,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loads'] });
            toast.success('Load deleted successfully');
            setDeleteDialogOpen(false);
            setLoadToDelete(null);
        },
        onError: (error) => {
            toast.error(`Failed to delete load: ${getErrorMessage(error)}`);
        },
    });

    // Handle query errors with toast
    useEffect(() => {
        if (loadsQuery.error) {
            toast.error(`Failed to load loads: ${getErrorMessage(loadsQuery.error)}`);
        }
    }, [loadsQuery.error, toast]);

    const handleCreateLoad = () => {
        setEditingLoad(null);
        setLoadModalOpen(true);
    };

    const handleEditLoad = (load: Load) => {
        setEditingLoad(load);
        setLoadModalOpen(true);
    };

    const handleDeleteLoad = (load: Load) => {
        setLoadToDelete(load);
        setDeleteDialogOpen(true);
    };

    const handleLoadClick = (load: Load) => {
        setSelectedLoad(load);
    };

    const handleStatusChange = (loadId: number, status: LoadStatus) => {
        updateStatusMutation.mutate({ id: loadId, status });
    };

    const handleReservedSpacesChange = (loadId: number, spaces: number) => {
        updateSpacesMutation.mutate({ id: loadId, spaces });
    };

    const handleDepartureTimeChange = (loadId: number, time: string) => {
        updateLoadMutation.mutate({
            id: loadId,
            data: { departure: time } as UpdateLoadData
        });
    };

    const calculateAvailableSpaces = (load: Load) => {
        const totalSpaces = load.aircraft?.max_load || 0;
        return totalSpaces - load.reserved_spaces;
    };

    const handleLoadSave = (data: CreateLoadData | UpdateLoadData) => {
        if (editingLoad) {
            updateLoadMutation.mutate({ id: editingLoad.id, data: data as UpdateLoadData });
        } else {
            createLoadMutation.mutate(data as CreateLoadData);
        }
    };

    const confirmDelete = () => {
        if (loadToDelete) {
            deleteLoadMutation.mutate(loadToDelete.id);
        }
    };

    const loads = loadsQuery.data || [];
    const aircraft = aircraftQuery.data || [];
    const isLoading = loadsQuery.isLoading;

    // Debug log for data updates
    useEffect(() => {
        if (loadsQuery.dataUpdatedAt) {
            console.log('Loads data updated at:', new Date(loadsQuery.dataUpdatedAt).toLocaleTimeString());
        }
    }, [loadsQuery.dataUpdatedAt]);

    // Update selected load when loads change
    useEffect(() => {
        if (selectedLoad && loads.length > 0) {
            const updatedLoad = loads.find(l => l.id === selectedLoad.id);
            if (updatedLoad) {
                // Force update even if the object reference is the same
                setSelectedLoad(updatedLoad);
            } else {
                // Load was deleted, clear selection
                setSelectedLoad(null);
            }
        }
    }, [loads]);

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Main Content - Three Column Layout */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* First Column - Load List */}
                <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider' }}>
                    <LoadTable
                        key={`loads-${loads.length}-${loadsQuery.dataUpdatedAt}`} // Force re-render when data updates
                        loads={loads}
                        aircraft={aircraft}
                        statusFilter={statusFilter}
                        aircraftFilter={aircraftFilter}
                        onStatusFilterChange={setStatusFilter}
                        onAircraftFilterChange={setAircraftFilter}
                        onLoadClick={handleLoadClick}
                        onAddLoad={handleCreateLoad}
                        loading={isLoading}
                        aircraftLoading={aircraftQuery.isLoading}
                        selectedLoadId={selectedLoad?.id}
                    />
                </Box>

                {/* Second Column - Selected Load Details */}
                <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                    {selectedLoad ? (
                        <>
                            <LoadControlPanel
                                key={selectedLoad.id} // Force re-render when load changes
                                selectedLoad={selectedLoad}
                                onStatusChange={handleStatusChange}
                                onReservedSpacesChange={handleReservedSpacesChange}
                                onDepartureTimeChange={handleDepartureTimeChange}
                                calculateAvailableSpaces={calculateAvailableSpaces}
                                onEditLoad={handleEditLoad}
                                onDeleteLoad={handleDeleteLoad}
                            />

                            {/* Load Content Area */}
                            <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h6" gutterBottom>
                                    Load Jumps (TBD)
                                </Typography>
                                <Box sx={{
                                    flex: 1,
                                    border: 2,
                                    borderColor: 'divider',
                                    borderStyle: 'dashed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 1
                                }}>
                                    <Typography variant="body1" color="text.secondary">
                                        Jump manifest interface will be implemented here
                                    </Typography>
                                </Box>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 4
                        }}>
                            <Box textAlign="center">
                                <FlightIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    Select a Load
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Choose a load from the list to view and manage jumps
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Third Column - List of Manifested Jumps */}
                <Box sx={{ flex: 1, borderLeft: 1, borderColor: 'divider', p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Manifested Jumps
                    </Typography>
                    <Box sx={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 2,
                        borderColor: 'divider',
                        borderStyle: 'dashed',
                        borderRadius: 1
                    }}>
                        <Typography variant="body1" color="text.secondary">
                            Jump manifest interface will be implemented here
                        </Typography>
                    </Box>
                </Box>

                {/* Load Modal */}
                <LoadModal
                    open={loadModalOpen}
                    onClose={() => {
                        setLoadModalOpen(false);
                        setEditingLoad(null);
                    }}
                    onSave={handleLoadSave}
                    load={editingLoad}
                    loading={createLoadMutation.isPending || updateLoadMutation.isPending}
                />

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>Delete Load</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete Load #{loadToDelete?.id}?
                            This action cannot be undone and will remove all associated jump manifests.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={confirmDelete}
                            color="error"
                            variant="contained"
                            disabled={deleteLoadMutation.isPending}
                        >
                            {deleteLoadMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Box>
    );
};

export default ManifestingPage;
