import React from 'react';
import {
  Box,
  Typography,
  List,
} from '@mui/material';
import {
  Person as PersonIcon,
} from '@mui/icons-material';
import { Jump } from '@/types';
import { JumpSummary } from '@/services/manifest';
import JumpCard, { JumpCardProps } from '@/components/common/JumpCard';

interface LoadJumpsAreaProps {
  jumps: (Jump | JumpSummary)[];
  onJumpDragStart: (jump: Jump | JumpSummary) => void;
  onDrop: (jump: Jump | JumpSummary) => void;
  onJumpEdit?: (jump: Jump | JumpSummary) => void;
  onJumpDelete?: (jump: Jump | JumpSummary) => void;
  loading?: boolean;
}

const LoadJumpsArea: React.FC<LoadJumpsAreaProps> = ({
  jumps,
  onJumpDragStart,
  onDrop,
  onJumpEdit,
  onJumpDelete,
  loading = false,
}) => {
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
                    <JumpCard
                      jump={jump}
                      isDraggable={true}
                      variant="assigned"
                      showActions={true}
                      onDragStart={(_e, jump) => onJumpDragStart(jump as Jump | JumpSummary)}
                      onEdit={(jump) => onJumpEdit?.(jump as Jump | JumpSummary)}
                      onDelete={(jump) => onJumpDelete?.(jump as Jump | JumpSummary)}
                      sx={{ mb: 0.5 }}
                    />

                    {/* Staff Jumps */}
                    {relatedStaff.map((staffJump) => (
                      <JumpCard
                        key={staffJump.id}
                        jump={staffJump}
                        isDraggable={false}
                        isStaff={true}
                        variant="staff"
                        showActions={true}
                        onEdit={(jump) => onJumpEdit?.(jump as Jump | JumpSummary)}
                        onDelete={(jump) => onJumpDelete?.(jump as Jump | JumpSummary)}
                        sx={{ mb: 0.5 }}
                      />
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
