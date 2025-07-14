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
  Box,
  Skeleton,
} from '@mui/material';
import { JumpType, UserRole } from '@/types';

interface JumpTypeTableProps {
  jumpTypes: JumpType[];
  onJumpTypeClick: (jumpTypeId: number) => void;
  loading?: boolean;
  showActions?: boolean;
}

const roleLabels: Record<UserRole, string> = {
  [UserRole.TANDEM_JUMPER]: 'Tandem',
  [UserRole.AFF_STUDENT]: 'AFF Student',
  [UserRole.SPORT_PAID]: 'Sport Paid',
  [UserRole.SPORT_FREE]: 'Sport Free',
  [UserRole.TANDEM_INSTRUCTOR]: 'Instructor',
  [UserRole.AFF_INSTRUCTOR]: 'AFF Instructor',
  [UserRole.ADMINISTRATOR]: 'Admin',
};

const JumpTypeTable: React.FC<JumpTypeTableProps> = ({
  jumpTypes,
  onJumpTypeClick,
  loading = false,
}) => {
  // Helper function to get required staff display text
  const getRequiredStaffText = (jumpType: JumpType) => {
    if (jumpType.additional_staff.length === 0) {
      return '—';
    }
    
    const staffTexts = jumpType.additional_staff.map((staff) => {
      if (staff.staff_default_jump_type) {
        // Use the related jump type object from the backend
        return staff.staff_default_jump_type.short_name;
      }
      return roleLabels[staff.staff_required_role];
    });
    
    return staffTexts.join(', ');
  };
  if (loading) {
    return (
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Short Name</TableCell>
                <TableCell>Exit Altitude</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Allowed Roles</TableCell>
                <TableCell>Required Staff</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton width={120} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={200} /></TableCell>
                  <TableCell><Skeleton width={150} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (jumpTypes.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No jump types found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No jump types match your current search or filter criteria.
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
              <TableCell>Short Name</TableCell>
              <TableCell>Exit Altitude</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Allowed Roles</TableCell>
              <TableCell>Required Staff</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jumpTypes.map((jumpType) => (
              <TableRow
                key={jumpType.id}
                hover
                onClick={() => onJumpTypeClick(jumpType.id)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {jumpType.name}
                    </Typography>
                    {jumpType.description && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {jumpType.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {jumpType.short_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  {jumpType.exit_altitude ? (
                    <Typography variant="body2">
                      {jumpType.exit_altitude.toLocaleString()} ft
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {jumpType.price ? (
                    <Typography variant="body2">
                      ${jumpType.price.toLocaleString()}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {jumpType.allowed_roles.map((roleAssignment) => (
                      <Chip
                        key={roleAssignment.id}
                        label={roleLabels[roleAssignment.role]}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                    {jumpType.allowed_roles.length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        No roles
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getRequiredStaffText(jumpType)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={jumpType.is_available ? 'Available' : 'Unavailable'}
                    size="small"
                    color={jumpType.is_available ? 'success' : 'default'}
                    variant={jumpType.is_available ? 'filled' : 'outlined'}
                  />
                </TableCell>
                {/* Removed Actions cell */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default JumpTypeTable;
