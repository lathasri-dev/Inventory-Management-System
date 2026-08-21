import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  IconButton,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Avatar,
  Chip,
  Tooltip,
  Skeleton,
  InputAdornment,
  Collapse,
  Alert,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  CameraAlt as CameraIcon,
  SystemUpdateAlt as AdjustIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import QRCode from 'qrcode.react';
import * as XLSX from 'xlsx';
import { productsAPI, categoriesAPI, suppliersAPI } from '../services/api';
import { normalizeRole, ROLE_IDS } from '../utils/roles';
import {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  createProductStart,
  createProductSuccess,
  createProductFailure,
  updateProductStart,
  updateProductSuccess,
  updateProductFailure,
  deleteProductStart,
  deleteProductSuccess,
  deleteProductFailure,
  setFilters,
  clearFilters,
  setSort,
  setPagination,
} from '../redux/slices/productsSlice';

export default function Products() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: products, filters, pagination, sort, isLoading } = useSelector(
    (state) => state.products
  );

  const role = normalizeRole(user?.role);
  const isViewer = role === ROLE_IDS.VIEWER;
  const canModify = [ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN, ROLE_IDS.INVENTORY_MANAGER].includes(role);

  // Local state for select dropdowns
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Local state for dialogs
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openAdjustDialog, setOpenAdjustDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedViewProduct, setSelectedViewProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [importing, setImporting] = useState(false);

  // Form State
  const initialFormState = {
    name: '',
    sku: '',
    barcode: '',
    category: '',
    subCategory: '',
    brand: '',
    supplier: '',
    description: '',
    price: '',
    sellingPrice: '',
    costPrice: '',
    purchasePrice: '',
    quantity: '',
    reorderLevel: '10',
    minimumStock: '10',
    unit: 'piece',
    image: '',
    manufacturingDate: '',
    expiryDate: '',
  };
  const [form, setForm] = useState(initialFormState);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  // Fetch helper lists (Categories, Suppliers)
  const fetchDropdowns = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        categoriesAPI.getAll(),
        suppliersAPI.getAll(),
      ]);
      if (catRes.success) setCategories(catRes.data);
      if (supRes.success) setSuppliers(supRes.data);
    } catch (err) {
      console.error('Failed to fetch dropdown helper data', err);
    }
  };

  // Main fetch products dispatcher
  const loadProducts = async () => {
    try {
      dispatch(fetchProductsStart());
      const params = {
        search: filters.search,
        category: filters.category || undefined,
        supplier: filters.supplier || undefined,
        stockStatus: filters.stockStatus !== 'all' ? filters.stockStatus : undefined,
        sortBy: sort.field,
        sortOrder: sort.order,
        page: pagination.page,
        limit: pagination.pageSize,
      };

      const res = await productsAPI.getAll(params);
      if (res.success) {
        dispatch(
          fetchProductsSuccess({
            products: res.data.products,
            pagination: {
              page: res.data.pagination.page,
              pageSize: res.data.pagination.limit,
              total: res.data.pagination.total,
            },
          })
        );
      }
    } catch (err) {
      const msg = err.message || 'Failed to load products';
      dispatch(fetchProductsFailure(msg));
      toast.error(msg);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters, sort, pagination.page, pagination.pageSize]);

  // Filters change handlers
  const handleSearchChange = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  const handleFilterSelect = (name, value) => {
    dispatch(setFilters({ [name]: value }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSelectedIds([]);
  };

  // Pagination change handlers
  const handleChangePage = (event, newPage) => {
    dispatch(setPagination({ page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event) => {
    dispatch(setPagination({ page: 1, pageSize: parseInt(event.target.value, 10) }));
  };

  // Sorting handler
  const handleSortChange = (field) => {
    const isAsc = sort.field === field && sort.order === 'asc';
    dispatch(setSort({ field, order: isAsc ? 'desc' : 'asc' }));
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Image Upload handler (Base64)
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setForm((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Delete product action
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      dispatch(deleteProductStart());
      const res = await productsAPI.delete(id);
      if (res.success) {
        dispatch(deleteProductSuccess(id));
        toast.success('Product deleted successfully');
        loadProducts();
      }
    } catch (err) {
      dispatch(deleteProductFailure(err.message));
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const handleExportProducts = () => {
    const rows = products.map((product) => ({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      category: product.category?.name || '',
      brand: product.brand || '',
      supplier: product.supplier?.name || '',
      price: product.price,
      costPrice: product.costPrice || '',
      quantity: product.quantity,
      reorderLevel: product.reorderLevel,
      unit: product.unit,
      manufacturingDate: product.manufacturingDate || '',
      expiryDate: product.expiryDate || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'products-export.xlsx');
    toast.success('Products exported successfully');
  };

  const handleImportProducts = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      if (!rows.length) {
        throw new Error('The imported file does not contain any rows');
      }

      for (const row of rows) {
        await productsAPI.create({
          name: row.name,
          sku: row.sku,
          barcode: row.barcode,
          category: row.category,
          brand: row.brand,
          supplier: row.supplier,
          price: row.price,
          costPrice: row.costPrice,
          quantity: row.quantity,
          reorderLevel: row.reorderLevel || 10,
          unit: row.unit || 'piece',
          manufacturingDate: row.manufacturingDate || undefined,
          expiryDate: row.expiryDate || undefined,
        });
      }

      toast.success(`${rows.length} products imported successfully`);
      loadProducts();
    } catch (error) {
      toast.error(error.message || 'Failed to import products');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  // Bulk Delete action
  const handleBulkDelete = async () => {
    if (
      !window.confirm(`Are you sure you want to delete all ${selectedIds.length} selected products?`)
    ) {
      return;
    }

    try {
      dispatch(deleteProductStart());
      const res = await productsAPI.bulkDelete(selectedIds);
      if (res.success) {
        toast.success(`${selectedIds.length} products deleted successfully`);
        setSelectedIds([]);
        loadProducts();
      }
    } catch (err) {
      dispatch(deleteProductFailure(err.message));
      toast.error(err.message || 'Bulk delete failed');
    }
  };

  // Edit/Add form open
  const handleOpenFormDialog = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category: product.category?._id || product.category || '',
        subCategory: product.subCategory || '',
        brand: product.brand || '',
        supplier: product.supplier?._id || product.supplier || '',
        description: product.description || '',
        price: product.price || '',
        sellingPrice: product.sellingPrice || product.price || '',
        costPrice: product.costPrice || '',
        purchasePrice: product.purchasePrice || product.costPrice || '',
        quantity: product.quantity || '',
        reorderLevel: product.reorderLevel || '10',
        minimumStock: product.minimumStock || product.reorderLevel || '10',
        unit: product.unit || 'piece',
        image: product.image || '',
        manufacturingDate: product.manufacturingDate ? product.manufacturingDate.substring(0, 10) : '',
        expiryDate: product.expiryDate ? product.expiryDate.substring(0, 10) : '',
      });
      setImagePreview(product.image || '');
    } else {
      setSelectedProduct(null);
      setForm(initialFormState);
      setImagePreview('');
    }
    setOpenFormDialog(true);
  };

  // Submit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.sku || !form.category || form.price === '' || form.quantity === '') {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (selectedProduct) {
        dispatch(updateProductStart());
        const payload = {
          ...form,
          price: form.price !== '' ? parseFloat(form.price) : 0,
          sellingPrice: form.sellingPrice !== '' ? parseFloat(form.sellingPrice) : (form.price !== '' ? parseFloat(form.price) : 0),
          costPrice: form.costPrice !== '' ? parseFloat(form.costPrice) : 0,
          purchasePrice: form.purchasePrice !== '' ? parseFloat(form.purchasePrice) : (form.costPrice !== '' ? parseFloat(form.costPrice) : 0),
          quantity: form.quantity !== '' ? parseInt(form.quantity, 10) : 0,
          reorderLevel: form.reorderLevel !== '' ? parseInt(form.reorderLevel, 10) : 10,
          minimumStock: form.minimumStock !== '' ? parseInt(form.minimumStock, 10) : (form.reorderLevel !== '' ? parseInt(form.reorderLevel, 10) : 10),
        };
        const res = await productsAPI.update(selectedProduct._id, payload);
        if (res.success) {
          dispatch(updateProductSuccess(res.data));
          toast.success('Product updated successfully');
          setOpenFormDialog(false);
          loadProducts();
        }
      } else {
        dispatch(createProductStart());
        const payload = {
          ...form,
          price: parseFloat(form.price),
          sellingPrice: form.sellingPrice !== '' ? parseFloat(form.sellingPrice) : parseFloat(form.price),
          costPrice: form.costPrice !== '' ? parseFloat(form.costPrice) : 0,
          purchasePrice: form.purchasePrice !== '' ? parseFloat(form.purchasePrice) : (form.costPrice !== '' ? parseFloat(form.costPrice) : 0),
          quantity: parseInt(form.quantity, 10),
          reorderLevel: form.reorderLevel !== '' ? parseInt(form.reorderLevel, 10) : 10,
          minimumStock: form.minimumStock !== '' ? parseInt(form.minimumStock, 10) : (form.reorderLevel !== '' ? parseInt(form.reorderLevel, 10) : 10),
        };
        const res = await productsAPI.create(payload);
        if (res.success) {
          dispatch(createProductSuccess(res.data));
          toast.success('Product created successfully');
          setOpenFormDialog(false);
          loadProducts();
        }
      }
    } catch (err) {
      const msg = err.message || 'Operation failed';
      if (selectedProduct) {
        dispatch(updateProductFailure(msg));
      } else {
        dispatch(createProductFailure(msg));
      }
      toast.error(msg);
    }
  };

  // Detailed product view open
  const handleOpenDetailsDialog = (product) => {
    setSelectedViewProduct(product);
    setOpenDetailsDialog(true);
  };

  // Adjust stock dialog open
  const handleOpenAdjustDialog = (product) => {
    setSelectedProduct(product);
    setAdjustQuantity(product.quantity);
    setOpenAdjustDialog(true);
  };

  // Submit stock adjustment
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (adjustQuantity === '' || isNaN(parseInt(adjustQuantity)) || parseInt(adjustQuantity) < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    try {
      const res = await productsAPI.updateQuantity(selectedProduct._id, parseInt(adjustQuantity));
      if (res.success) {
        toast.success('Stock level adjusted successfully');
        setOpenAdjustDialog(false);
        loadProducts();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to adjust stock');
    }
  };

  // Stock tag color mapping
  const getStockChip = (quantity, reorderLevel) => {
    if (quantity === 0) {
      return <Chip label="Out of Stock" size="small" color="error" icon={<ErrorIcon />} />;
    }
    if (quantity <= reorderLevel) {
      return <Chip label="Low Stock" size="small" color="warning" icon={<WarningIcon />} />;
    }
    return <Chip label="In Stock" size="small" color="success" icon={<SuccessIcon />} />;
  };

  // Expiry styling check
  const getExpiryText = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
          Expired ({date.toLocaleDateString()})
        </Typography>
      );
    }
    if (diffDays <= 30) {
      return (
        <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold' }}>
          Expiring in {diffDays} days
        </Typography>
      );
    }
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Title Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }} gutterBottom>
            Product Catalog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your corporate inventory, monitor stock thresholds, and handle updates.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" component="label" disabled={isLoading || importing}>
            Import Excel
            <input type="file" hidden accept=".xlsx,.xls,.csv" onChange={handleImportProducts} />
          </Button>
          <Button variant="outlined" onClick={handleExportProducts} disabled={isLoading || products.length === 0}>
            Export Excel
          </Button>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadProducts} disabled={isLoading}>
            Reload
          </Button>
          {canModify && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenFormDialog(null)}>
              Add Product
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Filters Panel */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search Name, SKU, Barcode..."
              value={filters.search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: filters.search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleFilterSelect('search', '')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category || ''}
                label="Category"
                onChange={(e) => handleFilterSelect('category', e.target.value)}
              >
                <MenuItem value="">
                  <em>All Categories</em>
                </MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Supplier</InputLabel>
              <Select
                value={filters.supplier || ''}
                label="Supplier"
                onChange={(e) => handleFilterSelect('supplier', e.target.value)}
              >
                <MenuItem value="">
                  <em>All Suppliers</em>
                </MenuItem>
                {suppliers.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Stock Status</InputLabel>
              <Select
                value={filters.stockStatus}
                label="Stock Status"
                onChange={(e) => handleFilterSelect('stockStatus', e.target.value)}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="low">Low Stock</MenuItem>
                <MenuItem value="out">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {(filters.search || filters.category || filters.supplier || filters.stockStatus !== 'all') && (
              <Button size="small" variant="text" onClick={handleClearFilters} startIcon={<ClearIcon />}>
                Clear Filters
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Bulk Operations Bar */}
      <Collapse in={selectedIds.length > 0}>
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {selectedIds.length} Products Selected
            </Typography>
            {canModify && (
              <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleBulkDelete}>
                Delete Selected
              </Button>
            )}
          </Stack>
        </Paper>
      </Collapse>

      {/* Product Table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              {canModify && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < products.length}
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              <TableCell>Image</TableCell>
              <TableCell onClick={() => handleSortChange('name')} style={{ cursor: 'pointer' }}>
                Product Name {sort.field === 'name' ? (sort.order === 'asc' ? '▲' : '▼') : ''}
              </TableCell>
              <TableCell onClick={() => handleSortChange('sku')} style={{ cursor: 'pointer' }}>
                SKU {sort.field === 'sku' ? (sort.order === 'asc' ? '▲' : '▼') : ''}
              </TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>Category</TableCell>
              <TableCell onClick={() => handleSortChange('price')} style={{ cursor: 'pointer' }}>
                Price {sort.field === 'price' ? (sort.order === 'asc' ? '▲' : '▼') : ''}
              </TableCell>
              <TableCell onClick={() => handleSortChange('quantity')} style={{ cursor: 'pointer' }}>
                Stock Level {sort.field === 'quantity' ? (sort.order === 'asc' ? '▲' : '▼') : ''}
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from(new Array(5)).map((_, idx) => (
                <TableRow key={idx}>
                  {canModify && <TableCell><Skeleton variant="rectangular" width={20} /></TableCell>}
                  <TableCell><Skeleton variant="circular" width={40} height={40} /></TableCell>
                  <TableCell><Skeleton width="60%" /></TableCell>
                  <TableCell><Skeleton width="80%" /></TableCell>
                  <TableCell><Skeleton width="70%" /></TableCell>
                  <TableCell><Skeleton width="50%" /></TableCell>
                  <TableCell><Skeleton width="40%" /></TableCell>
                  <TableCell><Skeleton width="30%" /></TableCell>
                  <TableCell><Skeleton width="50%" /></TableCell>
                  <TableCell><Skeleton width="60%" /></TableCell>
                  <TableCell align="right"><Skeleton width={80} /></TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canModify ? 11 : 10} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    No products found. Adjust filters or create a new product.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const isSelected = selectedIds.includes(product._id);
                return (
                  <TableRow key={product._id} hover selected={isSelected}>
                    {canModify && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectOne(product._id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Avatar
                        src={product.image}
                        variant="rounded"
                        sx={{ width: 44, height: 44, bgcolor: 'background.default' }}
                      >
                        <CameraIcon fontSize="small" color="action" />
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {product.name}
                      </Typography>
                      {product.brand && (
                        <Typography variant="caption" color="text.secondary">
                          {product.brand}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell><code>{product.sku}</code></TableCell>
                    <TableCell>{product.barcode || '-'}</TableCell>
                    <TableCell>{product.category?.name || '-'}</TableCell>
                    <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {product.quantity}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.unit}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{getStockChip(product.quantity, product.reorderLevel)}</TableCell>
                    <TableCell>{getExpiryText(product.expiryDate)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View Details">
                          <IconButton size="small" color="info" onClick={() => handleOpenDetailsDialog(product)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Adjust Stock Quantity">
                          <IconButton size="small" onClick={() => handleOpenAdjustDialog(product)}>
                            <AdjustIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                        {canModify && (
                          <>
                            <Tooltip title="Edit Details">
                              <IconButton size="small" onClick={() => handleOpenFormDialog(product)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Product">
                              <IconButton size="small" onClick={() => handleDeleteProduct(product._id)} color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={pagination.total}
        page={Math.max(0, pagination.page - 1)}
        onPageChange={handleChangePage}
        rowsPerPage={pagination.pageSize}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 20, 50]}
      />

      {/* Create / Edit Form Dialog */}
      <Dialog open={openFormDialog} onClose={() => setOpenFormDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {selectedProduct ? 'Modify Product Details' : 'Register New Product'}
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              {/* Image Preview & Upload */}
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Box
                  sx={{
                    width: 180,
                    height: 180,
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: 'background.default',
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Stack alignItems="center" spacing={1}>
                      <CameraIcon color="action" fontSize="large" />
                      <Typography variant="caption" color="text.secondary">
                        Image Preview
                      </Typography>
                    </Stack>
                  )}
                </Box>
                <Button variant="outlined" component="label" size="small" startIcon={<CameraIcon />} sx={{ mt: 2 }}>
                  Choose Image
                  <input type="file" hidden accept="image/*" onChange={handleImageFileChange} />
                </Button>
              </Grid>

              {/* Product Info inputs */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Product Name *"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="SKU Code *"
                      value={form.sku}
                      onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Barcode (UPC/EAN)"
                      value={form.barcode}
                      onChange={(e) => setForm((prev) => ({ ...prev, barcode: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Brand"
                      value={form.brand}
                      onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={form.category}
                        label="Category"
                        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                      >
                        {categories.map((c) => (
                          <MenuItem key={c._id} value={c._id}>
                            {c.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Sub Category"
                      value={form.subCategory}
                      onChange={(e) => setForm((prev) => ({ ...prev, subCategory: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Supplier</InputLabel>
                      <Select
                        value={form.supplier}
                        label="Supplier"
                        onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))}
                      >
                        {suppliers.map((s) => (
                          <MenuItem key={s._id} value={s._id}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Unit Measure (e.g. piece, kg)"
                      value={form.unit}
                      onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        QR Preview
                      </Typography>
                      {form.sku ? (
                        <QRCode value={`${form.sku}|${form.name}`} size={96} />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Enter SKU to generate a QR preview
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Financials & Stock */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Financials & Inventory Metrics
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Selling Price ($) *"
                  type="number"
                  inputProps={{ step: '0.01', min: '0' }}
                  value={form.price}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({ ...prev, price: val, sellingPrice: val }));
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Purchase Price ($)"
                  type="number"
                  inputProps={{ step: '0.01', min: '0' }}
                  value={form.costPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({ ...prev, costPrice: val, purchasePrice: val }));
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Stock Quantity *"
                  type="number"
                  inputProps={{ min: '0' }}
                  value={form.quantity}
                  onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  required
                  disabled={!!selectedProduct} // Use separate stock adjuster for existing products
                  helperText={selectedProduct ? 'Adjust stock using the adjust tool' : ''}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Reorder Threshold"
                  type="number"
                  inputProps={{ min: '0' }}
                  value={form.reorderLevel}
                  onChange={(e) => setForm((prev) => ({ ...prev, reorderLevel: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Minimum Stock"
                  type="number"
                  inputProps={{ min: '0' }}
                  value={form.minimumStock}
                  onChange={(e) => setForm((prev) => ({ ...prev, minimumStock: e.target.value }))}
                />
              </Grid>

              {/* Dates & Descriptions */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Dates & Context details
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Manufacturing Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.manufacturingDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, manufacturingDate: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Expiry Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.expiryDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  multiline
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenFormDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {selectedProduct ? 'Save Changes' : 'Register Product'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Stock Adjuster Dialog */}
      <Dialog open={openAdjustDialog} onClose={() => setOpenAdjustDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Quick Stock Adjustment</DialogTitle>
        <form onSubmit={handleAdjustSubmit}>
          <DialogContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Product
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {selectedProduct?.name} ({selectedProduct?.sku})
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="New Stock Level"
                type="number"
                inputProps={{ min: '0', step: '1' }}
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                required
                helperText={`Current quantity: ${selectedProduct?.quantity} ${selectedProduct?.unit}`}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAdjustDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Adjust Stock
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Product Details View Dialog */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Product Specifications</DialogTitle>
        <DialogContent dividers>
          {selectedViewProduct && (
            <Grid container spacing={3}>
              {/* Product Image preview */}
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar
                  src={selectedViewProduct.image}
                  variant="rounded"
                  sx={{ width: 200, height: 200, bgcolor: 'background.default', mb: 2, border: '1px solid', borderColor: 'divider' }}
                >
                  <CameraIcon sx={{ fontSize: 60 }} color="disabled" />
                </Avatar>
                {selectedViewProduct.sku && (
                  <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, textAlign: 'center', width: '100%', maxWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Product QR Code
                    </Typography>
                    <QRCode value={`${selectedViewProduct.sku}|${selectedViewProduct.name}`} size={128} />
                  </Box>
                )}
              </Grid>

              {/* Product Specifications details */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {selectedViewProduct.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      SKU: <code>{selectedViewProduct.sku}</code> {selectedViewProduct.brand ? `| Brand: ${selectedViewProduct.brand}` : ''}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">CATEGORY</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {selectedViewProduct.category?.name || selectedViewProduct.category || 'Unclassified'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">SUPPLIER</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {selectedViewProduct.supplier?.name || selectedViewProduct.supplier || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">SELLING PRICE</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5, color: 'success.main' }}>
                      ${Number(selectedViewProduct.price || selectedViewProduct.sellingPrice || 0).toFixed(2)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">PURCHASE / COST PRICE</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5 }}>
                      ${Number(selectedViewProduct.costPrice || selectedViewProduct.purchasePrice || 0).toFixed(2)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">CURRENT STOCK</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {selectedViewProduct.quantity} {selectedViewProduct.unit || 'pieces'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">MINIMUM STOCK</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {selectedViewProduct.minimumStock || selectedViewProduct.reorderLevel || 10}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">REORDER THRESHOLD</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {selectedViewProduct.reorderLevel || 10}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">MANUFACTURING DATE</Typography>
                    <Typography variant="body1" sx={{ mb: 1.5 }}>
                      {selectedViewProduct.manufacturingDate ? new Date(selectedViewProduct.manufacturingDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">EXPIRY DATE</Typography>
                    <Typography variant="body1" sx={{ mb: 1.5 }}>
                      {selectedViewProduct.expiryDate ? new Date(selectedViewProduct.expiryDate).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">DESCRIPTION</Typography>
                    <Typography variant="body2" sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                      {selectedViewProduct.description || 'No description provided.'}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)} color="primary" variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
