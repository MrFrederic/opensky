import React from 'react';
import { User } from '@/types';
import { formatUserRoles } from '@/lib/utils';
import { getUserRoles } from '@/lib/rbac';
import { ChevronRight } from 'lucide-react';
import UserAvatar from './UserAvatar';

interface UserTableProps {
  users: User[];
  onUserClick: (userId: number) => void;
  loading?: boolean;
}

const UserTable: React.FC<UserTableProps> = ({ users, onUserClick, loading = false }) => {
  const formatRoles = (user: User): string => {
    const roles = getUserRoles(user);
    const roleString = formatUserRoles(roles);
    
    // Truncate roles if they're too long
    if (roleString.length > 35) {
      return roleString.substring(0, 35) + '...';
    }
    return roleString;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 py-3">
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username / Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 w-16">
                {/* Empty header for actions column */}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserAvatar user={user} size="md" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.last_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {user.username ? `@${user.username}` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {user.phone || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email || 'N/A'}</div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatRoles(user) || 'No roles'}
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.created_at)}
                </td>
                <td className="whitespace-nowrap p-0">
                  <button
                    onClick={() => onUserClick(user.id)}
                    className="w-full h-full flex items-center justify-end hover:bg-gray-100 transition-colors px-6 py-3"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No users found</div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
