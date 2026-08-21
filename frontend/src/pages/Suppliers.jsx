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
  Rating,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as WebIcon,
  AccountBalance as BankIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { suppliersAPI } from '../services/api';
import { normalizeRole, ROLE_IDS } from '../utils/roles';

const BUSINESS_TYPES = ['manufacturer', 'wholesaler', 'distributor', 'retailer', 'importer', 'other'];
const PAYMENT_TERMS = [
  { value: 'immediate', label: 'Immediate / COD' },
  { value: 'net_7', label: 'Net 7 Days' },
  { value: 'net_15', label: 'Net 15 Days' },
  { value: 'net_30', label: 'Net 30 Days' },
  { value: 'net_60', label: 'Net 60 Days' },
  { value: 'net_90', label: 'Net 90 Days' },
  { value: 'custom', label: 'Custom' },
];

const INITIAL_FORM = {
  name: '',
  companyName: '',
  businessType: 'manufacturer',
  email: '',
  phone: '',
  alternatePhone: '',
  website: '',
  contactPerson: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  gstNumber: '',
  panNumber: '',
  paymentTerms: 'net_30',
  creditLimit: '',
  bankDetails: {
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
  },
  notes: '',
  rating: 0,
};

export default function Suppliers() {
  const { user } = useSelector((state) => state.auth);
  const role = normalizeRole(user?.role);
  const canModify = [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER].includes(role);

  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // CRUD Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});

  // Details dialog state
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);

  // Delete dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [selectedDeleteName, setSelectedDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getAll({
        search,
        businessType: businessTypeFilter !== 'all' ? businessTypeFilter : undefined,
        page: page + 1,
        limit: rowsPerPage,
      });
      if (response.success) {
        setSuppliers(response.data || []);
        setTotal(response.pagination?.total ?? response.data?.length ?? 0);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [search, businessTypeFilter, page, rowsPerPage]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    setPage(0);
  }, [search, businessTypeFilter]);

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
    setEditingSupplier(null);
    setForm(INITIAL_FORM);
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setForm({
      name: sup.name || '',
      companyName: sup.companyName || '',
      businessType: sup.businessType || 'manufacturer',
      email: sup.email || '',
      phone: sup.phone || '',
      alternatePhone: sup.alternatePhone || '',
      website: sup.website || '',
      contactPerson: sup.contactPerson || '',
      address: sup.address || '',
      city: sup.city || '',
      state: sup.state || '',
      country: sup.country || 'India',
      pincode: sup.pincode || '',
      gstNumber: sup.gstNumber && !sup.gstNumber.startsWith('NO-GST-') ? sup.gstNumber : '',
      panNumber: sup.panNumber || '',
      paymentTerms: sup.paymentTerms || 'net_30',
      creditLimit: sup.creditLimit || '',
      bankDetails: {
        bankName: sup.bankDetails?.bankName || '',
        accountNumber: sup.bankDetails?.accountNumber || '',
        ifscCode: sup.bankDetails?.ifscCode || '',
        branchName: sup.bankDetails?.branchName || '',
      },
      notes: sup.notes || '',
      rating: sup.rating || 0,
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleViewSupplier = async (id) => {
    try {
      const res = await suppliersAPI.getById(id);
      if (res.success) {
        setCurrentSupplier(res.data);
        setOpenDetailsDialog(true);
      }
    } catch (err) {
      toast.error('Failed to load supplier details');
    }
  };

  const handleOpenDelete = (sup) => {
    setSelectedDeleteId(sup._id);
    setSelectedDeleteName(sup.name);
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
      };
      if (editingSupplier) {
        const res = await suppliersAPI.update(editingSupplier._id, payload);
        if (res.success) {
          toast.success('Supplier updated successfully');
          loadSuppliers();
          setOpenDialog(false);
        }
      } else {
        const res = await suppliersAPI.create(payload);
        if (res.success) {
          toast.success('Supplier created successfully');
          loadSuppliers();
          setOpenDialog(false);
        }
      }
    } catch (err) {
      const msg = err.message || 'Failed to save supplier';
      toast.error(msg);
      if (msg.toLowerCase().includes('email')) {
        setFormErrors((prev) => ({ ...prev, email: msg }));
      } else if (msg.toLowerCase().includes('gst')) {
        setFormErrors((prev) => ({ ...prev, gstNumber: msg }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await suppliersAPI.delete(selectedDeleteId);
      if (res.success) {
        toast.success('Supplier deleted successfully');
        loadSuppliers();
        setOpenDeleteDialog(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete supplier');
    } finally {
      setDeleting(false);
    }
  };

  const handleFieldChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleBankFieldChange = (field) => (e) => {
    setForm((p) => ({ ...p, bankDetails: { ...p.bankDetails, [field]: e.target.value } }));
  };

  const getBusinessTypeColor = (type) => {
    const colors = {
      manufacturer: 'primary',
      wholesaler: 'secondary',
      distributor: 'info',
      retailer: 'success',
      importer: 'warning',
      other: 'default',
    };
    return colors[type] || 'default';
  };

  const getPaymentTermLabel = (val) => {
    return PAYMENT_TERMS.find((t) => t.value === val)?.label || val || '—';
  };

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
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Supplier Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage vendors, payment terms, performance ratings, bank details, and supplied products.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadSuppliers} disabled={loading}>
            Refresh
          </Button>
          {canModify && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Add Supplier
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Stats cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{total}</Typography>
            <Typography variant="body2">Total Suppliers</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'success.contrastText' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {suppliers.filter((s) => (s.rating || 0) >= 4).length}
            </Typography>
            <Typography variant="body2">Top Rated (≥4★)</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.main', color: 'info.contrastText' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {suppliers.filter((s) => s.businessType === 'manufacturer').length}
            </Typography>
            <Typography variant="body2">Manufacturers</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'warning.contrastText' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {suppliers.reduce((acc, s) => acc + (s.outstandingPayments || 0), 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </Typography>
            <Typography variant="body2">Outstanding (Page)</Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
        <CardContent>
          {/* Filters */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, company, email, phone, city, GST or contact person..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Business Type</InputLabel>
              <Select
                value={businessTypeFilter}
                label="Business Type"
                onChange={(e) => setBusinessTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                {BUSINESS_TYPES.map((t) => (
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
                  <TableCell sx={{ fontWeight: 600 }}>Supplier & Company</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>GST / PAN</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Payment Terms</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
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
                ) : suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography color="textSecondary">
                        {search || businessTypeFilter !== 'all'
                          ? 'No suppliers match your search/filter.'
                          : 'No suppliers yet. Add your first supplier!'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((sup) => (
                    <TableRow key={sup._id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{sup.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {sup.companyName || 'Individual Vendor'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sup.businessType || 'other'}
                          color={getBusinessTypeColor(sup.businessType)}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <EmailIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption">{sup.email}</Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <PhoneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption">{sup.phone}</Typography>
                          </Stack>
                          {sup.contactPerson && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <PersonIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                              <Typography variant="caption">{sup.contactPerson}</Typography>
                            </Stack>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LocationIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography variant="caption">
                            {[sup.city, sup.state].filter(Boolean).join(', ') || '—'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>
                          {sup.gstNumber && !sup.gstNumber.startsWith('NO-GST-') ? sup.gstNumber : '—'}
                        </Typography>
                        {sup.panNumber && (
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                            PAN: {sup.panNumber}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{getPaymentTermLabel(sup.paymentTerms)}</Typography>
                        {sup.creditLimit > 0 && (
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                            Limit: ₹{sup.creditLimit?.toLocaleString('en-IN')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Rating value={sup.rating || 0} readOnly size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="View Full Details">
                            <IconButton size="small" color="info" onClick={() => handleViewSupplier(sup._id)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canModify && (
                            <>
                              <Tooltip title="Edit Supplier">
                                <IconButton size="small" color="primary" onClick={() => handleOpenEdit(sup)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Supplier">
                                <IconButton size="small" color="error" onClick={() => handleOpenDelete(sup)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
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
          {editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Contact Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" required
                label="Contact Person Name"
                value={form.name}
                onChange={handleFieldChange('name')}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small"
                label="Company / Business Name"
                value={form.companyName}
                onChange={handleFieldChange('companyName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Business Type</InputLabel>
                <Select
                  value={form.businessType}
                  label="Business Type"
                  onChange={handleFieldChange('businessType')}
                >
                  {BUSINESS_TYPES.map((t) => (
                    <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small"
                label="Contact Person (if different)"
                value={form.contactPerson}
                onChange={handleFieldChange('contactPerson')}
                InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment> }}
              />
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
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>
                Address Details
              </Typography>
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
                error={!!formErrors.gstNumber}
                helperText={formErrors.gstNumber || 'Leave blank if not applicable'}
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Terms</InputLabel>
                <Select
                  value={form.paymentTerms}
                  label="Payment Terms"
                  onChange={handleFieldChange('paymentTerms')}
                >
                  {PAYMENT_TERMS.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" type="number"
                label="Credit Limit (₹)"
                value={form.creditLimit}
                onChange={handleFieldChange('creditLimit')}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>

            {/* Bank Details — Collapsible */}
            <Grid item xs={12}>
              <Accordion variant="outlined" sx={{ mt: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BankIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Bank Account Details (optional)</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth size="small" label="Bank Name"
                        value={form.bankDetails.bankName}
                        onChange={handleBankFieldChange('bankName')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth size="small" label="Account Number"
                        value={form.bankDetails.accountNumber}
                        onChange={handleBankFieldChange('accountNumber')}
                        inputProps={{ style: { fontFamily: 'monospace' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth size="small" label="IFSC Code"
                        value={form.bankDetails.ifscCode}
                        onChange={handleBankFieldChange('ifscCode')}
                        inputProps={{ style: { fontFamily: 'monospace', textTransform: 'uppercase' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth size="small" label="Branch Name"
                        value={form.bankDetails.branchName}
                        onChange={handleBankFieldChange('branchName')}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Performance & Notes */}
            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>
                Performance & Notes
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                  Supplier Performance Rating
                </Typography>
                <Rating
                  value={form.rating}
                  onChange={(_, val) => setForm((p) => ({ ...p, rating: val || 0 }))}
                  size="large"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth size="small" multiline rows={3}
                label="Notes / Remarks"
                value={form.notes}
                onChange={handleFieldChange('notes')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary" disabled={submitting}>
            {submitting ? 'Saving...' : editingSupplier ? 'Save Changes' : 'Register Supplier'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Details View Dialog ─── */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Supplier Profile</DialogTitle>
        <DialogContent dividers>
          {currentSupplier && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">CONTACT NAME</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{currentSupplier.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">COMPANY / BUSINESS</Typography>
                    <Typography variant="body1">{currentSupplier.companyName || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">BUSINESS TYPE</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={currentSupplier.businessType || 'other'}
                        color={getBusinessTypeColor(currentSupplier.businessType)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">CONTACT PERSON</Typography>
                    <Typography variant="body1">{currentSupplier.contactPerson || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">EMAIL</Typography>
                    <Typography variant="body1">{currentSupplier.email}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">PHONE</Typography>
                    <Typography variant="body1">{currentSupplier.phone}</Typography>
                  </Box>
                  {currentSupplier.alternatePhone && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">ALTERNATE PHONE</Typography>
                      <Typography variant="body1">{currentSupplier.alternatePhone}</Typography>
                    </Box>
                  )}
                  {currentSupplier.website && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">WEBSITE</Typography>
                      <Typography variant="body1">
                        <a href={currentSupplier.website} target="_blank" rel="noopener noreferrer">
                          {currentSupplier.website}
                        </a>
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">FULL ADDRESS</Typography>
                    <Typography variant="body1">
                      {[currentSupplier.address, currentSupplier.city, currentSupplier.state,
                        currentSupplier.pincode, currentSupplier.country].filter(Boolean).join(', ')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">GST NUMBER</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {currentSupplier.gstNumber && !currentSupplier.gstNumber.startsWith('NO-GST-')
                        ? currentSupplier.gstNumber : '—'}
                    </Typography>
                  </Box>
                  {currentSupplier.panNumber && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">PAN NUMBER</Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{currentSupplier.panNumber}</Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="textSecondary">PAYMENT TERMS</Typography>
                    <Typography variant="body1">{getPaymentTermLabel(currentSupplier.paymentTerms)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">CREDIT LIMIT</Typography>
                    <Typography variant="body1">
                      {currentSupplier.creditLimit > 0
                        ? `₹${currentSupplier.creditLimit?.toLocaleString('en-IN')}`
                        : '—'}
                    </Typography>
                  </Box>
                  {currentSupplier.bankDetails?.bankName && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">BANK DETAILS</Typography>
                      <Typography variant="body2">
                        {currentSupplier.bankDetails.bankName}
                        {currentSupplier.bankDetails.branchName ? ` — ${currentSupplier.bankDetails.branchName}` : ''}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        A/C: {currentSupplier.bankDetails.accountNumber || '—'}
                        {currentSupplier.bankDetails.ifscCode ? ` | IFSC: ${currentSupplier.bankDetails.ifscCode}` : ''}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="textSecondary">PERFORMANCE RATING</Typography>
                    <Rating value={currentSupplier.rating || 0} readOnly />
                  </Box>
                  {currentSupplier.notes && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">NOTES</Typography>
                      <Typography variant="body2" sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                        {currentSupplier.notes}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="textSecondary">SUPPLIED PRODUCTS</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                      {currentSupplier.products && currentSupplier.products.length > 0 ? (
                        currentSupplier.products.map((p) => (
                          <Chip key={p._id} label={`${p.name} (${p.sku})`} variant="outlined" size="small" />
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">No products linked yet.</Typography>
                      )}
                    </Box>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)} color="primary" variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirm Dialog ─── */}
      <Dialog open={openDeleteDialog} onClose={() => !deleting && setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Delete Supplier?</DialogTitle>
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
