import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  user: {
    first_name: string;
    last_name: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md', className = '' }) => {
  const getInitials = () => {
    const firstInitial = user.first_name?.charAt(0)?.toUpperCase() || '';
    const lastInitial = user.last_name?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg'
  };

  const initials = getInitials();

  return (
    <div className={`
      ${sizeClasses[size]} 
      rounded-full 
      bg-gray-200 
      flex 
      items-center 
      justify-center 
      font-medium 
      text-gray-700 
      ${className}
    `}>
      {initials || <User className="w-4 h-4" />}
    </div>
  );
};

export default UserAvatar;
