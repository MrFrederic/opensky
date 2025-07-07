import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className = '', lines = 3 }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded mb-3 last:mb-0" style={{ width: `${100 - i * 10}%` }}></div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
