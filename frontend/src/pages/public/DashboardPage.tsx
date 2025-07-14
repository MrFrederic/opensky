import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import { dashboardService } from '@/services/dashboard';
import { DashboardLoad, DashboardJump, LoadStatus } from '@/types';
import EmptyDashboard from '@/components/common/EmptyDashboard';

const getMinutesUntilDeparture = (departure: string): number => {
    const now = new Date();
    const departureTime = new Date(departure);
    return Math.round((departureTime.getTime() - now.getTime()) / (1000 * 60));
};

const getTimeColor = (minutes: number): string => {
    if (minutes >= 6) return 'green';
    return 'red';
};

const EmptyColumn: React.FC = () => {
    return (
        <Box
            sx={{
                height: '100vh',
                padding: 2,
            }}
        />
    );
};

const LoadColumn: React.FC<{ load: DashboardLoad }> = ({ load }) => {
    const minutesUntilDeparture = getMinutesUntilDeparture(load.departure);

    // Group jumps by parent
    const groupedJumps = React.useMemo(() => {
        const parentJumps = load.jumps.filter((jump: DashboardJump) => !jump.parent_jump_id);
        const childJumps = load.jumps.filter((jump: DashboardJump) => jump.parent_jump_id);

        return parentJumps.map((parent: DashboardJump) => ({
            parent,
            children: childJumps.filter((child: DashboardJump) => child.parent_jump_id === parent.jump_id)
        }));
    }, [load.jumps]);

    const renderLoadHeader = () => {
        switch (load.status) {
            case LoadStatus.FORMING:
                return (
                    <Box sx={{ position: 'relative', height: '100%' }}>
                        {/* Top left: Aircraft name */}
                        <Typography variant="body2" sx={{ position: 'absolute', top: 8, left: 0 }}>
                            {load.aircraft_name || 'Unknown Aircraft'}
                        </Typography>
                        {/* Top right: Free slots */}
                        <Typography variant="body2" sx={{ position: 'absolute', top: 8, right: 0 }}>
                            {load.remaining_public_slots} free
                        </Typography>
                        {/* Center: Status above big time */}
                        <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -60%)', textAlign: 'center', width: '100%' }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    textTransform: 'capitalize',
                                    mb: 0.5,
                                    display: 'block'
                                }}
                            >
                                {load.status.replace('_', ' ')}
                            </Typography>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 'bold',
                                    lineHeight: 1.1
                                }}
                            >
                                {minutesUntilDeparture} min
                            </Typography>
                        </Box>
                    </Box>
                );

            case LoadStatus.ON_CALL:
                return (
                    <Box sx={{ position: 'relative', height: '100%' }}>
                        <Typography variant="body2" sx={{ position: 'absolute', top: 8, left: 0 }}>
                            {load.aircraft_name ? load.aircraft_name.split(' ')[0] : ''}
                        </Typography>
                        <Typography variant="body2" sx={{ position: 'absolute', top: 8, right: 0 }}>
                            {load.remaining_public_slots} free
                        </Typography>
                        <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -60%)', textAlign: 'center', width: '100%' }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    textTransform: 'capitalize',
                                    mb: 0.5,
                                    display: 'block'
                                }}
                            >
                                {load.status.replace('_', ' ')}
                            </Typography>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 'bold',
                                    color: getTimeColor(minutesUntilDeparture),
                                    lineHeight: 1.1
                                }}
                            >
                                {minutesUntilDeparture} min
                            </Typography>
                        </Box>
                    </Box>
                );

            case LoadStatus.DEPARTED:
                return (
                    <Box sx={{ position: 'relative', height: '100%' }}>
                        <Typography variant="body2" sx={{ position: 'absolute', top: 8, left: 0 }}>
                            {load.aircraft_name ? load.aircraft_name.split(' ')[0] : 'Aircraft'}
                        </Typography>
                        <Typography variant="body2" sx={{ position: 'absolute', top: 8, right: 0 }}>
                            {minutesUntilDeparture} min
                        </Typography>
                        <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -25%)', textAlign: 'center', width: '100%' }}>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    lineHeight: 1.1
                                }}
                            >
                                {load.status}
                            </Typography>
                        </Box>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <Box
            sx={{
                height: '100vh',
                overflow: 'auto'
            }}
        >
            <Box
                sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    padding: 1,
                    backgroundColor: '#e3f2fd', // light blue
                    height: 80,
                }}
            >
                {renderLoadHeader()}
            </Box>

            <Box sx={{ padding: 2 }}>
                {groupedJumps.map(({ parent, children }: { parent: DashboardJump; children: DashboardJump[] }) => (
                    <Box key={parent.jump_id} sx={{ mb: 1, borderBottom: '1px solid', borderColor: 'divider'}}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                {parent.display_name}
                            </Typography>
                            {parent.jump_type_short_name && (
                                <Chip
                                    label={parent.jump_type_short_name}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                            )}
                        </Box>

                        {children.map((child: DashboardJump) => (
                            <Box
                                key={child.jump_id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    ml: 0.5,
                                    mb: 0.5
                                }}
                            >
                                <Typography variant="body2" sx={{ flexGrow: 1, fontSize: '0.875rem' }}>
                                    ↳ {child.display_name}
                                </Typography>
                                {child.jump_type_short_name && (
                                    <Chip
                                        label={child.jump_type_short_name}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: '0.65rem', height: 18 }}
                                    />
                                )}
                            </Box>
                        ))}
                    </Box>
                ))}

                {load.jumps.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No manifested jumps
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

const DashboardPage: React.FC = () => {
    const { data: loads, isLoading, error } = useQuery<DashboardLoad[]>({
        queryKey: ['dashboard'],
        queryFn: dashboardService.getDashboard,
        refetchInterval: 5000, // Refresh every 5 seconds
        staleTime: 0, // Always consider data stale to ensure visual updates
        refetchIntervalInBackground: true, // Continue refetching even when window is not focused
    });

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Alert severity="error">
                    Failed to load dashboard data. Please try again later.
                </Alert>
            </Box>
        );
    }

    if (!loads || loads.length === 0) {
        return <EmptyDashboard />;
    }

    return (
        <Box sx={{
            height: '100vh',
            backgroundColor: 'white',
            display: 'grid',
            gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
                lg: 'repeat(6, 1fr)'
            },
            '& > *': {
                borderRight: '1px solid',
                borderColor: 'divider',
            },
            '& > *:last-child': {
                borderRight: 'none',
            }
        }}>
            {/* Always render the maximum number of columns for each breakpoint */}
            {Array.from({ length: 6 }, (_, index) => {
                const load = loads?.[index];
                return load ? (
                    <LoadColumn key={load.load_id} load={load} />
                ) : (
                    <EmptyColumn key={`empty-${index}`} />
                );
            })}
        </Box>
    );
};

export default DashboardPage;
