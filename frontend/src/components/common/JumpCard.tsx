import React from 'react';
import {
  Box,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Paper,
  Typography,
} from '@mui/material';
import {
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { Jump } from '@/types';
import { JumpSummary } from '@/services/manifest';
import { formatUserName } from '@/lib/utils';

// Flexible interface that works with both Jump and JumpSummary
type JumpCardData = Jump | JumpSummary | {
  id: number;
  user_id: number;
  user_name?: string;
  jump_type_name?: string;
  reserved?: boolean;
  comment?: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    display_name?: string;
  };
  jump_type?: {
    id: number;
    name: string;
    short_name: string;
  };
};

export interface JumpCardProps {
  jump: JumpCardData;
  isDraggable?: boolean;
  isStaff?: boolean;
  variant?: 'default' | 'staff' | 'assigned';
  elevation?: number;
  onDragStart?: (e: React.DragEvent, jump: JumpCardData) => void;
  onClick?: (jump: JumpCardData) => void;
  showReservedStatus?: boolean;
  showComment?: boolean;
  customChips?: React.ReactNode[];
  sx?: object;
}

const JumpCard: React.FC<JumpCardProps> = ({
  jump,
  isDraggable = true,
  isStaff = false,
  variant = 'default',
  elevation = 1,
  onDragStart,
  onClick,
  showReservedStatus = true,
  showComment = true,
  customChips = [],
  sx = {},
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable || !onDragStart) return;
    e.dataTransfer.setData('application/json', JSON.stringify(jump));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(e, jump);
  };

  const handleClick = () => {
    onClick?.(jump);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'assigned':
        return {
          backgroundColor: 'default.light',
          color: 'default.contrastText',
          '&:hover': {
            backgroundColor: 'default.main',
          },
        };
      case 'staff':
        return {
          backgroundColor: 'action.hover',
          pl: 2,
          ml: 2,
        };
      default:
        return {
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        };
    }
  };

  const renderPrimary = () => {
    // Handle both Jump and JumpSummary formats
    let displayName = '';
    if ('user' in jump && jump.user) {
      displayName = formatUserName(jump.user);
    } else if ('user_name' in jump && jump.user_name) {
      displayName = jump.user_name;
    }
    return isStaff ? `↳ ${displayName}` : displayName;
  };

  const renderSecondary = () => {
    // Get jump type name from either format
    let jumpTypeName = 'Unknown';
    if ('jump_type' in jump && jump.jump_type?.short_name) {
      jumpTypeName = jump.jump_type.short_name;
    } else if ('jump_type_name' in jump && jump.jump_type_name) {
      jumpTypeName = jump.jump_type_name;
    }

    // Get comment from either format
    const comment = 'comment' in jump ? jump.comment : undefined;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        {/* Jump Type Chip */}
        <Chip
          label={jumpTypeName}
          size="small"
          variant="outlined"
          sx={variant === 'assigned' ? { 
            color: 'inherit', 
            borderColor: 'currentColor' 
          } : {}}
        />

        {/* Reserved Status Chip */}
        {showReservedStatus && jump.reserved === true && (
          <Chip
            label="R"
            size="small"
            color="primary"
            variant="outlined"
          />
        )}

        {/* Custom chips */}
        {customChips}

        {/* Comment */}
        {showComment && comment && (
          <Typography 
            variant="caption" 
            sx={variant === 'assigned' ? 
              { color: 'inherit', opacity: 0.8 } : 
              { color: 'text.secondary' }
            }
          >
            {comment}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <ListItem
      component={Paper}
      elevation={elevation}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onClick={handleClick}
      sx={{
        mb: 0.5,
        cursor: isDraggable ? 'grab' : onClick ? 'pointer' : 'default',
        borderRadius: 1,
        width: '100%',
        '&:active': isDraggable ? {
          cursor: 'grabbing',
        } : {},
        ...getVariantStyles(),
        ...sx,
      }}
    >
      {/* Drag Handle or Spacer */}
      {isDraggable ? (
        <IconButton 
          size="small" 
          sx={{ 
            mr: 1, 
            cursor: 'inherit', 
            color: variant === 'assigned' ? 'inherit' : 'inherit'
          }}
        >
          <DragIcon fontSize="small" />
        </IconButton>
      ) : (
        <Box sx={{ width: 12, mr: 1 }} />
      )}

      {/* Content */}
      <ListItemText
        primary={renderPrimary()}
        secondary={renderSecondary()}
      />
    </ListItem>
  );
};

export default JumpCard;
