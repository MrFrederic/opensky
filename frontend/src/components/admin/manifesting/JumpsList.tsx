import React from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { Jump } from '@/types';

interface JumpsListProps {
  jumps: Jump[];
  onAddJump: () => void;
  onJumpDragStart: (jump: Jump) => void;
  onJumpDrop?: (jump: Jump) => void;
  loading?: boolean;
}

const JumpsList: React.FC<JumpsListProps> = ({
  jumps,
  onAddJump,
  onJumpDragStart,
  onJumpDrop,
  loading = false,
}) => {
  const handleDragStart = (e: React.DragEvent, jump: Jump) => {
    e.dataTransfer.setData('application/json', JSON.stringify(jump));
    e.dataTransfer.effectAllowed = 'move';
    onJumpDragStart(jump);
  };

  const getUserDisplayName = (jump: Jump) => {
    if (jump.user?.display_name) {
      return jump.user.display_name;
    }
    return `${jump.user?.first_name || ''} ${jump.user?.last_name || ''}`.trim();
  };

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
              <ListItem
                key={jump.id}
                component={Paper}
                elevation={1}
                draggable
                onDragStart={(e) => handleDragStart(e, jump)}
                sx={{
                  mx: 1,
                  my: 0.5,
                  cursor: 'grab',
                  borderRadius: 1,
                  '&:active': {
                    cursor: 'grabbing',
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <IconButton size="small" sx={{ mr: 1, cursor: 'inherit' }}>
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
                      />
                      {jump.comment && (
                        <Typography variant="caption" color="text.secondary">
                          {jump.comment}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default JumpsList;
