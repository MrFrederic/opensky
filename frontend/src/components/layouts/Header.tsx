import React from 'react';
import { useAuthStore } from '@/stores/auth';
import { formatUserName } from '@/lib/utils';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Dropzone Management
            </h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-500 hover:text-gray-900">
              Home
            </a>
            {isAuthenticated && (
              <>
                <a href="/dashboard" className="text-gray-500 hover:text-gray-900">
                  Dashboard
                </a>
                <a href="/tandems" className="text-gray-500 hover:text-gray-900">
                  Tandems
                </a>
                {user?.status !== 'newby' && (
                  <>
                    <a href="/manifest" className="text-gray-500 hover:text-gray-900">
                      Manifest
                    </a>
                    <a href="/logbook" className="text-gray-500 hover:text-gray-900">
                      Logbook
                    </a>
                    <a href="/loads" className="text-gray-500 hover:text-gray-900">
                      Loads
                    </a>
                  </>
                )}
              </>
            )}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {formatUserName(user)}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="btn-primary"
              >
                Login
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
