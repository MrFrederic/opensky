import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AdminOnly } from '@/components/auth/RoleGuard';
import { usersService } from '@/services/users';
import UserTable from '@/components/admin/UserTable';
import { UserRole } from '@/types';
import { Plus, Search, Filter } from 'lucide-react';

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');

  // Fetch users query - now handles both search and filter
  const usersQuery = useQuery({
    queryKey: ['users', roleFilter, searchQuery],
    queryFn: () => usersService.getUsers({ 
      role: roleFilter || undefined,
      search: searchQuery && searchQuery.length >= 2 ? searchQuery : undefined,
      limit: 100 
    }),
  });

  // Handle query errors with toast
  useEffect(() => {
    if (usersQuery.error && usersQuery.error instanceof Error) {
      toast.error(`Failed to load users: ${usersQuery.error.message}`);
    }
  }, [usersQuery.error]);

  const handleUserClick = (userId: number) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleAddUser = () => {
    navigate('/admin/users/new');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is now handled automatically by the query key change
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const users = usersQuery.data;
  const isLoading = usersQuery.isLoading;
  const error = usersQuery.error;

  return (
    <AdminOnly fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    }>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="mt-2 text-gray-600">
                Manage system users, roles, and permissions
              </p>
            </div>
            <button
              onClick={handleAddUser}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </form>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Roles</option>
                <option value={UserRole.TANDEM_JUMPER}>Tandem Jumper</option>
                <option value={UserRole.AFF_STUDENT}>AFF Student</option>
                <option value={UserRole.SPORT_PAID}>Sport Paid</option>
                <option value={UserRole.SPORT_FREE}>Sport Free</option>
                <option value={UserRole.TANDEM_INSTRUCTOR}>Tandem Instructor</option>
                <option value={UserRole.AFF_INSTRUCTOR}>AFF Instructor</option>
                <option value={UserRole.ADMINISTRATOR}>Administrator</option>
              </select>
            </div>
          </div>

          {searchQuery && (
            <div className="mt-2 text-sm text-gray-500">
              {searchQuery.length < 2 ? 'Enter at least 2 characters to search' : 
               `Searching for "${searchQuery}"`}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </div>
        )}

        {/* Users Table */}
        <UserTable
          users={users || []}
          onUserClick={handleUserClick}
          loading={isLoading}
        />

        {/* Results Info */}
        {users && users.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing {users.length} user{users.length !== 1 ? 's' : ''}
            {roleFilter && ` with role: ${roleFilter}`}
          </div>
        )}
      </div>
    </AdminOnly>
  );
};

export default UserList;
