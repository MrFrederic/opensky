import React from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  FlightTakeoff as FlightIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { differenceInMinutes } from 'date-fns';

import { Load, LoadStatus, Aircraft } from '@/types';

interface LoadTableProps {
  loads: Load[];
  aircraft: Aircraft[];
  statusFilter: LoadStatus | '';
  aircraftFilter: number | '';
  onStatusFilterChange: (status: LoadStatus | '') => void;
  onAircraftFilterChange: (aircraftId: number | '') => void;
  onLoadClick?: (load: Load) => void;
  onAddLoad?: () => void;
  selectedLoadId?: number;
  loading?: boolean;
  aircraftLoading?: boolean;
}

const LoadTable: React.FC<LoadTableProps> = ({
  loads,
  aircraft,
  statusFilter,
  aircraftFilter,
  onStatusFilterChange,
  onAircraftFilterChange,
  onLoadClick,
  onAddLoad,
  selectedLoadId,
  loading = false,
  aircraftLoading = false,
}) => {
  const getStatusColor = (status: LoadStatus) => {
    switch (status) {
      case LoadStatus.FORMING:
        return 'text.primary'; // black
      case LoadStatus.ON_CALL:
        return 'success.dark'; // dark green
      case LoadStatus.DEPARTED:
        return 'text.secondary'; // grey
      default:
        return 'text.primary';
    }
  };

  const getStatusLabel = (status: LoadStatus) => {
    switch (status) {
      case LoadStatus.FORMING:
        return 'Forming';
      case LoadStatus.ON_CALL:
        return 'On Call';
      case LoadStatus.DEPARTED:
        return 'Departed';
      default:
        return status;
    }
  };

  const calculateAvailableSpaces = (load: Load) => {
    const totalSpaces = load.aircraft?.max_load || 0;
    return totalSpaces - load.reserved_spaces;
  };

  const getMinutesUntilDeparture = (departure: string) => {
    return differenceInMinutes(new Date(departure), new Date());
  };

  const getSequenceNumber = (_load: Load, index: number) => {
    // For now, just use index + 1. In the future, this could be based on actual daily sequence
    return index + 1;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Loads
        </Typography>
        {/* Filters Row */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => onStatusFilterChange(e.target.value as LoadStatus | '')}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value={LoadStatus.FORMING}>Forming</MenuItem>
              <MenuItem value={LoadStatus.ON_CALL}>On Call</MenuItem>
              <MenuItem value={LoadStatus.DEPARTED}>Departed</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Aircraft</InputLabel>
            <Select
              value={aircraftFilter}
              label="Aircraft"
              onChange={(e) => onAircraftFilterChange(e.target.value as number | '')}
              disabled={aircraftLoading}
            >
              <MenuItem value="">All Aircraft</MenuItem>
              {aircraft.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Load List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Skeleton height={40} width="100%" />
              </Box>
            ))}
          </Box>
        ) : loads.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <FlightIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No loads found
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table 
              size="small" 
              stickyHeader
              sx={{
                '& .MuiTableCell-root': {
                  border: '1px solid',
                  borderColor: 'divider',
                  fontSize: '0.75rem',
                  px: 1,
                }
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 80, textAlign: 'center' }}>Aircraft</TableCell>
                  <TableCell sx={{ width: 40, textAlign: 'center' }}>T</TableCell>
                  <TableCell sx={{ width: 40, textAlign: 'center' }}>F</TableCell>
                  <TableCell sx={{ width: 40, textAlign: 'center' }}>R</TableCell>
                  <TableCell sx={{ width: 60, textAlign: 'center' }}>Dept</TableCell>
                  <TableCell sx={{ width: 80 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loads.map((load, index) => {
                  const isSelected = selectedLoadId === load.id;
                  const totalSpaces = load.aircraft?.max_load || 0;
                  const freeSpaces = calculateAvailableSpaces(load);
                  const minutesUntilDept = getMinutesUntilDeparture(load.departure);
                  const sequenceNum = getSequenceNumber(load, index);
                  
                  return (
                    <TableRow
                      key={load.id}
                      selected={isSelected}
                      onClick={() => onLoadClick?.(load)}
                      sx={{
                        cursor: 'pointer',
                        color: getStatusColor(load.status),
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'action.selected',
                          '&:hover': {
                            backgroundColor: 'action.selected',
                          },
                        },
                      }}
                    >
                      <TableCell sx={{ color: 'inherit' }}>
                        {(load.aircraft?.name || 'Unknown') + ' ' + sequenceNum}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', color: 'inherit' }}>
                        {totalSpaces}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', color: 'inherit' }}>
                        {freeSpaces}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', color: 'inherit' }}>
                        {load.reserved_spaces}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', color: 'inherit' }}>
                        {minutesUntilDept}
                      </TableCell>
                      <TableCell sx={{ color: 'inherit' }}>
                        {getStatusLabel(load.status)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={6} align="right" sx={{ p: 0, border: 0, backgroundColor: 'background.paper' }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={onAddLoad}
                      sx={{
                        m: 1,
                        fontSize: '0.75rem',
                        minHeight: 0,
                        minWidth: 0,
                        px: 2,
                        py: 0.5,
                      }}
                    >
                      Add Load
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default LoadTable;
