import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/auth';
import { formatUserName } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';

const Header: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { user, isLoading } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the API call fails, clear local state and redirect
      useAuthStore.getState().logout();
      navigate('/login');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Dropzone Management
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-500 hover:text-gray-900">
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="text-gray-500 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link to="/tandems" className="text-gray-500 hover:text-gray-900">
                  Tandems
                </Link>
                {user?.status !== 'newby' && (
                  <>
                    <Link to="/manifest" className="text-gray-500 hover:text-gray-900">
                      Manifest
                    </Link>
                    <Link to="/logbook" className="text-gray-500 hover:text-gray-900">
                      Logbook
                    </Link>
                    <Link to="/loads" className="text-gray-500 hover:text-gray-900">
                      Loads
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {isLoading ? (
                  <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : user ? (
                  <div className="flex items-center space-x-2">
                    {user.username && (
                      <span className="text-sm font-medium text-blue-600">@{user.username}</span>
                    )}
                    <span className="text-sm text-gray-700">
                      {formatUserName(user)}
                    </span>
                  </div>
                ) : null}
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-primary"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
