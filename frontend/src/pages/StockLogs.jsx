import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
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
  Alert
} from '@mui/material';
import {
  History as HistoryIcon,
  SwapHoriz as AdjustmentIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Warehouse as WarehouseIcon,
  HourglassEmpty as ExpiryIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../services/apiClient';
import { productsAPI } from '../services/api';

export default function StockLogs() {
  const [tabValue, setTabValue] = useState(0);
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination for logs table
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);

  // Filter state
  const [filterType, setFilterType] = useState('all');

  // Form State for new adjustment
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('stock_in');
  const [quantity, setQuantity] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Expiry Products state
  const [expiringProducts, setExpiringProducts] = useState([]);

  // Fetch helper lists (Products, Logs, Expiry Products)
  const fetchProducts = async () => {
    try {
      const res = await productsAPI.getAll({ limit: 1000 });
      if (res.success) {
        setProducts(res.data.products || []);
        
        // Extract expired or expiring products (expiring within 90 days)
        const allProds = res.data.products || [];
        const expiring = allProds.filter(p => {
          if (!p.expiryDate) return false;
          const expiry = new Date(p.expiryDate);
          const today = new Date();
          const diffTime = expiry - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 90; // expiring in 90 days or already expired
        }).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        
        setExpiringProducts(expiring);
      }
    } catch (err) {
      console.error('Failed to load products list', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        type: filterType !== 'all' ? filterType : undefined
      };
      
      const res = await apiClient.get('/inventory-logs', { params });
      if (res.success) {
        setLogs(res.data.logs || []);
        setTotalLogs(res.data.pagination.total || 0);
      }
      setIsLoading(false);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch inventory ledger');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (tabValue === 0) {
      fetchLogs();
    }
  }, [tabValue, page, rowsPerPage, filterType]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Submit manual stock adjustment
  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty === 0) {
      toast.error('Please enter a valid non-zero quantity');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiClient.post('/inventory-logs/adjustment', {
        productId: selectedProductId,
        type: adjustmentType,
        quantity: qty,
        warehouseLocation,
        notes
      });

      if (res.success) {
        toast.success('Stock adjustment logged successfully!');
        // Reset form
        setSelectedProductId('');
        setQuantity('');
        setWarehouseLocation('');
        setNotes('');
        
        // Refresh listings
        fetchProducts();
        fetchLogs();
      }
      setIsSubmitting(false);
    } catch (err) {
      toast.error(err.message || 'Failed to apply stock adjustment');
      setIsSubmitting(false);
    }
  };

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'stock_in': return 'success';
      case 'stock_out': return 'error';
      case 'adjustment': return 'info';
      case 'damaged': return 'error';
      case 'returned': return 'success';
      case 'transfer': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Inventory & Stock Ledger
      </Typography>

      <Paper sx={{ width: '100%', mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}
        >
          <Tab icon={<HistoryIcon sx={{ fontSize: 20 }} />} label="Stock Ledger" iconPosition="start" />
          <Tab icon={<AdjustmentIcon sx={{ fontSize: 20 }} />} label="Record Stock Movement" iconPosition="start" />
          <Tab icon={<ExpiryIcon sx={{ fontSize: 20 }} />} label="Expiry Tracker" iconPosition="start" />
        </Tabs>

        {/* Tab 0 - Ledger Grid */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Inventory Movement Audit
              </Typography>
              <TextField
                select
                size="small"
                label="Filter by Type"
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="all">All Movements</MenuItem>
                <MenuItem value="stock_in">Stock In</MenuItem>
                <MenuItem value="stock_out">Stock Out</MenuItem>
                <MenuItem value="adjustment">Adjustments</MenuItem>
                <MenuItem value="damaged">Damaged Products</MenuItem>
                <MenuItem value="returned">Returned Products</MenuItem>
                <MenuItem value="transfer">Warehouse Transfers</MenuItem>
              </TextField>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Date/Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Product SKU</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Product Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Adjustment Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Previous Stock</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>New Stock</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Performed By</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log._id} hover>
                        <TableCell variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell variant="body2" sx={{ fontWeight: 600 }}>{log.product?.sku || 'N/A'}</TableCell>
                        <TableCell variant="body2">{log.product?.name || 'Deleted Product'}</TableCell>
                        <TableCell variant="body2">
                          <Chip
                            label={log.type.replace('_', ' ')}
                            color={getLogTypeColor(log.type)}
                            size="small"
                            sx={{ textTransform: 'capitalize', fontSize: '0.7rem', height: 20 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: log.quantity > 0 ? 'success.main' : 'error.main' }}>
                          {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                        </TableCell>
                        <TableCell align="right" color="textSecondary">{log.previousStock}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{log.newStock}</TableCell>
                        <TableCell variant="body2">{log.warehouseLocation || '-'}</TableCell>
                        <TableCell variant="body2">{log.user?.fullName || 'System'}</TableCell>
                        <TableCell variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{log.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                          No inventory audit logs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={totalLogs}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </Box>
        )}

        {/* Tab 1 - Action Form */}
        {tabValue === 1 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
              <WarehouseIcon sx={{ mr: 1, color: 'primary.main' }} /> Record Stock Transaction
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Select a product and specify details below to manually ingest or adjust inventory levels. Stock quantities will be updated in real-time.
            </Typography>

            <form onSubmit={handleAdjustmentSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Select Product to Adjust"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                  >
                    {products.map((p) => (
                      <MenuItem key={p._id} value={p._id}>
                        {p.name} (SKU: {p.sku}) [Current: {p.quantity} {p.unit}s]
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    label="Movement Type"
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                    required
                  >
                    <MenuItem value="stock_in">Stock In (Replenish)</MenuItem>
                    <MenuItem value="stock_out">Stock Out (Decrease)</MenuItem>
                    <MenuItem value="adjustment">Stock Adjustment (General)</MenuItem>
                    <MenuItem value="damaged">Damaged Products (Scrap)</MenuItem>
                    <MenuItem value="returned">Returned Products</MenuItem>
                    <MenuItem value="transfer">Warehouse Transfer</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity Changed"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 50 or -15"
                    required
                    helperText="Enter positive for stock-in/returns, negative for stock-out/damaged"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Warehouse / Storage Location"
                    value={warehouseLocation}
                    onChange={(e) => setWarehouseLocation(e.target.value)}
                    placeholder="e.g. Rack A, Shelf 2 or Warehouse B"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Adjustment Note / Reason"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Damage during cargo unloading, customer refund..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button variant="outlined" onClick={() => { setSelectedProductId(''); setQuantity(''); setWarehouseLocation(''); setNotes(''); }}>
                    Clear
                  </Button>
                  <Button type="submit" variant="contained" color="primary" disabled={isSubmitting} sx={{ px: 4 }}>
                    {isSubmitting ? 'Logging...' : 'Post Adjustment'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Box>
        )}

        {/* Tab 2 - Expiry Monitor */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
              <ExpiryIcon sx={{ mr: 1, color: 'warning.main' }} /> Product Expiry Tracking
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Here are all the inventory items nearing expiry or currently expired. Red indicates expired, yellow indicates expiring within 30 days.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {expiringProducts.length > 0 ? (
                <Grid item xs={12}>
                  <TableContainer variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                          <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Product Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Current Stock</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>MFG Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Expiry Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Days Remaining</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expiringProducts.map((p) => {
                          const exp = new Date(p.expiryDate);
                          const today = new Date();
                          const diffTime = exp - today;
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          let statusLabel = 'Active';
                          let statusColor = 'success';
                          
                          if (diffDays <= 0) {
                            statusLabel = 'Expired';
                            statusColor = 'error';
                          } else if (diffDays <= 30) {
                            statusLabel = 'Expiring Soon';
                            statusColor = 'warning';
                          } else if (diffDays <= 90) {
                            statusLabel = 'Watchlist';
                            statusColor = 'info';
                          }
                          
                          return (
                            <TableRow key={p._id} sx={{ bgcolor: diffDays <= 0 ? 'error.lightest' : diffDays <= 30 ? 'warning.lightest' : 'inherit' }}>
                              <TableCell variant="body2" sx={{ fontWeight: 600 }}>{p.sku}</TableCell>
                              <TableCell variant="body2">{p.name}</TableCell>
                              <TableCell variant="body2">{p.quantity} {p.unit}s</TableCell>
                              <TableCell variant="body2">{p.manufacturingDate ? new Date(p.manufacturingDate).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell variant="body2" sx={{ fontWeight: 600 }}>{new Date(p.expiryDate).toLocaleDateString()}</TableCell>
                              <TableCell variant="body2" sx={{ fontWeight: 700, color: diffDays <= 0 ? 'error.main' : diffDays <= 30 ? 'warning.main' : 'inherit' }}>
                                {diffDays <= 0 ? `Expired (${Math.abs(diffDays)} days ago)` : `${diffDays} days`}
                              </TableCell>
                              <TableCell variant="body2">
                                <Chip label={statusLabel} color={statusColor} size="small" />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <Alert severity="success">
                    No products are nearing expiry or currently expired. Inventory is healthy!
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
