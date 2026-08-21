import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  MenuItem,
  Stack,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  Tooltip,
  TablePagination,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ShoppingCart as CartIcon,
  LocalShipping as ShippingIcon,
  ReceiptLong as ReceiptIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { purchasesAPI, suppliersAPI, productsAPI } from '../services/api';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  // Pagination for Purchase History
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // New Purchase state
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [status, setStatus] = useState('ordered');
  const [notes, setNotes] = useState('');
  const [tax, setTax] = useState(0);
  const [freight, setFreight] = useState(0);

  // Add Item to Cart state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [cart, setCart] = useState([]);

  // Detail dialog state
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState(null);

  // Fetch purchases
  const loadPurchases = async () => {
    try {
      const response = await purchasesAPI.getAll({ search });
      if (response.success) {
        setPurchases(response.data || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load purchases');
    }
  };

  useEffect(() => {
    loadPurchases();
  }, [search]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [supplierRes, productRes] = await Promise.all([
          suppliersAPI.getAll(),
          productsAPI.getAll({ limit: 1000 }),
        ]);
        if (supplierRes.success) setSuppliers(supplierRes.data || []);
        if (productRes.success) setProducts(productRes.data.products || []);
      } catch (error) {
        toast.error(error.message || 'Failed to load purchase lookup data');
      }
    };
    loadLookups();
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p._id === selectedProductId);
  }, [products, selectedProductId]);

  // Autofill purchase price when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setPurchasePrice(selectedProduct.costPrice || selectedProduct.price || '');
    } else {
      setPurchasePrice('');
    }
  }, [selectedProduct]);

  // Add Item to Cart
  const handleAddToCart = () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    // Check if product already exists in cart
    const existingIndex = cart.findIndex((item) => item.product === selectedProductId);

    if (existingIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += Number(quantity);
      updatedCart[existingIndex].subtotal =
        updatedCart[existingIndex].quantity * updatedCart[existingIndex].purchasePrice;
      setCart(updatedCart);
    } else {
      const itemSubtotal = Number(quantity) * Number(purchasePrice);
      setCart((prev) => [
        ...prev,
        {
          product: selectedProductId,
          productName: selectedProduct?.name || 'Product',
          sku: selectedProduct?.sku || '',
          quantity: Number(quantity),
          purchasePrice: Number(purchasePrice || 0),
          subtotal: itemSubtotal,
        },
      ]);
    }

    // Reset line inputs
    setSelectedProductId('');
    setQuantity(1);
    setPurchasePrice('');
    toast.success('Product added to purchase list');
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
    toast.success('Product removed from purchase list');
  };

  // Calculate totals
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return Math.max(cartSubtotal + Number(tax) + Number(freight), 0);
  }, [cartSubtotal, tax, freight]);

  // Submit Purchase
  const handleCreatePurchase = async () => {
    try {
      if (!selectedSupplier) {
        toast.error('Please select a supplier');
        return;
      }
      if (cart.length === 0) {
        toast.error('Purchase list is empty. Add products first.');
        return;
      }

      const response = await purchasesAPI.create({
        supplier: selectedSupplier,
        items: cart.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
        })),
        tax: Number(tax),
        freight: Number(freight),
        paymentStatus,
        status,
        notes,
      });

      if (response.success) {
        toast.success('Purchase order registered successfully!');
        // Reset state
        setSelectedSupplier('');
        setPaymentStatus('pending');
        setStatus('ordered');
        setNotes('');
        setTax(0);
        setFreight(0);
        setCart([]);
        loadPurchases();
        // Refresh products list for updated stock levels
        const productRes = await productsAPI.getAll({ limit: 1000 });
        if (productRes.success) setProducts(productRes.data.products || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to record purchase');
    }
  };

  // View Purchase Details
  const handleViewPurchase = async (id) => {
    try {
      const res = await purchasesAPI.getById(id);
      if (res.success) {
        setCurrentPurchase(res.data);
        setOpenDetailDialog(true);
      }
    } catch (err) {
      toast.error('Failed to load purchase order details');
    }
  };

  // Pagination Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Generate and Download Purchase Order PDF
  const handleDownloadPDF = () => {
    const input = document.getElementById('purchase-capture');
    if (!input) return;

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`PurchaseOrder_${currentPurchase.purchaseNumber}.pdf`);
    });
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Purchase Order Management
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column - New Purchase Order Form */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                <ShippingIcon sx={{ mr: 1, color: 'primary.main' }} /> Procurement / New Purchase Order
              </Typography>

              <Grid container spacing={2}>
                {/* Supplier selection */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Select Supplier"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    required
                  >
                    {suppliers.map((s) => (
                      <MenuItem key={s._id} value={s._id}>
                        {s.name} ({s.companyName})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    label="Payment Status"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    label="Delivery Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <MenuItem value="ordered">Ordered</MenuItem>
                    <MenuItem value="received">Received</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Replenish Products list
                  </Typography>
                </Grid>

                {/* Product Select */}
                <Grid item xs={12} sm={5}>
                  <TextField
                    select
                    fullWidth
                    label="Product Name / SKU"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    {products.map((p) => (
                      <MenuItem key={p._id} value={p._id}>
                        {p.name} (SKU: {p.sku}) [Stock: {p.quantity}]
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Qty"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>

                <Grid item xs={6} sm={2.5}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Purchase Price (₹)"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </Grid>

                <Grid item xs={12} sm={2.5} sx={{ display: 'flex', alignItems: 'stretch' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleAddToCart}
                    sx={{ textTransform: 'none' }}
                  >
                    Add Item
                  </Button>
                </Grid>

                {/* Cart list */}
                <Grid item xs={12}>
                  {cart.length === 0 ? (
                    <Box
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        border: '1px dashed #ccc',
                        borderRadius: 1,
                        bgcolor: 'background.default',
                      }}
                    >
                      <Typography variant="body2" color="textSecondary">
                        No products added to procurement list yet.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Product Details</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Unit Price (₹)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Total (₹)</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cart.map((item, idx) => (
                            <TableRow key={`${item.product}-${idx}`}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {item.productName}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  SKU: {item.sku}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right">₹{item.purchasePrice.toFixed(2)}</TableCell>
                              <TableCell align="right">₹{item.subtotal.toFixed(2)}</TableCell>
                              <TableCell align="center">
                                <IconButton size="small" color="error" onClick={() => handleRemoveFromCart(idx)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Grid>

                {/* Cost Details */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tax (₹)"
                    value={tax}
                    onChange={(e) => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Freight / Shipping (₹)"
                    value={freight}
                    onChange={(e) => setFreight(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    multiline
                    rows={1}
                    label="Notes/Remarks"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Subtotal: ₹{cartSubtotal.toFixed(2)} | Tax: +₹{Number(tax).toFixed(2)} | Freight: +₹{Number(freight).toFixed(2)}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                        Total Amount: ₹{cartTotal.toFixed(2)}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCreatePurchase}
                      disabled={!selectedSupplier || cart.length === 0}
                      sx={{ textTransform: 'none', px: 4, py: 1.2, fontWeight: 700 }}
                    >
                      Complete Purchase
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Procurement history list */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} /> Procurement Transaction Log
              </Typography>

              <TextField
                fullWidth
                size="small"
                label="Search Purchases (No, Supplier...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TableContainer component={Paper} variant="outlined" sx={{ flexGrow: 1, maxHeight: 450 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Purchase No</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Supplier</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((purchase) => (
                      <TableRow key={purchase._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {purchase.purchaseNumber}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(purchase.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{purchase.supplier?.name || 'Unknown'}</Typography>
                          <Chip
                            label={purchase.status}
                            color={purchase.status === 'received' ? 'success' : purchase.status === 'ordered' ? 'primary' : 'error'}
                            size="small"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        </TableCell>
                        <TableCell align="right">₹{purchase.totalAmount?.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton size="small" color="primary" onClick={() => handleViewPurchase(purchase._id)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {purchases.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          No purchases transactions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 20]}
                component="div"
                count={purchases.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Purchase Detail Modal */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Purchase Order Details
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
            >
              Save PDF
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {currentPurchase && (
            <Box id="purchase-capture" sx={{ p: 3, bgcolor: '#fff', color: '#333', fontFamily: 'Roboto, Arial' }}>
              {/* Header */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    PURCHASE ORDER
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Enterprise Smart Inventory System
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {currentPurchase.purchaseNumber}
                  </Typography>
                  <Typography variant="body2">
                    Date: {new Date(currentPurchase.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Time: {new Date(currentPurchase.createdAt).toLocaleTimeString()}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Vendor & Client Details */}
              <Grid container spacing={2} sx={{ mb: 4, mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'textSecondary' }}>
                    SUPPLIER DETAILS
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {currentPurchase.supplier?.name || 'Walk-in Vendor'}
                  </Typography>
                  {currentPurchase.supplier?.companyName && (
                    <Typography variant="body2">Company: {currentPurchase.supplier.companyName}</Typography>
                  )}
                  {currentPurchase.supplier?.phone && (
                    <Typography variant="body2">Phone: {currentPurchase.supplier.phone}</Typography>
                  )}
                  {currentPurchase.supplier?.email && (
                    <Typography variant="body2">Email: {currentPurchase.supplier.email}</Typography>
                  )}
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'textSecondary' }}>
                    PROCUREMENT SUMMARY
                  </Typography>
                  <Typography variant="body2">
                    Payment Status: <b>{currentPurchase.paymentStatus?.toUpperCase()}</b>
                  </Typography>
                  <Typography variant="body2">
                    Delivery Status: <b>{currentPurchase.status?.toUpperCase()}</b>
                  </Typography>
                  {currentPurchase.branch && (
                    <Typography variant="body2">Branch Reference: {currentPurchase.branch}</Typography>
                  )}
                </Grid>
              </Grid>

              {/* Items Table */}
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Cost Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentPurchase.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {item.product?.name || 'Deleted Product'}
                        </TableCell>
                        <TableCell>{item.product?.sku || 'N/A'}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">₹{item.purchasePrice?.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          ₹{((item.quantity || 0) * (item.purchasePrice || 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Calculation Summary */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  {currentPurchase.notes && (
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        NOTES / REMARKS:
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {currentPurchase.notes}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={6}>
                  <Stack spacing={1} sx={{ textAlign: 'right', pr: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Subtotal:</Typography>
                      <Typography variant="body2">₹{currentPurchase.subtotal?.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Tax:</Typography>
                      <Typography variant="body2">₹{currentPurchase.tax?.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Freight / Shipping:</Typography>
                      <Typography variant="body2">₹{currentPurchase.freight?.toFixed(2)}</Typography>
                    </Box>
                    <Divider sx={{ my: 0.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Amount:</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        ₹{currentPurchase.totalAmount?.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              <Box sx={{ mt: 5, textAlign: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  Procured via Smart Inventory Management System
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
