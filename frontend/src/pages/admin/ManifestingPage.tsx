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
import { jumpsService } from '@/services/jumps';
import { manifestService } from '@/services/manifest';
import LoadTable from '@/components/admin/manifesting/LoadTable';
import LoadControlPanel from '@/components/admin/manifesting/LoadControlPanel';
import LoadModal from '@/components/admin/manifesting/LoadModal';
import JumpModal from '@/components/admin/manifesting/JumpModal';
import JumpsList from '@/components/admin/manifesting/JumpsList';
import LoadJumpsArea from '@/components/admin/manifesting/LoadJumpsArea';
import StaffAssignmentModal from '@/components/admin/manifesting/StaffAssignmentModal';
import JumpRemovalDialog from '@/components/admin/manifesting/JumpRemovalDialog';
import { Load, LoadStatus, CreateLoadData, UpdateLoadData, Jump, CreateJumpData, UpdateJumpData } from '@/types';
import { LoadSummary, JumpSummary } from '@/services/manifest';
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
    const [jumpModalOpen, setJumpModalOpen] = useState(false);
    const [editingJump, setEditingJump] = useState<Jump | null>(null);
    const [staffAssignmentModalOpen, setStaffAssignmentModalOpen] = useState(false);
    const [jumpRemovalDialogOpen, setJumpRemovalDialogOpen] = useState(false);
    const [pendingJumpAssignment, setPendingJumpAssignment] = useState<{jump: Jump | JumpSummary, loadId: number, reserved?: boolean} | null>(null);
    const [pendingJumpRemoval, setPendingJumpRemoval] = useState<Jump | JumpSummary | null>(null);

    // Delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [loadToDelete, setLoadToDelete] = useState<Load | null>(null);

    // Selected load state - now using LoadSummary instead of Load
    const [selectedLoad, setSelectedLoad] = useState<LoadSummary | null>(null);

    // Drag and drop state
    const [draggedJump, setDraggedJump] = useState<Jump | null>(null);

    // Fetch all manifest data with a single endpoint
    const manifestQuery = useQuery({
        queryKey: ['manifest', statusFilter, aircraftFilter, selectedLoad?.id],
        queryFn: () => manifestService.getManifestData({
            hide_old_loads: true,
            aircraft_ids: aircraftFilter ? [aircraftFilter] : undefined,
            load_statuses: statusFilter ? [statusFilter] : undefined,
            selected_load_id: selectedLoad?.id,
            is_manifested: true,
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
            queryClient.invalidateQueries({ queryKey: ['manifest'] });
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
            queryClient.invalidateQueries({ queryKey: ['manifest'] });
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
            queryClient.invalidateQueries({ queryKey: ['manifest'] });
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
            queryClient.invalidateQueries({ queryKey: ['manifest'] });
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
            queryClient.invalidateQueries({ queryKey: ['manifest'] });
            toast.success('Load deleted successfully');
            setDeleteDialogOpen(false);
            setLoadToDelete(null);
        },
        onError: (error) => {
            toast.error(`Failed to delete load: ${getErrorMessage(error)}`);
        },
    });

    // Create jump mutation
    const createJumpMutation = useMutation({
        mutationFn: jumpsService.createJump,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manifest'] });
            toast.success('Jump created successfully');
            setJumpModalOpen(false);
            setEditingJump(null);
        },
        onError: (error) => {
            toast.error(`Failed to create jump: ${getErrorMessage(error)}`);
        },
    });

    // Update jump mutation
    const updateJumpMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateJumpData }) =>
            jumpsService.updateJump(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manifest'] });
            toast.success('Jump updated successfully');
            setJumpModalOpen(false);
            setEditingJump(null);
        },
        onError: (error) => {
            toast.error(`Failed to update jump: ${getErrorMessage(error)}`);
        },
    });

    // Delete jump mutation
    const deleteJumpMutation = useMutation({
        mutationFn: jumpsService.deleteJump,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['manifest'] });
            toast.success('Jump deleted successfully');
            setJumpModalOpen(false);
            setEditingJump(null);
        },
        onError: (error) => {
            toast.error(`Failed to delete jump: ${getErrorMessage(error)}`);
        },
    });

    // Assign jump to load mutation
    const assignJumpMutation = useMutation({
        mutationFn: ({ jumpId, loadId, reserved, staffAssignments }: { 
            jumpId: number; 
            loadId: number; 
            reserved?: boolean;
            staffAssignments?: Record<string, number> 
        }) =>
            jumpsService.assignJumpToLoad(jumpId, loadId, { 
                jump_id: jumpId, 
                reserved: reserved || false,
                staff_assignments: staffAssignments 
            }),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['manifest'] });
            toast.success(response.message);
            if (response.warning) {
                toast.warning(response.warning);
            }
            // Close staff assignment modal if open
            setStaffAssignmentModalOpen(false);
            setPendingJumpAssignment(null);
        },
        onError: (error) => {
            toast.error(`Failed to assign jump to load: ${getErrorMessage(error)}`);
            // Close staff assignment modal on error
            setStaffAssignmentModalOpen(false);
            setPendingJumpAssignment(null);
        },
    });

    // Remove jump from load mutation
    const removeJumpMutation = useMutation({
        mutationFn: ({ jumpId, clearStaffAssignments }: { jumpId: number; clearStaffAssignments?: boolean }) =>
            jumpsService.removeJumpFromLoad(jumpId, clearStaffAssignments),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['manifest'] });
            toast.success(response.message);
            // Close removal dialog if open
            setJumpRemovalDialogOpen(false);
            setPendingJumpRemoval(null);
        },
        onError: (error) => {
            toast.error(`Failed to remove jump from load: ${getErrorMessage(error)}`);
            // Close removal dialog on error
            setJumpRemovalDialogOpen(false);
            setPendingJumpRemoval(null);
        },
    });

    // Handle query errors with toast
    useEffect(() => {
        if (manifestQuery.error) {
            toast.error(`Failed to load manifest data: ${getErrorMessage(manifestQuery.error)}`);
        }
    }, [manifestQuery.error, toast]);

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

    const handleLoadClick = (load: LoadSummary) => {
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

    const calculateAvailableSpaces = (load: LoadSummary) => {
        return load.total_spaces - load.reserved_spaces;
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

    // Jump handlers
    const handleCreateJump = () => {
        setEditingJump(null);
        setJumpModalOpen(true);
    };

    const handleEditJump = (jump: Jump | JumpSummary) => {
        // Convert JumpSummary to Jump for the modal
        if ('jump_type_id' in jump) {
            setEditingJump(jump as Jump);
        } else {
            // For JumpSummary, we need to create a Jump-like object
            const jumpData = {
                ...jump,
                jump_type_id: jump.jump_type?.id || 0,
                is_manifested: true,
                child_jumps: [],
                created_at: '',
                updated_at: '',
                created_by: null,
                updated_by: null,
                jump_date: null,
                parent_jump_id: undefined,
                parent_jump: null,
                load: null,
                user: {
                    id: jump.user_id,
                    first_name: '',
                    last_name: jump.user_name || '',
                    email: '',
                    display_name: jump.user_name,
                    roles: [],
                    avatar_url: null,
                    created_at: '',
                    updated_at: ''
                },
                jump_type: jump.jump_type || {
                    id: 0,
                    name: jump.jump_type_name || '',
                    short_name: jump.jump_type_name || '',
                    category: '',
                    price: 0,
                    additional_staff: [],
                    created_at: '',
                    updated_at: ''
                }
            } as unknown as Jump;
            setEditingJump(jumpData);
        }
        setJumpModalOpen(true);
    };

    const handleDeleteJump = async (jump: Jump | JumpSummary) => {
        try {
            // If jump is assigned to a load, remove it first
            if ('load_id' in jump && jump.load_id) {
                await removeJumpMutation.mutateAsync({ 
                    jumpId: jump.id, 
                    clearStaffAssignments: true 
                });
            }
            
            // Then delete the jump
            deleteJumpMutation.mutate(jump.id);
        } catch (error) {
            console.error('Error removing jump from load:', error);
        }
    };

    const handleDeleteJumpFromModal = (jumpId: number) => {
        deleteJumpMutation.mutate(jumpId);
    };

    const handleJumpSave = (data: CreateJumpData | UpdateJumpData) => {
        if (editingJump) {
            updateJumpMutation.mutate({ id: editingJump.id, data: data as UpdateJumpData });
        } else {
            createJumpMutation.mutate(data as CreateJumpData);
        }
    };

    const handleJumpDragStart = (jump: Jump | JumpSummary) => {
        setDraggedJump(jump as Jump); // Cast for now since state expects Jump
    };

    const handleJumpDropToLoad = (jump: Jump | JumpSummary) => {
        if (selectedLoad) {
            checkAndAssignJump(jump, selectedLoad.id);
        }
    };

    const handleJumpDropToList = (jump: Jump | JumpSummary) => {
        if ('load_id' in jump && jump.load_id) {
            // Check if jump has staff assignments
            const hasStaffAssignments = jump.staff_assignments && Object.keys(jump.staff_assignments).length > 0;
            
            if (hasStaffAssignments) {
                // Show confirmation dialog
                setPendingJumpRemoval(jump);
                setJumpRemovalDialogOpen(true);
            } else {
                // Remove directly without staff assignments
                removeJumpMutation.mutate({ jumpId: jump.id, clearStaffAssignments: false });
            }
        }
    };

    const handleJumpDropToLoadTable = (jump: any, load: LoadSummary) => {
        checkAndAssignJump(jump, load.id);
    };

    const handleJumpDropOnSpaces = (jump: any, load: LoadSummary, reserved: boolean) => {
        checkAndAssignJump(jump, load.id, reserved);
    };

    const checkAndAssignJump = (jump: Jump | JumpSummary, loadId: number, reserved: boolean = false) => {
        const additionalStaff = jump.jump_type?.additional_staff || [];
        
        if (additionalStaff.length > 0) {
            // Jump requires additional staff
            if (jump.staff_assignments && Object.keys(jump.staff_assignments).length > 0) {
                // Jump has existing staff assignments, transfer them directly
                assignJumpMutation.mutate({ 
                    jumpId: jump.id, 
                    loadId, 
                    reserved, 
                    staffAssignments: jump.staff_assignments 
                });
            } else {
                // No existing assignments, show modal
                setPendingJumpAssignment({ jump, loadId, reserved });
                setStaffAssignmentModalOpen(true);
            }
        } else {
            // No additional staff required, assign directly
            assignJumpMutation.mutate({ jumpId: jump.id, loadId, reserved });
        }
    };

    const handleStaffAssignmentConfirm = (staffAssignments: Record<string, number>) => {
        if (pendingJumpAssignment) {
            assignJumpMutation.mutate({
                jumpId: pendingJumpAssignment.jump.id,
                loadId: pendingJumpAssignment.loadId,
                reserved: pendingJumpAssignment.reserved || false,
                staffAssignments
            });
        }
    };

    const handleStaffAssignmentCancel = () => {
        setStaffAssignmentModalOpen(false);
        setPendingJumpAssignment(null);
    };

    const handleJumpRemovalConfirm = (clearStaffAssignments: boolean) => {
        if (pendingJumpRemoval) {
            removeJumpMutation.mutate({ 
                jumpId: pendingJumpRemoval.id, 
                clearStaffAssignments 
            });
        }
    };

    const handleJumpRemovalCancel = () => {
        setJumpRemovalDialogOpen(false);
        setPendingJumpRemoval(null);
    };

    const manifestData = manifestQuery.data;
    const loads = manifestData?.loads || [];
    const aircraft = aircraftQuery.data || [];
    const manifestedJumps = manifestData?.unassigned_jumps || [];
    const loadJumps = manifestData?.selected_load_jumps || [];
    const isLoading = manifestQuery.isLoading;

    // Debug log for data updates
    useEffect(() => {
        if (manifestQuery.dataUpdatedAt) {
            console.log('Manifest data updated at:', new Date(manifestQuery.dataUpdatedAt).toLocaleTimeString());
        }
    }, [manifestQuery.dataUpdatedAt]);

    // Update selected load when loads change
    useEffect(() => {
        if (selectedLoad && loads.length > 0) {
            const updatedLoad = loads.find(l => l.id === selectedLoad.id);
            if (updatedLoad) {
                // Update selected load to maintain sync with the list
                setSelectedLoad(updatedLoad as any); // Type assertion for compatibility
            } else {
                // Load was deleted, clear selection
                setSelectedLoad(null);
            }
        }
    }, [loads, selectedLoad]);

    // Sync selected load with backend's default selection
    useEffect(() => {
        if (manifestData?.selected_load && !selectedLoad) {
            // Backend selected a default load, sync it to frontend state
            const backendSelectedLoad = loads.find(l => l.id === manifestData.selected_load);
            if (backendSelectedLoad) {
                setSelectedLoad(backendSelectedLoad);
            }
        }
    }, [manifestData?.selected_load, selectedLoad, loads]);

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Main Content - Three Column Layout */}
            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* First Column - Load List */}
                <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider' }}>
                    <LoadTable
                        key={`loads-${loads.length}-${manifestQuery.dataUpdatedAt}`} // Force re-render when data updates
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
                        onJumpDrop={handleJumpDropToLoadTable}
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
                                onEditLoad={(load) => {
                                    // Convert LoadSummary to Load for the modal - would be better to fetch full data
                                    const fullLoad: Load = {
                                        id: load.id,
                                        departure: load.departure,
                                        aircraft_id: load.aircraft_id,
                                        status: load.status,
                                        reserved_spaces: load.reserved_spaces,
                                        aircraft: { id: load.aircraft_id, name: load.aircraft_name, type: 'plane' as any, max_load: load.total_spaces, created_at: '', updated_at: '' },
                                        created_at: '',
                                        updated_at: '',
                                        total_spaces: load.total_spaces,
                                        occupied_public_spaces: load.total_spaces - load.remaining_public_spaces - load.remaining_reserved_spaces,
                                        occupied_reserved_spaces: load.reserved_spaces - load.remaining_reserved_spaces,
                                        remaining_public_spaces: load.remaining_public_spaces,
                                        remaining_reserved_spaces: load.remaining_reserved_spaces,
                                    };
                                    handleEditLoad(fullLoad);
                                }}
                                onDeleteLoad={(load) => {
                                    // Similar conversion for delete
                                    const fullLoad: Load = {
                                        id: load.id,
                                        departure: load.departure,
                                        aircraft_id: load.aircraft_id,
                                        status: load.status,
                                        reserved_spaces: load.reserved_spaces,
                                        aircraft: { id: load.aircraft_id, name: load.aircraft_name, type: 'plane' as any, max_load: load.total_spaces, created_at: '', updated_at: '' },
                                        created_at: '',
                                        updated_at: '',
                                        total_spaces: load.total_spaces,
                                        occupied_public_spaces: load.total_spaces - load.remaining_public_spaces - load.remaining_reserved_spaces,
                                        occupied_reserved_spaces: load.reserved_spaces - load.remaining_reserved_spaces,
                                        remaining_public_spaces: load.remaining_public_spaces,
                                        remaining_reserved_spaces: load.remaining_reserved_spaces,
                                    };
                                    handleDeleteLoad(fullLoad);
                                }}
                                onJumpDrop={handleJumpDropOnSpaces}
                            />

                            {/* Load Content Area */}
                            <LoadJumpsArea
                                jumps={loadJumps}
                                onJumpDragStart={handleJumpDragStart}
                                onDrop={handleJumpDropToLoad}
                                onJumpEdit={handleEditJump}
                                onJumpDelete={handleDeleteJump}
                                loading={manifestQuery.isLoading}
                            />
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
                <Box sx={{ flex: 1, borderLeft: 1, borderColor: 'divider' }}>
                    <JumpsList
                        jumps={manifestedJumps}
                        onAddJump={handleCreateJump}
                        onJumpDragStart={handleJumpDragStart}
                        onJumpDrop={handleJumpDropToList}
                        onJumpEdit={handleEditJump}
                        onJumpDelete={handleDeleteJump}
                        loading={manifestQuery.isLoading}
                    />
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

                {/* Jump Modal */}
                <JumpModal
                    open={jumpModalOpen}
                    onClose={() => {
                        setJumpModalOpen(false);
                        setEditingJump(null);
                    }}
                    onSave={handleJumpSave}
                    onDelete={handleDeleteJumpFromModal}
                    jump={editingJump}
                    loading={createJumpMutation.isPending || updateJumpMutation.isPending}
                />

                {/* Staff Assignment Modal */}
                <StaffAssignmentModal
                    open={staffAssignmentModalOpen}
                    onClose={handleStaffAssignmentCancel}
                    onConfirm={handleStaffAssignmentConfirm}
                    jump={pendingJumpAssignment?.jump || null}
                    loading={assignJumpMutation.isPending}
                />

                {/* Jump Removal Dialog */}
                <JumpRemovalDialog
                    open={jumpRemovalDialogOpen}
                    onClose={handleJumpRemovalCancel}
                    onConfirm={handleJumpRemovalConfirm}
                    jump={pendingJumpRemoval}
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
