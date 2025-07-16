import React from 'react';
import {
  Box,
  Typography,
  Button,
  List,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { Jump } from '@/types';
import { JumpSummary } from '@/services/manifest';
import JumpCard from '@/components/common/JumpCard';

interface JumpsListProps {
  jumps: (Jump | JumpSummary)[];
  onAddJump: () => void;
  onJumpDragStart: (jump: Jump | JumpSummary) => void;
  onJumpDrop?: (jump: Jump | JumpSummary) => void;
  onJumpEdit?: (jump: Jump | JumpSummary) => void;
  onJumpDelete?: (jump: Jump | JumpSummary) => void;
  loading?: boolean;
}

const JumpsList: React.FC<JumpsListProps> = ({
  jumps,
  onAddJump,
  onJumpDragStart,
  onJumpDrop,
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
      onJumpDrop?.(jumpData);
    } catch (error) {
      console.error('Failed to parse dropped jump data:', error);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">
            Manifested Jumps
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddJump}
            variant="contained"
          >
            Add Jump
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Drag jumps to assign to loads
        </Typography>
      </Box>

      {/* Jumps List */}
      <Box 
        sx={{ flex: 1, overflow: 'auto' }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Typography color="text.secondary">Loading...</Typography>
          </Box>
        ) : jumps.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No manifested jumps without loads
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ p: 0 }}>
            {jumps.map((jump) => (
              <JumpCard
                key={jump.id}
                jump={jump}
                isDraggable={true}
                variant="default"
                showActions={true}
                onDragStart={(_e, jump) => onJumpDragStart(jump as Jump | JumpSummary)}
                onEdit={(jump) => onJumpEdit?.(jump as Jump | JumpSummary)}
                onDelete={(jump) => onJumpDelete?.(jump as Jump | JumpSummary)}
                sx={{ mx: 1, my: 0.5 }}
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default JumpsList;
