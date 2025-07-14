import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  Skeleton,
} from '@mui/material';
import { Aircraft, AircraftType } from '@/types';
import { formatDateConsistent } from '@/lib/utils';

interface AircraftTableProps {
  aircraft: Aircraft[];
  onAircraftClick: (aircraftId: number) => void;
  loading?: boolean;
}

const aircraftTypeLabels: Record<AircraftType, string> = {
  [AircraftType.PLANE]: 'Plane',
  [AircraftType.HELI]: 'Helicopter',
};

const aircraftTypeColors: Record<AircraftType, 'primary' | 'secondary'> = {
  [AircraftType.PLANE]: 'primary',
  [AircraftType.HELI]: 'secondary',
};

const AircraftTable: React.FC<AircraftTableProps> = ({
  aircraft,
  onAircraftClick,
  loading = false,
}) => {
  if (loading) {
    return (
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Max Load</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton width={120} /></TableCell>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={120} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (aircraft.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No aircraft found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No aircraft match your current search or filter criteria.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Max Load</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {aircraft.map((aircraftItem) => (
              <TableRow
                key={aircraftItem.id}
                hover
                onClick={() => onAircraftClick(aircraftItem.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {aircraftItem.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={aircraftTypeLabels[aircraftItem.type]}
                    size="small"
                    color={aircraftTypeColors[aircraftItem.type]}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {aircraftItem.max_load} passengers
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateConsistent(aircraftItem.created_at)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default AircraftTable;
