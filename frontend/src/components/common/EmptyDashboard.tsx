import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Typography,
    Paper,
    keyframes,
} from '@mui/material';
import { FlightTakeoff, LocalCafe } from '@mui/icons-material';

const EmptyDashboard: React.FC = () => {
    const theme = useTheme();

    // Animation keyframes
    const float = keyframes`
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
    `;

    return (
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Floating clouds background */}
            {[...Array(4)].map((_, i) => (
                <Box
                    key={i}
                    sx={{
                        position: 'absolute',
                        width: `${60 + i * 15}px`,
                        height: `${30 + i * 8}px`,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '50px',
                        animation: `${float} ${4 + i * 0.5}s ease-in-out infinite`,
                        left: `${15 + i * 20}%`,
                        top: `${25 + i * 15}%`,
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            width: '50%',
                            height: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                            borderRadius: '50%',
                            top: '-25%',
                            left: '25%',
                        }
                    }}
                />
            ))}

            <Paper sx={{ 
                padding: { xs: 4, md: 6 },
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                textAlign: 'center',
                maxWidth: '550px',
                margin: 2,
                boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                {/* Aircraft icon */}
                <FlightTakeoff sx={{ 
                    fontSize: '3.5rem',
                    color: theme.palette.primary.main,
                    mb: 2
                }} />

                <Typography variant="h3" component="div" sx={{ 
                    mb: 1, 
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '1.75rem', md: '2.25rem' }
                }}>
                    No Loads Scheduled
                </Typography>

                <Typography variant="h6" sx={{ 
                    mb: 3,
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '1rem', md: '1.125rem' }
                }}>
                    All aircraft are currently on standby
                </Typography>

                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 1.5,
                    mb: 1
                }}>
                    <LocalCafe sx={{ 
                        fontSize: '1.25rem',
                        color: theme.palette.warning.main
                    }} />
                    <Typography variant="body1" sx={{ 
                        fontSize: { xs: '0.95rem', md: '1rem' },
                        color: theme.palette.text.secondary,
                        fontStyle: 'italic'
                    }}>
                        Pilot's having a proper brew, as one does
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default EmptyDashboard;
