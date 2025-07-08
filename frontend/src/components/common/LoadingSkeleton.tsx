import React from 'react';
import { Skeleton, Box } from '@mui/material';

interface LoadingSkeletonProps {
  lines?: number;
  height?: number;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  lines = 3, 
  height = 24, 
  variant = 'text',
  width = '100%'
}) => {
  if (lines === 1) {
    return <Skeleton variant={variant} height={height} width={width} />;
  }

  return (
    <Box>
      {[...Array(lines)].map((_, i) => (
        <Skeleton 
          key={i} 
          variant={variant} 
          height={height} 
          width={`${100 - i * 10}%`} 
          sx={{ mb: i === lines - 1 ? 0 : 1 }}
        />
      ))}
    </Box>
  );
};

export default LoadingSkeleton;
