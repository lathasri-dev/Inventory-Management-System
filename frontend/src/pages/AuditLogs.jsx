import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Grid,
  TextField,
  MenuItem,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ShieldOutlined as AuditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  InfoOutlined as InfoIcon,
  Computer as SystemIcon,
  BugReport as BugIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { activityLogsAPI, usersAPI } from '../services/api';
import { useUI } from '../hooks/useRedux';

export default function AuditLogs() {
  const { darkMode } = useUI();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [totalLogs, setTotalLogs] = useState(0);

  // Filters state
  const [searchAction, setSearchAction] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Log for Inspector
  const [inspectorLog, setInspectorLog] = useState(null);

  // Fetch users list for filter dropdown
  const loadUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load user list for filtering', err);
    }
  };

  // Fetch log list
  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        user: selectedUser !== 'all' ? selectedUser : undefined,
        module: selectedModule !== 'all' ? selectedModule : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        action: searchAction.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await activityLogsAPI.getAll(params);
      if (res.success) {
        setLogs(res.data.logs || []);
        setTotalLogs(res.data.pagination?.total || 0);
      }
      setIsLoading(false);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch audit ledger');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [page, rowsPerPage, selectedUser, selectedModule, selectedStatus, startDate, endDate]);

  const handleRefresh = () => {
    setPage(0);
    loadLogs();
  };

  const handleClearFilters = () => {
    setSearchAction('');
    setSelectedUser('all');
    setSelectedModule('all');
    setSelectedStatus('all');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Color mappings
  const getModuleColor = (mod) => {
    switch (mod) {
      case 'products': return '#0ea5e9';
      case 'suppliers': return '#8b5cf6';
      case 'customers': return '#10b981';
      case 'sales': return '#ec4899';
      case 'purchases': return '#f59e0b';
      case 'users': return '#ef4444';
      default: return '#64748b';
    }
  };

  // Format changes before/after side by side
  const renderJSONDiff = (log) => {
    if (!log?.changes) return <Typography variant="body2">No changes recorded for this activity.</Typography>;
    const { before, after } = log.changes;

    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: darkMode ? '#0f172a' : '#f8fafc', overflowX: 'auto' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.secondary' }}>
              BEFORE CHANGE
            </Typography>
            <pre style={{ fontSize: '0.75rem', fontFamily: 'monospace', margin: 0 }}>
              {before ? JSON.stringify(before, null, 2) : '// Empty / New Resource'}
            </pre>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: darkMode ? '#0f172a' : '#f8fafc', overflowX: 'auto' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'primary.main' }}>
              AFTER CHANGE
            </Typography>
            <pre style={{ fontSize: '0.75rem', fontFamily: 'monospace', margin: 0 }}>
              {after ? JSON.stringify(after, null, 2) : '// Deleted / Removed'}
            </pre>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Helper values for dashboard stats
  const totalSuccess = logs.filter(l => l.status === 'success').length;
  const totalFailure = logs.filter(l => l.status === 'failure').length;

  return (
    <Box sx={{ p: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AuditIcon sx={{ fontSize: 32, color: 'primary.main' }} /> Security & Audit Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keep track of administrative actions, user updates, stock corrections, and transaction history.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
          Refresh Ledger
        </Button>
      </Box>

      {/* Mini stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 700 }}>
                Total Records Loaded
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                {totalLogs}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography color="success.main" variant="subtitle2" sx={{ fontWeight: 700 }}>
                Successful Actions
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'success.main' }}>
                {totalLogs - totalFailure}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography color="error.main" variant="subtitle2" sx={{ fontWeight: 700 }}>
                Failed Attempts
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'error.main' }}>
                {totalFailure}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter panel */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FilterIcon fontSize="small" /> Query Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Action Keywords"
              value={searchAction}
              onChange={(e) => setSearchAction(e.target.value)}
              placeholder="e.g. UPDATE, CREATE"
              InputProps={{
                endAdornment: searchAction && (
                  <IconButton size="small" onClick={() => setSearchAction('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="User Account"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <MenuItem value="all">All Users</MenuItem>
              {users.map((u) => (
                <MenuItem key={u._id} value={u._id}>
                  {u.fullName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Service Module"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <MenuItem value="all">All Modules</MenuItem>
              <MenuItem value="products">Products</MenuItem>
              <MenuItem value="suppliers">Suppliers</MenuItem>
              <MenuItem value="customers">Customers</MenuItem>
              <MenuItem value="sales">Sales</MenuItem>
              <MenuItem value="purchases">Purchases</MenuItem>
              <MenuItem value="users">Users</MenuItem>
              <MenuItem value="reports">Reports</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4} md={1.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="failure">Failure</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4} md={1.75}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={1.75}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
            <Button variant="outlined" size="small" onClick={handleClearFilters}>
              Reset Filters
            </Button>
            <Button variant="contained" size="small" startIcon={<SearchIcon />} onClick={loadLogs}>
              Apply Query
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Ledger Table */}
      <Paper sx={{ width: '100%', mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 800 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Operator User</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Network IP</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800 }}>Payload Inspect</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </TableCell>
                    <TableCell variant="body2">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {log.user?.fullName || 'System Account'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.user?.email || 'system@atlas.com'}
                      </Typography>
                    </TableCell>
                    <TableCell variant="body2">
                      <Chip
                        label={log.action}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          bgcolor: log.action.includes('CREATE') ? 'rgba(16,185,129,0.1)' : log.action.includes('DELETE') ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                          color: log.action.includes('CREATE') ? '#10b981' : log.action.includes('DELETE') ? '#ef4444' : '#f59e0b',
                        }}
                      />
                    </TableCell>
                    <TableCell variant="body2">
                      <Chip
                        label={log.module || 'system'}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          height: 20,
                          borderColor: getModuleColor(log.module),
                          color: getModuleColor(log.module),
                        }}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </TableCell>
                    <TableCell variant="body2">
                      <Chip
                        label={log.status}
                        color={log.status === 'success' ? 'success' : 'error'}
                        size="small"
                        sx={{ fontSize: '0.68rem', height: 18, fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View JSON payload changes">
                        <IconButton size="small" color="primary" onClick={() => setInspectorLog(log)}>
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      No administrative logs match the query parameters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[10, 15, 30]}
          component="div"
          count={totalLogs}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      {/* JSON Inspector Modal */}
      <Dialog
        open={Boolean(inspectorLog)}
        onClose={() => setInspectorLog(null)}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 4, p: 1 }
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Audit Log Details
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {inspectorLog?._id}
            </Typography>
          </Box>
          <IconButton onClick={() => setInspectorLog(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Metadata information */}
            <Paper variant="outlined" sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" display="block" color="text.secondary">OPERATOR</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {inspectorLog?.user?.fullName || 'System Account'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" display="block" color="text.secondary">NETWORK SOURCE</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {inspectorLog?.ipAddress || '127.0.0.1'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" display="block" color="text.secondary">TARGET COMPONENT</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: getModuleColor(inspectorLog?.module) }}>
                    {inspectorLog?.module || 'SYSTEM'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" display="block" color="text.secondary">DATE/TIME</Typography>
                  <Typography variant="body2">
                    {inspectorLog?.createdAt ? new Date(inspectorLog.createdAt).toLocaleString() : ''}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={1} alignItems="center">
                <SystemIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="caption" sx={{ wordBreak: 'break-word', fontFamily: 'monospace' }}>
                  {inspectorLog?.userAgent || 'N/A'}
                </Typography>
              </Stack>
            </Paper>

            {/* Changes Inspector */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <BugIcon fontSize="small" /> Payload State Changes
              </Typography>
              {renderJSONDiff(inspectorLog)}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setInspectorLog(null)} variant="outlined">
            Close Inspector
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
