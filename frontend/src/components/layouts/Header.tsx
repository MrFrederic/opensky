import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/auth';
import { formatUserName } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { RoleGuard, ExcludeNewUsers, AdminOnly } from '@/components/auth/RoleGuard';

const Header: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Successfully logged out');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                <RoleGuard permission="VIEW_DASHBOARD">
                  <Link to="/dashboard" className="text-gray-500 hover:text-gray-900">
                    Dashboard
                  </Link>
                </RoleGuard>
                <RoleGuard permission="VIEW_TANDEMS">
                  <Link to="/tandems" className="text-gray-500 hover:text-gray-900">
                    Tandems
                  </Link>
                </RoleGuard>
                <ExcludeNewUsers>
                  <RoleGuard permission="VIEW_MANIFEST">
                    <Link to="/manifest" className="text-gray-500 hover:text-gray-900">
                      Manifest
                    </Link>
                  </RoleGuard>
                  <RoleGuard permission="VIEW_LOGBOOK">
                    <Link to="/logbook" className="text-gray-500 hover:text-gray-900">
                      Logbook
                    </Link>
                  </RoleGuard>
                  <RoleGuard permission="VIEW_LOADS">
                    <Link to="/loads" className="text-gray-500 hover:text-gray-900">
                      Loads
                    </Link>
                  </RoleGuard>
                </ExcludeNewUsers>
                
                {/* Administration Dropdown */}
                <AdminOnly>
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowAdminDropdown(true)}
                    onMouseLeave={() => setShowAdminDropdown(false)}
                  >
                    <button className="text-gray-500 hover:text-gray-900 flex items-center">
                      Administration
                      <svg 
                        className="w-4 h-4 ml-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 9l-7 7-7-7" 
                        />
                      </svg>
                    </button>
                    
                    {showAdminDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                        <Link
                          to="/admin/users"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Users
                        </Link>
                        <Link
                          to="/admin/dictionaries"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Dictionaries
                        </Link>
                      </div>
                    )}
                  </div>
                </AdminOnly>
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
