import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Jump } from '@/types';

interface LoadJumpsAreaProps {
  jumps: Jump[];
  onJumpDragStart: (jump: Jump) => void;
  onDrop: (jump: Jump) => void;
  loading?: boolean;
}

const LoadJumpsArea: React.FC<LoadJumpsAreaProps> = ({
  jumps,
  onJumpDragStart,
  onDrop,
  loading = false,
}) => {
  const handleDragStart = (e: React.DragEvent, jump: Jump) => {
    e.dataTransfer.setData('application/json', JSON.stringify(jump));
    e.dataTransfer.effectAllowed = 'move';
    onJumpDragStart(jump);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const jumpData = JSON.parse(e.dataTransfer.getData('application/json'));
      onDrop(jumpData);
    } catch (error) {
      console.error('Failed to parse dropped jump data:', error);
    }
  };

  const getUserDisplayName = (jump: Jump) => {
    if (jump.user?.display_name) {
      return jump.user.display_name;
    }
    return `${jump.user?.first_name || ''} ${jump.user?.last_name || ''}`.trim();
  };

  const mainJumps = jumps.filter(jump => !jump.parent_jump_id);
  const staffJumps = jumps.filter(jump => jump.parent_jump_id);

  if (loading) {
    return (
      <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
      
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          minHeight: 200,
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {jumps.length === 0 ? (
          <Box sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
          }}>
            <Box textAlign="center">
              <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                Drop jumps here to assign to load
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 1 }}>
            {/* Main Jumps */}
            <List dense sx={{ p: 0 }}>
              {mainJumps.map((jump) => {
                const relatedStaff = staffJumps.filter(staff => staff.parent_jump_id === jump.id);
                
                return (
                  <Box key={jump.id}>
                    {/* Main Jump */}
                    <ListItem
                      component={Paper}
                      elevation={1}
                      draggable
                      onDragStart={(e) => handleDragStart(e, jump)}
                      sx={{
                        mb: 0.5,
                        cursor: 'grab',
                        borderRadius: 1,
                        backgroundColor: 'default.light',
                        color: 'default.contrastText',
                        '&:active': {
                          cursor: 'grabbing',
                        },
                        '&:hover': {
                          backgroundColor: 'default.main',
                        },
                      }}
                    >
                      <IconButton size="small" sx={{ mr: 1, cursor: 'inherit', color: 'inherit' }}>
                        <DragIcon fontSize="small" />
                      </IconButton>
                      <ListItemText
                        primary={getUserDisplayName(jump)}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={jump.jump_type?.short_name || 'Unknown'}
                              size="small"
                              variant="outlined"
                              sx={{ color: 'inherit', borderColor: 'currentColor' }}
                            />
                            {/* Reserved status chip */}
                            {jump.reserved !== undefined && (
                              <Chip
                                label='R'
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ color: 'inherit', borderColor: 'currentColor' }}
                              />
                            )}
                            {jump.comment && (
                              <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }}>
                                {jump.comment}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>

                    {/* Staff Jumps */}
                    {relatedStaff.map((staffJump) => (
                      <ListItem
                        key={staffJump.id}
                        component={Paper}
                        elevation={1}
                        sx={{
                          ml: 2,
                          mb: 0.5,
                          borderRadius: 1,
                          backgroundColor: 'action.hover',
                        }}
                      >
                        <Box sx={{ width: 24, mr: 1 }} /> {/* Spacer for alignment */}
                        <ListItemText
                          primary={`↳ ${getUserDisplayName(staffJump)}`}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={staffJump.jump_type?.short_name || 'Unknown'}
                                size="small"
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                Staff
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </Box>
                );
              })}
            </List>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LoadJumpsArea;
