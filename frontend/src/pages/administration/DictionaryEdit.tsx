import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminOnly } from '@/components/auth/RoleGuard';
import { dictionariesService } from '@/services/dictionaries';
import DictionaryValueTable from '@/components/admin/DictionaryValueTable';
import { useToast } from '@/hooks/useToast';
import { Search, Filter, ArrowLeft, Database } from 'lucide-react';

const DictionaryEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'custom'>('all');

  const dictionaryId = parseInt(id || '0', 10);

  // Fetch dictionary with values
  const dictionaryQuery = useQuery({
    queryKey: ['dictionary', dictionaryId],
    queryFn: () => dictionariesService.getDictionary(dictionaryId),
    enabled: !!dictionaryId,
  });

  // Handle query errors with toast
  useEffect(() => {
    if (dictionaryQuery.error && dictionaryQuery.error instanceof Error) {
      toast.error('Failed to load dictionary', dictionaryQuery.error);
    }
  }, [dictionaryQuery.error, toast]);

  // Add value mutation
  const addValueMutation = useMutation({
    mutationFn: async (value: string) => {
      await dictionariesService.createDictionaryValue(dictionaryId, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary', dictionaryId] });
      toast.success('Value created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create value', error);
    },
  });

  // Edit value mutation
  const editValueMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: string }) => {
      await dictionariesService.updateDictionaryValue(id, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary', dictionaryId] });
      toast.success('Value updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update value', error);
    },
  });

  // Delete/restore value mutation
  const deleteRestoreValueMutation = useMutation({
    mutationFn: async ({ id }: { id: number; isActive: boolean }) => {
      await dictionariesService.deleteDictionaryValue(id);
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['dictionary', dictionaryId] });
      toast.success(isActive ? 'Value deactivated successfully' : 'Value restored successfully');
    },
    onError: (error) => {
      toast.error('Failed to update value status', error);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by filtering
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Filter values based on current filters
  const filteredValues = React.useMemo(() => {
    if (!dictionaryQuery.data?.values) return [];
    
    let filtered = dictionaryQuery.data.values;

    // Filter by search query
    if (searchQuery && searchQuery.length >= 2) {
      filtered = filtered.filter(value => 
        value.value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(value => 
        statusFilter === 'active' ? value.is_active : !value.is_active
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(value => 
        typeFilter === 'system' ? value.is_system : !value.is_system
      );
    }

    return filtered;
  }, [dictionaryQuery.data?.values, searchQuery, statusFilter, typeFilter]);

  const dictionary = dictionaryQuery.data;
  const isLoading = dictionaryQuery.isLoading;
  const error = dictionaryQuery.error;

  // Handle invalid dictionary ID
  if (!dictionaryId || isNaN(dictionaryId)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Dictionary</h1>
          <p className="text-gray-600 mb-4">The dictionary ID provided is not valid.</p>
          <Link 
            to="/admin/dictionaries" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dictionaries
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-4 mb-4">
            <Link 
              to="/admin/dictionaries" 
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dictionaries
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                dictionary?.is_active ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Database className={`h-6 w-6 ${dictionary?.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isLoading ? 'Loading...' : dictionary?.name || 'Unknown Dictionary'}
              </h1>
              <div className="mt-2 flex items-center gap-4">
                <p className="text-gray-600">
                  Manage values for this dictionary
                </p>
                {dictionary && (
                  <div className="flex gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      dictionary.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {dictionary.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      dictionary.is_system 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {dictionary.is_system ? 'System' : 'Custom'}
                    </span>
                  </div>
                )}
              </div>
            </div>
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
                  placeholder="Search values..."
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
              Error loading dictionary: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </div>
        )}

        {/* Values Table */}
        <DictionaryValueTable
          values={filteredValues}
          loading={isLoading}
          onAdd={async (value) => addValueMutation.mutateAsync(value)}
          onEdit={async (id, value) => editValueMutation.mutateAsync({ id, value })}
          onDeleteRestore={async (id, isActive) => deleteRestoreValueMutation.mutateAsync({ id, isActive })}
        />

        {/* Results Info */}
        {dictionary?.values && dictionary.values.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing {filteredValues.length} of {dictionary.values.length} value{dictionary.values.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' && ` (${statusFilter})`}
            {typeFilter !== 'all' && ` (${typeFilter})`}
          </div>
        )}
      </div>
    </AdminOnly>
  );
};

export default DictionaryEdit;
