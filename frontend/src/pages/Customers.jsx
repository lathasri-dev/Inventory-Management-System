import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  TablePagination,
  Chip,
  LinearProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  History as HistoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Language as WebIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { customersAPI } from '../services/api';
import { normalizeRole, ROLE_IDS } from '../utils/roles';

const CUSTOMER_TYPES = ['retail', 'wholesale', 'distributor', 'corporate', 'vip'];

const CUSTOMER_TYPE_COLORS = {
  retail: 'default',
  wholesale: 'primary',
  distributor: 'secondary',
  corporate: 'info',
  vip: 'warning',
};

const INITIAL_FORM = {
  name: '',
  companyName: '',
  customerType: 'retail',
  email: '',
  phone: '',
  alternatePhone: '',
  website: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  gstNumber: '',
  panNumber: '',
  creditLimit: '',
  creditPeriod: '',
  loyaltyPoints: '',
  notes: '',
};

export default function Customers() {
  const { user } = useSelector((state) => state.auth);
  const role = normalizeRole(user?.role);
  const canModify = [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER, ROLE_IDS.SALES_STAFF].includes(role);
  const canDelete = [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER].includes(role);

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // CRUD Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});

  // Details & history dialog
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Delete dialog
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [selectedDeleteName, setSelectedDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll({
        search,
        customerType: typeFilter !== 'all' ? typeFilter : undefined,
        page: page + 1,
        limit: rowsPerPage,
      });
      if (response.success) {
        setCustomers(response.data || []);
        setTotal(response.pagination?.total ?? response.data?.length ?? 0);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, page, rowsPerPage]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    setPage(0);
  }, [search, typeFilter]);

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
    if (!form.phone.trim()) errors.phone = 'Phone is required';
    if (!form.address.trim()) errors.address = 'Address is required';
    return errors;
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setForm(INITIAL_FORM);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (cust) => {
    setEditingCustomer(cust);
    setForm({
      name: cust.name || '',
      companyName: cust.companyName || '',
      customerType: cust.customerType || 'retail',
      email: cust.email || '',
      phone: cust.phone || '',
      alternatePhone: cust.alternatePhone || '',
      website: cust.website || '',
      address: cust.address || '',
      city: cust.city || '',
      state: cust.state || '',
      country: cust.country || 'India',
      pincode: cust.pincode || '',
      gstNumber: cust.gstNumber || '',
      panNumber: cust.panNumber || '',
      creditLimit: cust.creditLimit || '',
      creditPeriod: cust.creditPeriod || '',
      loyaltyPoints: cust.loyaltyPoints || '',
      notes: cust.notes || '',
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenView = async (cust) => {
    setCurrentCustomer(cust);
    setSalesHistory([]);
    setTabIndex(0);
    setOpenDetailsDialog(true);
    setLoadingHistory(true);
    try {
      const res = await customersAPI.getSalesHistory(cust._id);
      if (res.success) setSalesHistory(res.data || []);
    } catch {
      // ignore — sales history is optional
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenDelete = (cust) => {
    setSelectedDeleteId(cust._id);
    setSelectedDeleteName(cust.name);
    setOpenDeleteDialog(true);
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        creditLimit: form.creditLimit !== '' ? parseFloat(form.creditLimit) : 0,
        creditPeriod: form.creditPeriod !== '' ? parseInt(form.creditPeriod, 10) : 0,
        loyaltyPoints: form.loyaltyPoints !== '' ? parseInt(form.loyaltyPoints, 10) : 0,
      };
      if (editingCustomer) {
        const res = await customersAPI.update(editingCustomer._id, payload);
        if (res.success) {
          toast.success('Customer updated successfully');
          loadCustomers();
          setOpenDialog(false);
        }
      } else {
        const res = await customersAPI.create(payload);
        if (res.success) {
          toast.success('Customer created successfully');
          loadCustomers();
          setOpenDialog(false);
        }
      }
    } catch (err) {
      const msg = err.message || 'Failed to save customer';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) {
        setFormErrors((prev) => ({ ...prev, email: msg }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await customersAPI.delete(selectedDeleteId);
      if (res.success) {
        toast.success('Customer deleted successfully');
        loadCustomers();
        setOpenDeleteDialog(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const handleFieldChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const vipCount = customers.filter((c) => c.customerType === 'vip').length;
  const corporateCount = customers.filter((c) => c.customerType === 'corporate').length;
  const totalSpent = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);

  return (
    <Box sx={{ p: 1 }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Customer Management</Typography>
          <Typography variant="body2" color="textSecondary">
            Track and manage your customer base, purchase history, credit limits, and loyalty points.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadCustomers} disabled={loading}>
            Refresh
          </Button>
          {canModify && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ fontWeight: 600 }}>
              Add Customer
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{total}</Typography>
            <Typography variant="body2">Total Customers</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'warning.contrastText' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{vipCount}</Typography>
            <Typography variant="body2">VIP (This Page)</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'info.contrastText' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{corporateCount}</Typography>
            <Typography variant="body2">Corporate (This Page)</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'success.contrastText' }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Typography>
            <Typography variant="body2">Total Spent (Page)</Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
        <CardContent>
          {/* Search & Filter */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              fullWidth size="small"
              placeholder="Search by name, company, email, phone, city or GST..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}><ClearIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Customer Type</InputLabel>
              <Select
                value={typeFilter}
                label="Customer Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                {CUSTOMER_TYPES.map((t) => (
                  <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {loading && <LinearProgress sx={{ mb: 1 }} />}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Credit Limit</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Loyalty Pts</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Total Spent</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography color="textSecondary">
                        {search || typeFilter !== 'all'
                          ? 'No customers match your filters.'
                          : 'No customers yet. Add your first customer!'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((cust) => (
                    <TableRow key={cust._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {cust.name}
                          {cust.customerType === 'vip' && (
                            <StarIcon sx={{ fontSize: 14, color: 'warning.main', ml: 0.5, verticalAlign: 'middle' }} />
                          )}
                        </Typography>
                        {cust.companyName && (
                          <Typography variant="caption" color="textSecondary">{cust.companyName}</Typography>
                        )}
                        {cust.gstNumber && (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontFamily: 'monospace' }}>
                            GST: {cust.gstNumber}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <EmailIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption">{cust.email}</Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <PhoneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption">{cust.phone}</Typography>
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LocationIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography variant="caption">
                            {[cust.city, cust.state].filter(Boolean).join(', ') || '—'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={cust.customerType}
                          color={CUSTOMER_TYPE_COLORS[cust.customerType] || 'default'}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        {cust.creditLimit > 0
                          ? <Typography variant="caption">₹{cust.creditLimit?.toLocaleString('en-IN')}</Typography>
                          : <Typography variant="caption" color="textSecondary">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {(cust.loyaltyPoints || 0).toLocaleString('en-IN')} pts
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          ₹{(cust.totalSpent || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="View Details">
                            <IconButton size="small" color="info" onClick={() => handleOpenView(cust)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canModify && (
                            <Tooltip title="Edit Customer">
                              <IconButton size="small" color="primary" onClick={() => handleOpenEdit(cust)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip title="Delete Customer">
                              <IconButton size="small" color="error" onClick={() => handleOpenDelete(cust)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 20, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* ─── Create/Edit Dialog ─── */}
      <Dialog open={openDialog} onClose={() => !submitting && setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingCustomer ? 'Edit Customer' : 'Register New Customer'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>

            {/* Identity */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Customer Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" required
                label="Full Name"
                value={form.name}
                onChange={handleFieldChange('name')}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small"
                label="Company Name (if business)"
                value={form.companyName}
                onChange={handleFieldChange('companyName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Customer Type</InputLabel>
                <Select
                  value={form.customerType}
                  label="Customer Type"
                  onChange={handleFieldChange('customerType')}
                >
                  {CUSTOMER_TYPES.map((t) => (
                    <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" required type="email"
                label="Email Address"
                value={form.email}
                onChange={handleFieldChange('email')}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" required
                label="Phone Number"
                value={form.phone}
                onChange={handleFieldChange('phone')}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small"
                label="Alternate Phone"
                value={form.alternatePhone}
                onChange={handleFieldChange('alternatePhone')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small"
                label="Website"
                value={form.website}
                onChange={handleFieldChange('website')}
                placeholder="https://example.com"
                InputProps={{ startAdornment: <InputAdornment position="start"><WebIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>Address</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth size="small" required
                label="Street Address"
                value={form.address}
                onChange={handleFieldChange('address')}
                error={!!formErrors.address}
                helperText={formErrors.address}
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationIcon fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="City" value={form.city} onChange={handleFieldChange('city')} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="State" value={form.state} onChange={handleFieldChange('state')} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Pincode" value={form.pincode} onChange={handleFieldChange('pincode')} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" label="Country" value={form.country} onChange={handleFieldChange('country')} />
            </Grid>

            {/* Financial & Legal */}
            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>
                Financial & Legal Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small"
                label="GST Number (optional)"
                value={form.gstNumber}
                onChange={handleFieldChange('gstNumber')}
                inputProps={{ style: { fontFamily: 'monospace' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small"
                label="PAN Number (optional)"
                value={form.panNumber}
                onChange={handleFieldChange('panNumber')}
                inputProps={{ style: { fontFamily: 'monospace' } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" type="number"
                label="Credit Limit (₹)"
                value={form.creditLimit}
                onChange={handleFieldChange('creditLimit')}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" type="number"
                label="Credit Period (Days)"
                value={form.creditPeriod}
                onChange={handleFieldChange('creditPeriod')}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" type="number"
                label="Loyalty Points"
                value={form.loyaltyPoints}
                onChange={handleFieldChange('loyaltyPoints')}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }} />
              <TextField
                fullWidth size="small" multiline rows={3}
                label="Notes / Remarks"
                value={form.notes}
                onChange={handleFieldChange('notes')}
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Register Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Customer Details Dialog ─── */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Customer Profile</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {currentCustomer && (
            <>
              <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                <Tab label="Profile" icon={<PersonIcon />} iconPosition="start" />
                <Tab label={`Sales History (${salesHistory.length})`} icon={<HistoryIcon />} iconPosition="start" />
              </Tabs>

              {tabIndex === 0 && (
                <Grid container spacing={3} sx={{ p: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">NAME</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {currentCustomer.name}
                          {currentCustomer.customerType === 'vip' && (
                            <StarIcon sx={{ fontSize: 16, color: 'warning.main', ml: 0.5, verticalAlign: 'middle' }} />
                          )}
                        </Typography>
                      </Box>
                      {currentCustomer.companyName && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">COMPANY</Typography>
                          <Typography variant="body1">{currentCustomer.companyName}</Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="caption" color="textSecondary">CUSTOMER TYPE</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={currentCustomer.customerType}
                            color={CUSTOMER_TYPE_COLORS[currentCustomer.customerType] || 'default'}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">EMAIL</Typography>
                        <Typography variant="body1">{currentCustomer.email}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">PHONE</Typography>
                        <Typography variant="body1">{currentCustomer.phone}</Typography>
                      </Box>
                      {currentCustomer.alternatePhone && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">ALTERNATE PHONE</Typography>
                          <Typography variant="body1">{currentCustomer.alternatePhone}</Typography>
                        </Box>
                      )}
                      {currentCustomer.website && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">WEBSITE</Typography>
                          <Typography variant="body1">
                            <a href={currentCustomer.website} target="_blank" rel="noopener noreferrer">
                              {currentCustomer.website}
                            </a>
                          </Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="caption" color="textSecondary">ADDRESS</Typography>
                        <Typography variant="body1">
                          {[currentCustomer.address, currentCustomer.city, currentCustomer.state,
                            currentCustomer.pincode, currentCustomer.country].filter(Boolean).join(', ')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      {currentCustomer.gstNumber && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">GST NUMBER</Typography>
                          <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{currentCustomer.gstNumber}</Typography>
                        </Box>
                      )}
                      {currentCustomer.panNumber && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">PAN NUMBER</Typography>
                          <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{currentCustomer.panNumber}</Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="caption" color="textSecondary">CREDIT LIMIT</Typography>
                        <Typography variant="body1">
                          {currentCustomer.creditLimit > 0
                            ? `₹${currentCustomer.creditLimit?.toLocaleString('en-IN')}`
                            : 'No credit limit'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">CREDIT PERIOD</Typography>
                        <Typography variant="body1">
                          {currentCustomer.creditPeriod > 0
                            ? `${currentCustomer.creditPeriod} days`
                            : 'Immediate'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">LOYALTY POINTS</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                          ⭐ {(currentCustomer.loyaltyPoints || 0).toLocaleString('en-IN')} pts
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">TOTAL PURCHASES</Typography>
                        <Typography variant="body1">{currentCustomer.totalPurchases || 0} orders</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">TOTAL SPENT</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                          ₹{(currentCustomer.totalSpent || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">OUTSTANDING PAYMENTS</Typography>
                        <Typography variant="body1" sx={{ color: currentCustomer.outstandingPayments > 0 ? 'error.main' : 'text.primary' }}>
                          ₹{(currentCustomer.outstandingPayments || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      {currentCustomer.notes && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">NOTES</Typography>
                          <Typography variant="body2" sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                            {currentCustomer.notes}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              )}

              {tabIndex === 1 && (
                <Box sx={{ p: 3 }}>
                  {loadingHistory ? (
                    <LinearProgress />
                  ) : salesHistory.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <ShoppingCartIcon sx={{ fontSize: 48, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                      <Typography color="textSecondary">No sales history found for this customer.</Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Invoice</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salesHistory.map((sale) => (
                            <TableRow key={sale._id} hover>
                              <TableCell><code>{sale.invoiceNumber || sale._id?.substring(0, 8)}</code></TableCell>
                              <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>{sale.items?.length || 0} items</TableCell>
                              <TableCell>₹{(sale.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                              <TableCell>
                                <Chip label={sale.paymentStatus || 'pending'} size="small"
                                  color={sale.paymentStatus === 'paid' ? 'success' : 'warning'}
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)} color="primary" variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirm Dialog ─── */}
      <Dialog open={openDeleteDialog} onClose={() => !deleting && setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Delete Customer?</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete <strong>"{selectedDeleteName}"</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
