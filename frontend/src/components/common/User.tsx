import React from 'react';
import { Box, Avatar, Typography } from '@mui/material';

interface UserProps {
  user: {
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
    avatar_url?: string;
  };
  size?: 'small' | 'medium' | 'large';
  showSubtext?: boolean;
  variant?: 'horizontal' | 'vertical';
}

const User: React.FC<UserProps> = ({ 
  user, 
  size = 'medium', 
  showSubtext = true, 
  variant = 'horizontal' 
}) => {
  const getFullName = () => {
    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else if (user.username) {
      return `@${user.username}`;
    } else if (user.email) {
      return user.email;
    }
    return 'Unknown User';
  };

  const getInitials = () => {
    const firstName = user.first_name?.trim() || '';
    const lastName = user.last_name?.trim() || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (lastName) {
      return lastName[0].toUpperCase();
    } else if (user.username) {
      return user.username[0].toUpperCase();
    } else if (user.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };

  const getAvatarSize = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32 };
      case 'large':
        return { width: 56, height: 56 };
      default:
        return { width: 40, height: 40 };
    }
  };

  const getTypographyVariant = () => {
    switch (size) {
      case 'small':
        return 'body2';
      case 'large':
        return 'h6';
      default:
        return 'body1';
    }
  };

  const getSubtextVariant = () => {
    switch (size) {
      case 'small':
        return 'caption';
      case 'large':
        return 'body2';
      default:
        return 'caption';
    }
  };

  const fullName = getFullName();
  const username = user.username ? `@${user.username}` : null;

  if (variant === 'vertical') {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        gap={1}
      >
        <Avatar
          src={user.avatar_url}
          sx={getAvatarSize()}
        >
          {getInitials()}
        </Avatar>
        <Box textAlign="center">
          <Typography 
            variant={getTypographyVariant()} 
            component="div" 
            fontWeight="medium"
          >
            {fullName}
          </Typography>
          {showSubtext && username && (
            <Typography 
              variant={getSubtextVariant()} 
              color="text.secondary"
              component="div"
            >
              {username}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      <Avatar
        src={user.avatar_url}
        sx={getAvatarSize()}
      >
        {getInitials()}
      </Avatar>
      <Box>
        <Typography 
          variant={getTypographyVariant()} 
          component="div" 
          fontWeight="medium"
          sx={{ lineHeight: 1.2 }}
        >
          {fullName}
        </Typography>
        {showSubtext && username && (
          <Typography 
            variant={getSubtextVariant()} 
            color="text.secondary"
            component="div"
            sx={{ lineHeight: 1.2 }}
          >
            {username}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default User;
