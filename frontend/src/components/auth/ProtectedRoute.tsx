import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { UserStatus } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredStatus?: UserStatus;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredStatus,
  requireAdmin = false 
}) => {
  const { isAuthenticated, user } = useAuthStore();

  // Check authentication
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to access this page.
          </p>
          <Link to="/login" className="btn-primary">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && !user.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Check status requirement
  if (requiredStatus) {
    const statusHierarchy: Record<UserStatus, number> = {
      newby: 0,
      individual_sportsman: 1,
      sportsman: 2,
      instructor: 3,
    };

    const userLevel = statusHierarchy[user.status];
    const requiredLevel = statusHierarchy[requiredStatus];

    if (userLevel < requiredLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Insufficient Privileges
            </h2>
            <p className="text-gray-600">
              You need {requiredStatus} status or higher to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
