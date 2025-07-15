import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Skeleton,
  Box
} from '@mui/material';
import { ChevronRight } from '@mui/icons-material';
import { User as UserType } from '@/types';
import { formatMultiRoles, formatDateConsistent } from '@/lib/utils';
import { getUserRoles } from '@/lib/rbac';
import User from '@/components/common/User';

interface UserTableProps {
  users: UserType[];
  onUserClick: (userId: number) => void;
  loading?: boolean;
}

const UserTable: React.FC<UserTableProps> = ({ users, onUserClick, loading = false }) => {
  const formatRoles = (user: UserType): string => {
    const roles = getUserRoles(user);
    const roleString = formatMultiRoles(roles);
    
    // Truncate roles if they're too long
    if (roleString.length > 35) {
      return roleString.substring(0, 35) + '...';
    }
    return roleString;
  };

  // Use the consistent date formatter from utils instead of local function

  if (loading) {
    return (
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Skeleton width={100} /></TableCell>
                <TableCell><Skeleton width={150} /></TableCell>
                <TableCell><Skeleton width={200} /></TableCell>
                <TableCell><Skeleton width={150} /></TableCell>
                <TableCell><Skeleton width={80} /></TableCell>
                <TableCell><Skeleton width={100} /></TableCell>
                <TableCell width={48}></TableCell>
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
                        <Skeleton width={80} />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Skeleton width={120} /></TableCell>
                  <TableCell><Skeleton width={180} /></TableCell>
                  <TableCell><Skeleton width={180} /></TableCell>
                  <TableCell><Skeleton width={40} /></TableCell>
                  <TableCell><Skeleton width={70} /></TableCell>
                  <TableCell><Skeleton variant="circular" width={24} height={24} /></TableCell>
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
                  Username / Phone
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="medium">
                  Email
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="medium">
                  Roles
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="medium">
                  Jumps
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="medium">
                  Joined
                </Typography>
              </TableCell>
              <TableCell width={48}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => onUserClick(user.id)}
              >
                <TableCell>
                  <User user={user} size="medium" showSubtext={false} />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {user.username ? `@${user.username}` : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.phone || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.email || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatRoles(user) || 'No roles'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {user.total_jumps || 0}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateConsistent(user.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <ChevronRight />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {users.length === 0 && (
        <Box textAlign="center" py={6}>
          <Typography variant="body1" color="text.secondary">
            No users found
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default UserTable;
