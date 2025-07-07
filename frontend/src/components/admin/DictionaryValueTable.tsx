import React, { useState } from 'react';
import { DictionaryValue } from '@/types';
import { Check, X, Pencil, Trash2, RotateCcw, Plus } from 'lucide-react';

interface DictionaryValueTableProps {
  values: DictionaryValue[];
  loading?: boolean;
  onAdd?: (value: string) => Promise<void>;
  onEdit?: (id: number, value: string) => Promise<void>;
  onDeleteRestore?: (id: number, isActive: boolean) => Promise<void>;
}

const DictionaryValueTable: React.FC<DictionaryValueTableProps> = ({
  values,
  loading = false,
  onAdd,
  onEdit,
  onDeleteRestore,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [addValue, setAddValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleEdit = (id: number, value: string) => {
    setEditingId(id);
    setEditValue(value);
  };

  const handleEditSave = async (id: number) => {
    if (!editValue.trim() || !onEdit) return;
    setSaving(true);
    await onEdit(id, editValue.trim());
    setEditingId(null);
    setEditValue('');
    setSaving(false);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleAddSave = async () => {
    if (!addValue.trim() || !onAdd) return;
    setSaving(true);
    await onAdd(addValue.trim());
    setAddValue('');
    setAdding(false);
    setSaving(false);
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSave();
    }
    if (e.key === 'Escape') {
      setAdding(false);
      setAddValue('');
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSave(id);
    }
    if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleDeleteRestore = async (id: number, isActive: boolean) => {
    if (!onDeleteRestore) return;
    setDeletingId(id);
    await onDeleteRestore(id, isActive);
    setDeletingId(null);
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
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
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
      {/* Add Value Section */}
      {onAdd && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          {adding ? (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={addValue}
                  onChange={e => setAddValue(e.target.value)}
                  onKeyDown={handleAddKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter value..."
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleAddSave} 
                  disabled={saving || !addValue.trim()} 
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Save (Enter)"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { setAdding(false); setAddValue(''); }} 
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-gray-400 text-white hover:bg-gray-500 transition-colors"
                  title="Cancel (Escape)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setAdding(true)} 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" /> 
              Add New Value
            </button>
          )}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Value Rows */}
            {values.map((value) => (
              <tr key={value.id} className={!value.is_active ? 'opacity-50 bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === value.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, value.id)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          value.is_active ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <svg className={`h-5 w-5 ${value.is_active ? 'text-green-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${value.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {value.value}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {value.id}
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    value.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {value.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    value.is_system 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {value.is_system ? 'System' : 'Custom'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(value.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(value.updated_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex gap-2 justify-end">
                    {editingId === value.id ? (
                      <>
                        <button 
                          onClick={() => handleEditSave(value.id)} 
                          disabled={saving || !editValue.trim()} 
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Save (Enter)"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={handleEditCancel} 
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-400 text-white hover:bg-gray-500 transition-colors"
                          title="Cancel (Escape)"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleEdit(value.id, value.value)} 
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRestore(value.id, value.is_active)}
                          disabled={deletingId === value.id}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            value.is_active 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                          title={value.is_active ? 'Delete' : 'Restore'}
                        >
                          {value.is_active ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {values.length === 0 && !loading && (
        <div className="px-6 py-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No values</h3>
          <p className="mt-1 text-sm text-gray-500">
            This dictionary doesn't have any values yet.
          </p>
          {onAdd && (
            <div className="mt-6">
              <button
                onClick={() => setAdding(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add first value
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DictionaryValueTable;
