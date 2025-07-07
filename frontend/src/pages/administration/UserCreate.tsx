import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminOnly } from '@/components/auth/RoleGuard';
import { usersService, CreateUserData } from '@/services/users';
import { UserRole } from '@/types';
import { ArrowLeft, UserPlus, Mail, Phone, Hash, Shield, AlertCircle } from 'lucide-react';

const UserCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    telegram_id: '',
  });

  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([UserRole.TANDEM_JUMPER]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserData) => {
      // Note: This endpoint may not exist yet in the backend
      // Users are typically created automatically via Telegram authentication
      return usersService.createUser(userData);
    },
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate(`/admin/users/${newUser.id}`);
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      // Handle validation errors from backend
      if (error.response?.data?.detail) {
        setErrors({ general: error.response.data.detail });
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
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.telegram_id.trim()) {
      newErrors.telegram_id = 'Telegram ID is required';
    } else if (!/^\d+$/.test(formData.telegram_id)) {
      newErrors.telegram_id = 'Telegram ID must be numeric';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (selectedRoles.length === 0) {
      newErrors.roles = 'At least one role must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare data for saving - username should be sent without @ prefix
    const userData: CreateUserData = {
      ...formData,
      username: formData.username, // Username already processed to remove @ in handleInputChange
      roles: selectedRoles,
    };

    try {
      await createUserMutation.mutateAsync(userData);
    } catch (error) {
      // Error handling is done in onError callback
    }
  };

  const handleBack = () => {
    navigate('/admin/users');
  };

  const roleLabels: Record<UserRole, string> = {
    [UserRole.TANDEM_JUMPER]: 'Tandem Jumper',
    [UserRole.AFF_STUDENT]: 'AFF Student',
    [UserRole.SPORT_PAID]: 'Sport Jumper (Paid)',
    [UserRole.SPORT_FREE]: 'Sport Jumper (Free)',
    [UserRole.TANDEM_INSTRUCTOR]: 'Tandem Instructor',
    [UserRole.AFF_INSTRUCTOR]: 'AFF Instructor',
    [UserRole.ADMINISTRATOR]: 'Administrator',
  };

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
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Users
            </button>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
            <p className="mt-2 text-gray-600">
              Add a new user to the dropzone management system
            </p>
          </div>
        </div>

        {/* Notice about automatic user creation */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-blue-800 text-sm">
              <p className="font-medium mb-1">Manual User Creation</p>
              <p>
                Typically, users are created automatically when they authenticate via Telegram. 
                Use this form only for special cases where manual user creation is required.
              </p>
            </div>
          </div>
        </div>

        {/* User Creation Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">User Information</h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800">{errors.general}</div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.first_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.last_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="telegram_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Telegram ID *
                </label>
                <input
                  type="text"
                  id="telegram_id"
                  name="telegram_id"
                  value={formData.telegram_id}
                  onChange={handleInputChange}
                  placeholder="e.g., 123456789"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.telegram_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.telegram_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.telegram_id}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Numeric Telegram user ID (not the username)
                </p>
              </div>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username ? `@${formData.username}` : ''}
                  onChange={handleInputChange}
                  placeholder="@username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Telegram username (stored without @)
                </p>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="user@example.com"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Roles Selection */}
            <div className="border-t pt-6">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700">
                  <Shield className="w-4 h-4 inline mr-1" />
                  User Roles *
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select one or more roles for this user
                </p>
                {errors.roles && (
                  <p className="mt-1 text-sm text-red-600">{errors.roles}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(UserRole).map((role) => (
                  <label key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => handleRoleToggle(role)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {roleLabels[role]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t pt-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {createUserMutation.isPending ? 'Creating User...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminOnly>
  );
};

export default UserCreate;
