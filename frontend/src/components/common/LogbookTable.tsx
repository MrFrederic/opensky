import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Chip,
    Stack,
    TableContainer,
    Table,
    TableRow,
    TableCell,
    TableBody,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    ListItemText,
    Checkbox,
    IconButton,
    InputAdornment,
} from '@mui/material';
import { Clear } from '@mui/icons-material';
import { TableVirtuoso } from 'react-virtuoso';

import { jumpsService, GetLogbookParams } from '@/services/jumps';
import { jumpTypesService } from '@/services/jump-types';
import { aircraftService } from '@/services/aircraft';
import { formatDateConsistent } from '@/lib/utils';

interface LogbookTableProps {
    userId?: number; // If provided, shows specific user's logbook (admin only), otherwise shows current user's
    title?: string;
    showFilters?: boolean;
    height?: number | string;
}

const LogbookTable: React.FC<LogbookTableProps> = ({
    userId,
    showFilters = true,
    height = 600,
}) => {
    const [filters, setFilters] = useState<{
        jumpTypeIds: number[];
        aircraftIds: number[];
        manifestedOnly?: boolean;
    }>({
        jumpTypeIds: [],
        aircraftIds: [],
    });

    // Query parameters with filters
    const queryParams: GetLogbookParams = {
        jump_type_ids: filters.jumpTypeIds.length > 0 ? filters.jumpTypeIds : undefined,
        aircraft_ids: filters.aircraftIds.length > 0 ? filters.aircraftIds : undefined,
    };

    // Fetch available jump types for dropdown
    const { data: jumpTypes = [] } = useQuery({
        queryKey: ['jumpTypes'],
        queryFn: () => jumpTypesService.getJumpTypes({ limit: 1000 }),
    });

    // Fetch available aircraft for dropdown
    const { data: aircraft = [] } = useQuery({
        queryKey: ['aircraft'],
        queryFn: () => aircraftService.getAircraft({ limit: 1000 }),
    });

    // Fetch logbook data
    const {
        data: logbookData,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['logbook', userId, filters],
        queryFn: () => {
            if (userId) {
                return jumpsService.getUserLogbook(userId, queryParams);
            }
            return jumpsService.getMyLogbook(queryParams);
        },
    });

    // Use jumps directly from the backend (filtering is done server-side)
    const filteredJumps = logbookData?.jumps || [];

    if (isLoading) {
        return (
            <Paper sx={{ p: 3, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper sx={{ p: 3, height }}>
                <Alert severity="error" action={
                    <button onClick={() => refetch()}>Retry</button>
                }>
                    Failed to load logbook data
                </Alert>
            </Paper>
        );
    }

    return (
        <Paper sx={{ height, display: 'flex', flexDirection: 'column' }}>
            {/* Filters */}
            {showFilters && (
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">

                        {/* Jump Types Multi-Select */}
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Jump Types</InputLabel>
                            <Select
                                multiple
                                value={filters.jumpTypeIds}
                                onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    jumpTypeIds: typeof e.target.value === 'string' ? [parseInt(e.target.value)] : e.target.value
                                }))}
                                input={<OutlinedInput label="Jump Types" />}
                                IconComponent={() => null}
                                endAdornment={
                                    filters.jumpTypeIds.length > 0 && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={() => setFilters(prev => ({
                                                    ...prev,
                                                    jumpTypeIds: []
                                                }))}
                                                edge="end"
                                            >
                                                <Clear />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((id) => {
                                            const jumpType = jumpTypes.find(jt => jt.id === id);
                                            return (
                                                <Chip key={id} label={jumpType?.name || `ID: ${id}`} size="small" />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {jumpTypes.map((jumpType) => (
                                    <MenuItem key={jumpType.id} value={jumpType.id}>
                                        <Checkbox checked={filters.jumpTypeIds.indexOf(jumpType.id) > -1} />
                                        <ListItemText primary={jumpType.name} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Aircraft Multi-Select */}
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Aircraft</InputLabel>
                            <Select
                                multiple
                                value={filters.aircraftIds}
                                onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    aircraftIds: typeof e.target.value === 'string' ? [parseInt(e.target.value)] : e.target.value
                                }))}
                                input={<OutlinedInput label="Aircraft" />}
                                IconComponent={() => null}
                                endAdornment={
                                    filters.aircraftIds.length > 0 && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={() => setFilters(prev => ({
                                                    ...prev,
                                                    aircraftIds: []
                                                }))}
                                                edge="end"
                                            >
                                                <Clear />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((id) => {
                                            const aircraftItem = aircraft.find(a => a.id === id);
                                            return (
                                                <Chip key={id} label={aircraftItem?.name || `ID: ${id}`} size="small" />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {aircraft.map((aircraftItem) => (
                                    <MenuItem key={aircraftItem.id} value={aircraftItem.id}>
                                        <Checkbox checked={filters.aircraftIds.indexOf(aircraftItem.id) > -1} />
                                        <ListItemText primary={aircraftItem.name} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Box>
            )}

            {/* Table */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <TableContainer sx={{ height: '100%' }}>
                    <TableVirtuoso
                        data={filteredJumps}
                        components={{
                            Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
                                <div {...props} ref={ref} />
                            )),
                            Table: (props) => (
                                <Table {...props} sx={{ width: '100%' }} />
                            ),
                            TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
                                <TableBody {...props} ref={ref} />
                            )),
                            TableRow: ({ item: _item, ...props }) => (
                                <TableRow
                                    {...props}
                                    sx={{
                                        width: '100%',
                                        '& td': { borderBottom: '1px solid', borderColor: 'divider' }
                                    }}
                                />
                            ),
                        }}
                        fixedHeaderContent={() => (
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', minWidth: 140, backgroundColor: 'background.paper' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Date
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', minWidth: 200, backgroundColor: 'background.paper' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Jump Type
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', minWidth: 140, backgroundColor: 'background.paper' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Aircraft
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 'bold', minWidth: 200, width: '100%', backgroundColor: 'background.paper' }}>
                                    Comment
                                </TableCell>
                            </TableRow>
                        )}
                        itemContent={(index) => {
                            const jump = filteredJumps[index];
                            if (!jump) return null;

                            return (
                                <>
                                    <TableCell>{jump.jump_date ? formatDateConsistent(jump.jump_date) : '-'}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {jump.jump_type_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{jump.aircraft_name || '-'}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" noWrap>
                                            {jump.comment || '-'}
                                        </Typography>
                                    </TableCell>
                                </>
                            );
                        }}
                    />
                </TableContainer>
            </Box>

            {/* Empty state */}
            {filteredJumps.length === 0 && !isLoading && (
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 4
                }}>
                    <Typography variant="body1" color="text.secondary">
                        {filters.jumpTypeIds.length > 0 || filters.aircraftIds.length > 0 || filters.manifestedOnly
                            ? 'No jumps match your filter criteria'
                            : 'No jumps found'
                        }
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default LogbookTable;
