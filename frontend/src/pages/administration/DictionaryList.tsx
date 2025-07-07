import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminOnly } from '@/components/auth/RoleGuard';
import { dictionariesService } from '@/services/dictionaries';
import DictionaryTable from '@/components/admin/DictionaryTable';
import { useToast } from '@/hooks/useToast';
import { Search, Filter } from 'lucide-react';

const DictionaryList: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'custom'>('all');

  // Fetch dictionaries query
  const dictionariesQuery = useQuery({
    queryKey: ['dictionaries', statusFilter, typeFilter, searchQuery],
    queryFn: () => dictionariesService.getDictionaries({ 
      name: searchQuery && searchQuery.length >= 2 ? searchQuery : undefined,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
      is_system: typeFilter === 'all' ? undefined : typeFilter === 'system',
      limit: 100 
    }),
  });

  // Handle query errors with toast
  useEffect(() => {
    if (dictionariesQuery.error && dictionariesQuery.error instanceof Error) {
      toast.error('Failed to load dictionaries', dictionariesQuery.error);
    }
  }, [dictionariesQuery.error, toast]);

  // Add dictionary mutation
  const addDictionaryMutation = useMutation({
    mutationFn: async (name: string) => {
      await dictionariesService.createDictionary({ name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionaries'] });
      toast.success('Dictionary created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create dictionary', error);
    },
  });

  // Edit dictionary mutation
  const editDictionaryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      await dictionariesService.updateDictionary(id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionaries'] });
      toast.success('Dictionary updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update dictionary', error);
    },
  });

  // Delete/restore dictionary mutation
  const deleteRestoreDictionaryMutation = useMutation({
    mutationFn: async ({ id }: { id: number; isActive: boolean }) => {
      await dictionariesService.deleteDictionary(id);
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['dictionaries'] });
      toast.success(isActive ? 'Dictionary deactivated successfully' : 'Dictionary restored successfully');
    },
    onError: (error) => {
      toast.error('Failed to update dictionary status', error);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is now handled automatically by the query key change
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const dictionaries = dictionariesQuery.data;
  const isLoading = dictionariesQuery.isLoading;
  const error = dictionariesQuery.error;

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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dictionary Management</h1>
            <p className="mt-2 text-gray-600">
              Manage system dictionaries and their values
            </p>
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
                  placeholder="Search dictionaries by name..."
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

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'system' | 'custom')}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="system">System</option>
                <option value="custom">Custom</option>
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
              Error loading dictionaries: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </div>
        )}

        {/* Dictionaries Table */}
        <DictionaryTable
          dictionaries={dictionaries || []}
          loading={isLoading}
          onAdd={async (name) => addDictionaryMutation.mutateAsync(name)}
          onEdit={async (id, name) => editDictionaryMutation.mutateAsync({ id, name })}
          onDeleteRestore={async (id, isActive) => deleteRestoreDictionaryMutation.mutateAsync({ id, isActive })}
        />

        {/* Results Info */}
        {dictionaries && dictionaries.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing {dictionaries.length} dictionar{dictionaries.length !== 1 ? 'ies' : 'y'}
            {statusFilter !== 'all' && ` (${statusFilter})`}
            {typeFilter !== 'all' && ` (${typeFilter})`}
          </div>
        )}
      </div>
    </AdminOnly>
  );
};

export default DictionaryList;
