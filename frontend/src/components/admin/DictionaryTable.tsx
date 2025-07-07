import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dictionary } from '@/types';
import { Check, X, Pencil, Trash2, RotateCcw, Plus, Settings } from 'lucide-react';

interface DictionaryTableProps {
  dictionaries: Dictionary[];
  loading?: boolean;
  onAdd?: (name: string) => Promise<void>;
  onEdit?: (id: number, name: string) => Promise<void>;
  onDeleteRestore?: (id: number, isActive: boolean) => Promise<void>;
}

const DictionaryTable: React.FC<DictionaryTableProps> = ({
  dictionaries,
  loading = false,
  onAdd,
  onEdit,
  onDeleteRestore,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleEditSave = async (id: number) => {
    if (!editName.trim() || !onEdit) return;
    setSaving(true);
    await onEdit(id, editName.trim());
    setEditingId(null);
    setEditName('');
    setSaving(false);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleAddSave = async () => {
    if (!addName.trim() || !onAdd) return;
    setSaving(true);
    await onAdd(addName.trim());
    setAddName('');
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
      setAddName('');
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
      {/* Add Dictionary Section */}
      {onAdd && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          {adding ? (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  onKeyDown={handleAddKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter dictionary name..."
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleAddSave} 
                  disabled={saving || !addName.trim()} 
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Save (Enter)"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { setAdding(false); setAddName(''); }} 
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
              Add New Dictionary
            </button>
          )}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Values</th>
              <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Dictionary Rows */}
            {dictionaries.map((dictionary) => (
              <tr key={dictionary.id} className={!dictionary.is_active ? 'opacity-50 bg-gray-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === dictionary.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, dictionary.id)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          dictionary.is_active ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <svg className={`h-5 w-5 ${dictionary.is_active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${dictionary.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                          {dictionary.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {dictionary.id}
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    dictionary.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {dictionary.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    dictionary.is_system 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {dictionary.is_system ? 'System' : 'Custom'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(dictionary.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(dictionary.updated_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/admin/dictionaries/${dictionary.id}`}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Edit Values
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex gap-2 justify-end">
                    {editingId === dictionary.id ? (
                      <>
                        <button 
                          onClick={() => handleEditSave(dictionary.id)} 
                          disabled={saving || !editName.trim()} 
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
                          onClick={() => handleEdit(dictionary.id, dictionary.name)} 
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRestore(dictionary.id, dictionary.is_active)}
                          disabled={deletingId === dictionary.id}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            dictionary.is_active 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                          title={dictionary.is_active ? 'Delete' : 'Restore'}
                        >
                          {dictionary.is_active ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
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
    </div>
  );
};

export default DictionaryTable;
