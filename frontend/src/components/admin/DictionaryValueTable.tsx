import React, { useState } from 'react';
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
  LocalOffer
} from '@mui/icons-material';
import { DictionaryValue } from '@/types';

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
      {/* Add Value Section */}
      {onAdd && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          {adding ? (
            <Box display="flex" alignItems="center" gap={2}>
              <TextField
                fullWidth
                size="small"
                value={addValue}
                onChange={e => setAddValue(e.target.value)}
                onKeyDown={handleAddKeyDown}
                placeholder="Enter value..."
                autoFocus
              />
              <IconButton 
                onClick={handleAddSave} 
                disabled={saving || !addValue.trim()} 
                color="success"
                title="Save (Enter)"
              >
                <Check />
              </IconButton>
              <IconButton 
                onClick={() => { setAdding(false); setAddValue(''); }} 
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
              Add New Value
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
                  Value
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
              <TableCell width={120}>
                <Typography variant="subtitle2" fontWeight="medium">
                  Actions
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {values.map((value) => (
              <TableRow 
                key={value.id}
                sx={{ 
                  opacity: value.is_active ? 1 : 0.5,
                  bgcolor: value.is_active ? 'inherit' : 'grey.50'
                }}
              >
                <TableCell>
                  {editingId === value.id ? (
                    <TextField
                      size="small"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, value.id)}
                      autoFocus
                    />
                  ) : (
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ 
                        width: 40, 
                        height: 40,
                        bgcolor: value.is_active ? 'success.light' : 'grey.300'
                      }}>
                        <LocalOffer color={value.is_active ? 'success' : 'disabled'} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium" 
                          color={value.is_active ? 'text.primary' : 'text.secondary'}>
                          {value.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {value.id}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={value.is_active ? 'Active' : 'Inactive'}
                    color={value.is_active ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={value.is_system ? 'System' : 'Custom'}
                    color={value.is_system ? 'default' : 'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(value.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(value.updated_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {editingId === value.id ? (
                      <>
                        <IconButton 
                          onClick={() => handleEditSave(value.id)} 
                          disabled={saving || !editValue.trim()} 
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
                          onClick={() => handleEdit(value.id, value.value)} 
                          color="primary"
                          size="small"
                          title="Edit"
                        >
                          <Pencil />
                        </IconButton>
                        {!value.is_system && (
                          <IconButton
                            onClick={() => handleDeleteRestore(value.id, value.is_active)}
                            disabled={deletingId === value.id}
                            color={value.is_active ? 'error' : 'success'}
                            size="small"
                            title={value.is_active ? 'Delete' : 'Restore'}
                          >
                            {value.is_active ? <Trash2 /> : <RotateCcw />}
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

      {/* Empty State */}
      {values.length === 0 && !loading && (
        <Box textAlign="center" py={8}>
          <LocalOffer sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.primary" gutterBottom>
            No values
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This dictionary doesn't have any values yet.
          </Typography>
          {onAdd && (
            <Button
              onClick={() => setAdding(true)}
              variant="contained"
              startIcon={<Plus />}
            >
              Add first value
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default DictionaryValueTable;
