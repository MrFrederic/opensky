import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminOnly } from '@/components/auth/RoleGuard';
import { usersService } from '@/services/users';
import { User, UserRole } from '@/types';
import { ArrowLeft, Save, Mail, Phone, Hash, Calendar, Shield, Trash2, AlertTriangle } from 'lucide-react';
import { formatUserRoles } from '@/lib/utils';
import { getUserRoles } from '@/lib/rbac';
import { useAuthStore } from '@/stores/auth';

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, logout } = useAuthStore();

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    license_document_url: '',
  });

  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch user data
  const userQuery = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersService.getUser(Number(id)),
    enabled: !!id,
  });

  const user = userQuery.data;

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        license_document_url: user.license_document_url || '',
      });
      setSelectedRoles(getUserRoles(user));
    }
  }, [user]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data: { userData: Partial<User>; roles: UserRole[] }) => {
      return usersService.updateUser(Number(id), data.userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      setIsEditing(false);
    },
  });

  // Update user roles mutation
  const updateRolesMutation = useMutation({
    mutationFn: (roles: UserRole[]) => usersService.updateUserRoles(Number(id), roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: () => usersService.deleteUser(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // If the deleted user is the current user, log them out
      if (currentUser && currentUser.id === Number(id)) {
        logout();
        navigate('/login');
      } else {
        navigate('/admin/users');
      }
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Apply masks based on field type
    if (name === 'username') {
      // Username mask: @xxx (display with @, store without)
      if (value.startsWith('@')) {
        processedValue = value.slice(1); // Remove @ for storage
      } else {
        processedValue = value; // Keep as is if user types without @
      }
    } else if (name === 'email') {
      // Email mask: xxx@xxx.xxx (store with mask)
      processedValue = value;
    } else if (name === 'phone') {
      // Phone mask: +0000000 (store with mask)
      if (!value.startsWith('+') && value.length > 0) {
        processedValue = '+' + value.replace(/\D/g, ''); // Add + and keep only digits
      } else {
        processedValue = value.replace(/[^\d+]/g, ''); // Keep only digits and +
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleSave = async () => {
    try {
      // Prepare data for saving - username should be sent without @ prefix
      const dataToSave = {
        ...formData,
        username: formData.username // Username already processed to remove @ in handleInputChange
      };
      
      await updateUserMutation.mutateAsync({ userData: dataToSave, roles: selectedRoles });
      
      // Update roles if they changed
      if (user && JSON.stringify(getUserRoles(user)) !== JSON.stringify(selectedRoles)) {
        await updateRolesMutation.mutateAsync(selectedRoles);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleBack = () => {
    navigate('/admin/users');
  };

  const handleDelete = async () => {
    try {
      await deleteUserMutation.mutateAsync();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const canDeleteUser = currentUser && user && currentUser.id !== user.id;

  const loading = userQuery.isLoading;
  const error = userQuery.error;

  return (
    <AdminOnly fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    }>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Users
            </button>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
              <p className="mt-2 text-gray-600">
                View and edit user information
              </p>
            </div>
            
            <div className="flex gap-2">
              {canDeleteUser && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateUserMutation.isPending || updateRolesMutation.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Edit User
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">
              Error loading user: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </div>
        )}

        {/* User not found */}
        {!loading && !error && !user && (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <div className="text-gray-500">User not found</div>
          </div>
        )}

        {/* User Form */}
        {user && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username ? `@${formData.username}` : ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="@username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Document URL
                  </label>
                  <input
                    type="url"
                    name="license_document_url"
                    value={formData.license_document_url}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {/* System Information - Only for existing users */}
              {user && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">System Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">User ID:</span>
                      <span className="ml-2 font-mono">{user.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Telegram ID:</span>
                      <span className="ml-2 font-mono">{user.telegram_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Created:
                      </span>
                      <span className="ml-2">{new Date(user.created_at).toLocaleString()}</span>
                    </div>
                    {user.updated_at && (
                      <div>
                        <span className="text-gray-500">Updated:</span>
                        <span className="ml-2">{new Date(user.updated_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Roles Management */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    <Shield className="w-4 h-4 inline mr-1" />
                    User Roles
                  </h3>
                  {!isEditing && (
                    <div className="text-sm text-gray-500">
                      Current: {formatUserRoles(getUserRoles(user || {} as User))}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.values(UserRole).map((role) => (
                    <label key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        disabled={!isEditing}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {role.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {(updateUserMutation.error || updateRolesMutation.error || deleteUserMutation.error) && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              Error: {updateUserMutation.error?.message || updateRolesMutation.error?.message || deleteUserMutation.error?.message}
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
                {user && (
                  <span className="block mt-2 font-medium">
                    User: {user.first_name} {user.last_name} ({user.username || user.email || user.telegram_id})
                  </span>
                )}
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteUserMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  );
};

export default UserProfile;
