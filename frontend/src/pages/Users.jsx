import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Select,
  Switch,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { usersAPI } from '../services/api';
import { ROLE_IDS, normalizeRole } from '../utils/roles';

export default function Users() {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  // Delete confirm states
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);

  const loadUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load user accounts');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await usersAPI.updateRole(userId, newRole);
      if (res.success) {
        toast.success('User role updated successfully');
        loadUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update user role');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await usersAPI.toggleStatus(userId);
      if (res.success) {
        toast.success('User status updated');
        loadUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to toggle user status');
    }
  };

  const handleOpenDelete = (id) => {
    setSelectedDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteUser = async () => {
    try {
      const res = await usersAPI.delete(selectedDeleteId);
      if (res.success) {
        toast.success('User deleted successfully');
        loadUsers();
        setOpenDeleteDialog(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    const query = search.toLowerCase();
    return u.fullName.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
  });

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          User Accounts & Access Control
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Assign role-based access permissions, view active sessions, or enable/disable accounts.
        </Typography>
      </Box>

      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            size="small"
            label="Search user accounts by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
            }}
          />

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email Address</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role Assignment</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((u) => {
                  const isSelf = u._id === currentUser?.id;
                  return (
                    <TableRow key={u._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {u.fullName}
                          {isSelf && <Chip label="You" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />}
                        </Stack>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.phone}</TableCell>
                      <TableCell>
                        <Select
                          size="small"
                          value={normalizeRole(u.role)}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          disabled={isSelf} // Prevent demoting oneself
                          sx={{ minWidth: 150 }}
                        >
                          <MenuItem value={ROLE_IDS.SUPER_ADMIN}>Super Admin</MenuItem>
                          <MenuItem value={ROLE_IDS.ADMIN}>Admin</MenuItem>
                          <MenuItem value={ROLE_IDS.INVENTORY_MANAGER}>Inventory Manager</MenuItem>
                          <MenuItem value={ROLE_IDS.SALES_STAFF}>Sales Staff</MenuItem>
                          <MenuItem value={ROLE_IDS.VIEWER}>Viewer</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={u.isActive}
                          onChange={() => handleToggleStatus(u._id)}
                          disabled={isSelf} // Prevent deactivating oneself
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Delete Account">
                          <IconButton
                            size="small"
                            color="error"
                            disabled={isSelf} // Prevent deleting oneself
                            onClick={() => handleOpenDelete(u._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      No registered user accounts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Delete confirm dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete User Account?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete this user? They will immediately lose access to the
            system. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
