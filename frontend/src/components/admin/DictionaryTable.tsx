import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Typography,
  IconButton,
  Skeleton,
  Box,
  Chip,
  TextField,
  Button
} from '@mui/material';
import { 
  Check, 
  Close as X, 
  Edit as Pencil, 
  Delete as Trash2, 
  Refresh as RotateCcw, 
  Add as Plus, 
  Settings 
} from '@mui/icons-material';
import { Dictionary } from '@/types';

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
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Skeleton width={100} /></TableCell>
                <TableCell><Skeleton width={80} /></TableCell>
                <TableCell><Skeleton width={80} /></TableCell>
                <TableCell><Skeleton width={100} /></TableCell>
                <TableCell><Skeleton width={100} /></TableCell>
                <TableCell><Skeleton width={100} /></TableCell>
                <TableCell width={120}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box>
                        <Skeleton width={120} />
                        <Skeleton width={60} />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Skeleton width={60} /></TableCell>
                  <TableCell><Skeleton width={60} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  return (
    <Paper elevation={2}>
      {/* Add Dictionary Section */}
      {onAdd && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          {adding ? (
            <Box display="flex" alignItems="center" gap={2}>
              <TextField
                fullWidth
                size="small"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                onKeyDown={handleAddKeyDown}
                placeholder="Enter dictionary name..."
                autoFocus
              />
              <IconButton 
                onClick={handleAddSave} 
                disabled={saving || !addName.trim()} 
                color="success"
                title="Save (Enter)"
              >
                <Check />
              </IconButton>
              <IconButton 
                onClick={() => { setAdding(false); setAddName(''); }} 
                color="default"
                title="Cancel (Escape)"
              >
                <X />
              </IconButton>
            </Box>
          ) : (
            <Button 
              onClick={() => setAdding(true)} 
              variant="contained"
              startIcon={<Plus />}
            >
              Add New Dictionary
            </Button>
          )}
        </Box>
      )}
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="medium">
                  Name
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="medium">
                  Status
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="medium">
                  Type
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="medium">
                  Created
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="medium">
                  Updated
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="medium">
                  Values
                </Typography>
              </TableCell>
              <TableCell width={120}>
                <Typography variant="subtitle2" fontWeight="medium">
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dictionaries.map((dictionary) => (
              <TableRow 
                key={dictionary.id}
                sx={{ 
                  opacity: dictionary.is_active ? 1 : 0.5,
                  bgcolor: dictionary.is_active ? 'inherit' : 'grey.50'
                }}
              >
                <TableCell>
                  {editingId === dictionary.id ? (
                    <TextField
                      size="small"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, dictionary.id)}
                      autoFocus
                    />
                  ) : (
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ 
                        width: 40, 
                        height: 40,
                        bgcolor: dictionary.is_active ? 'primary.light' : 'grey.300'
                      }}>
                        <Settings color={dictionary.is_active ? 'primary' : 'disabled'} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium" 
                          color={dictionary.is_active ? 'text.primary' : 'text.secondary'}>
                          {dictionary.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {dictionary.id}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={dictionary.is_active ? 'Active' : 'Inactive'}
                    color={dictionary.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={dictionary.is_system ? 'System' : 'Custom'}
                    color={dictionary.is_system ? 'default' : 'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(dictionary.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(dictionary.updated_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button
                    component={Link}
                    to={`/admin/dictionaries/${dictionary.id}`}
                    size="small"
                    variant="outlined"
                    startIcon={<Settings />}
                  >
                    Edit Values
                  </Button>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {editingId === dictionary.id ? (
                      <>
                        <IconButton 
                          onClick={() => handleEditSave(dictionary.id)} 
                          disabled={saving || !editName.trim()} 
                          color="success"
                          size="small"
                          title="Save (Enter)"
                        >
                          <Check />
                        </IconButton>
                        <IconButton 
                          onClick={handleEditCancel} 
                          color="default"
                          size="small"
                          title="Cancel (Escape)"
                        >
                          <X />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton 
                          onClick={() => handleEdit(dictionary.id, dictionary.name)} 
                          color="primary"
                          size="small"
                          title="Edit"
                        >
                          <Pencil />
                        </IconButton>
                        {!dictionary.is_system && (
                          <IconButton
                            onClick={() => handleDeleteRestore(dictionary.id, dictionary.is_active)}
                            disabled={deletingId === dictionary.id}
                            color={dictionary.is_active ? 'error' : 'success'}
                            size="small"
                            title={dictionary.is_active ? 'Delete' : 'Restore'}
                          >
                            {dictionary.is_active ? <Trash2 /> : <RotateCcw />}
                          </IconButton>
                        )}
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {dictionaries.length === 0 && (
        <Box textAlign="center" py={6}>
          <Typography variant="body1" color="text.secondary">
            No dictionaries found
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DictionaryTable;
