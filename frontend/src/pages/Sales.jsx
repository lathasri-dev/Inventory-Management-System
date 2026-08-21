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
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { salesAPI, customersAPI, productsAPI } from '../services/api';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Pagination for Sales History
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // New Sale state
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('completed');
  const [notes, setNotes] = useState('');
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Add Item to Cart state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [itemDiscount, setItemDiscount] = useState(0);
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');

  // Detail dialog state
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);

  // Fetch sales, customers, products
  const loadSales = async () => {
    try {
      const response = await salesAPI.getAll({ search });
      if (response.success) {
        setSales(response.data.sales || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to load sales');
    }
  };

  useEffect(() => {
    loadSales();
  }, [search]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [customerRes, productRes] = await Promise.all([
          customersAPI.getAll(),
          productsAPI.getAll({ limit: 1000 }),
        ]);
        if (customerRes.success) setCustomers(customerRes.data || []);
        if (productRes.success) setProducts(productRes.data.products || []);
      } catch (error) {
        toast.error(error.message || 'Failed to load sale lookup data');
      }
    };
    loadLookups();
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p._id === selectedProductId);
  }, [products, selectedProductId]);

  // Set unit price automatically when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setPrice(selectedProduct.price || '');
    } else {
      setPrice('');
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

    // Check inventory stock level
    if (selectedProduct && selectedProduct.quantity < quantity) {
      toast.error(`Insufficient stock! Only ${selectedProduct.quantity} units available.`);
      return;
    }

    // Check if product already exists in cart
    const existingIndex = cart.findIndex((item) => item.product === selectedProductId);

    if (existingIndex !== -1) {
      const newQty = cart[existingIndex].quantity + Number(quantity);
      if (selectedProduct && selectedProduct.quantity < newQty) {
        toast.error(`Insufficient stock! Total in cart (${newQty}) exceeds stock.`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity = newQty;
      updatedCart[existingIndex].subtotal =
        newQty * updatedCart[existingIndex].price - updatedCart[existingIndex].discount;
      setCart(updatedCart);
    } else {
      const itemSubtotal = Number(quantity) * Number(price) - Number(itemDiscount);
      setCart((prev) => [
        ...prev,
        {
          product: selectedProductId,
          productName: selectedProduct?.name || 'Product',
          sku: selectedProduct?.sku || '',
          quantity: Number(quantity),
          price: Number(price || 0),
          discount: Number(itemDiscount || 0),
          subtotal: itemSubtotal,
        },
      ]);
    }

    // Reset line state
    setSelectedProductId('');
    setQuantity(1);
    setPrice('');
    setItemDiscount(0);
    toast.success('Product added to cart');
  };

  // Simulate a barcode scanner (typing SKU/Barcode and pressing Enter)
  const handleBarcodeScan = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const p = products.find(
      (item) =>
        (item.sku && item.sku.toLowerCase() === barcodeInput.trim().toLowerCase()) ||
        (item.barcode && item.barcode.trim() === barcodeInput.trim())
    );

    if (p) {
      if (p.quantity <= 0) {
        toast.error(`Product "${p.name}" is out of stock!`);
        setBarcodeInput('');
        return;
      }

      const existingIdx = cart.findIndex((item) => item.product === p._id);
      if (existingIdx !== -1) {
        const newQty = cart[existingIdx].quantity + 1;
        if (p.quantity < newQty) {
          toast.error(`Insufficient stock! Cannot add more of "${p.name}".`);
          setBarcodeInput('');
          return;
        }
        const updated = [...cart];
        updated[existingIdx].quantity = newQty;
        updated[existingIdx].subtotal = newQty * p.price - updated[existingIdx].discount;
        setCart(updated);
      } else {
        setCart((prev) => [
          ...prev,
          {
            product: p._id,
            productName: p.name,
            sku: p.sku,
            quantity: 1,
            price: p.price,
            discount: 0,
            subtotal: p.price,
          },
        ]);
      }
      toast.success(`Scanned: ${p.name}`);
    } else {
      toast.error(`No product found with SKU/Barcode: "${barcodeInput}"`);
    }
    setBarcodeInput('');
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
    toast.success('Product removed from cart');
  };

  // Calculate totals
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return Math.max(cartSubtotal + Number(tax) - Number(discount), 0);
  }, [cartSubtotal, tax, discount]);

  // Submit Sale Order
  const handleCreateSale = async () => {
    try {
      if (!selectedCustomer) {
        toast.error('Please select a customer');
        return;
      }
      if (cart.length === 0) {
        toast.error('Cart is empty. Add products first.');
        return;
      }

      const response = await salesAPI.create({
        customer: selectedCustomer,
        items: cart.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
        })),
        tax: Number(tax),
        discount: Number(discount),
        paymentMethod,
        paymentStatus,
        notes,
      });

      if (response.success) {
        toast.success('Sale transaction recorded successfully!');
        // Reset state
        setSelectedCustomer('');
        setPaymentMethod('cash');
        setPaymentStatus('completed');
        setNotes('');
        setTax(0);
        setDiscount(0);
        setCart([]);
        loadSales();
        // Refresh products list for updated stock levels
        const productRes = await productsAPI.getAll({ limit: 1000 });
        if (productRes.success) setProducts(productRes.data.products || []);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to record sale');
    }
  };

  // View Sale Details
  const handleViewSale = async (id) => {
    try {
      const res = await salesAPI.getById(id);
      if (res.success) {
        setCurrentSale(res.data);
        setOpenDetailDialog(true);
      }
    } catch (err) {
      toast.error('Failed to load transaction details');
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

  // Generate and Download Invoice PDF
  const handleDownloadPDF = () => {
    const input = document.getElementById('invoice-capture');
    if (!input) return;

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size width in mm
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
      pdf.save(`Invoice_${currentSale.saleNumber}.pdf`);
    });
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Sales & Invoice Management
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column - New Sale / POS Cart */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                <CartIcon sx={{ mr: 1, color: 'primary.main' }} /> POS Terminal / New Sale
              </Typography>

              <Grid container spacing={2}>
                {/* Customer Details */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Select Customer"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    required
                  >
                    {customers.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.name} ({c.phone})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    label="Payment Method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="upi">UPI/QR Code</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
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
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Scan SKU or Barcode (Instant Add)
                  </Typography>
                  <form onSubmit={handleBarcodeScan} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Simulate Barcode Scan (e.g. SKU or Barcode)"
                      placeholder="Type product SKU/Barcode and press Enter to instantly add..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                    />
                    <Button type="submit" variant="contained" color="secondary" sx={{ textTransform: 'none', px: 3 }}>
                      Scan
                    </Button>
                  </form>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Or Browse & Add Products Manually
                  </Typography>
                </Grid>

                {/* Product Select details */}
                <Grid item xs={12} sm={5}>
                  <TextField
                    select
                    fullWidth
                    label="Product SKU / Name"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    {products.map((p) => (
                      <MenuItem key={p._id} value={p._id} disabled={p.quantity <= 0}>
                        {p.name} (SKU: {p.sku}) {p.quantity <= 0 ? '[OUT OF STOCK]' : `[Stock: ${p.quantity}]`}
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
                    label="Unit Price (₹)"
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
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

                {/* Cart Details */}
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
                        No items added to sale order yet.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Product Details</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Price</TableCell>
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
                              <TableCell align="right">₹{item.price.toFixed(2)}</TableCell>
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

                {/* Bill details */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tax Amount (₹)"
                    value={tax}
                    onChange={(e) => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Discount Amount (₹)"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
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
                        Subtotal: ₹{cartSubtotal.toFixed(2)} | Tax: +₹{Number(tax).toFixed(2)} | Discount: -₹{Number(discount).toFixed(2)}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                        Total Amount: ₹{cartTotal.toFixed(2)}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCreateSale}
                      disabled={!selectedCustomer || cart.length === 0}
                      sx={{ textTransform: 'none', px: 4, py: 1.2, fontWeight: 700 }}
                    >
                      Complete Sale
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Sales History list */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} /> Sales Transaction Log
              </Typography>

              <TextField
                fullWidth
                size="small"
                label="Search Sales (Sale No, Customer...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TableContainer component={Paper} variant="outlined" sx={{ flexGrow: 1, maxHeight: 450 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Sale No</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((sale) => (
                      <TableRow key={sale._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {sale.saleNumber}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{sale.customer?.name || 'Walk-in'}</Typography>
                          <Chip
                            label={sale.paymentStatus}
                            color={sale.paymentStatus === 'completed' ? 'success' : 'warning'}
                            size="small"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        </TableCell>
                        <TableCell align="right">₹{sale.totalAmount?.toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Invoice">
                            <IconButton size="small" color="primary" onClick={() => handleViewSale(sale._id)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                          No sales transactions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 20]}
                component="div"
                count={sales.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoice Detail / PDF generation Modal */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Sales Invoice Details
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
          {currentSale && (
            <Box id="invoice-capture" sx={{ p: 3, bgcolor: '#fff', color: '#333', fontFamily: 'Roboto, Arial' }}>
              {/* Invoice Header */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    INVOICE
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Enterprise Smart Inventory System
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {currentSale.saleNumber}
                  </Typography>
                  <Typography variant="body2">
                    Date: {new Date(currentSale.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Time: {new Date(currentSale.createdAt).toLocaleTimeString()}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Vendor & Client Details */}
              <Grid container spacing={2} sx={{ mb: 4, mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'textSecondary' }}>
                    CLIENT DETAILS
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {currentSale.customer?.name || 'Walk-in Customer'}
                  </Typography>
                  {currentSale.customer?.phone && (
                    <Typography variant="body2">Phone: {currentSale.customer.phone}</Typography>
                  )}
                  {currentSale.customer?.email && (
                    <Typography variant="body2">Email: {currentSale.customer.email}</Typography>
                  )}
                  {currentSale.customer?.address && (
                    <Typography variant="body2">Address: {currentSale.customer.address}</Typography>
                  )}
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'textSecondary' }}>
                    TRANSACTION SUMMARY
                  </Typography>
                  <Typography variant="body2">
                    Payment Method: <b>{currentSale.paymentMethod?.toUpperCase()}</b>
                  </Typography>
                  <Typography variant="body2">
                    Payment Status: <b>{currentSale.paymentStatus?.toUpperCase()}</b>
                  </Typography>
                  {currentSale.branch && (
                    <Typography variant="body2">Branch Reference: {currentSale.branch}</Typography>
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
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentSale.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {item.product?.name || 'Deleted Product'}
                        </TableCell>
                        <TableCell>{item.product?.sku || 'N/A'}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">₹{item.price?.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          ₹{((item.quantity || 0) * (item.price || 0) - (item.discount || 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Calculation Summary */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  {currentSale.notes && (
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                        NOTES / TERMS:
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {currentSale.notes}
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={6}>
                  <Stack spacing={1} sx={{ textAlign: 'right', pr: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Subtotal:</Typography>
                      <Typography variant="body2">₹{currentSale.subtotal?.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Tax:</Typography>
                      <Typography variant="body2">₹{currentSale.tax?.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Discount:</Typography>
                      <Typography variant="body2">-₹{currentSale.discount?.toFixed(2)}</Typography>
                    </Box>
                    <Divider sx={{ my: 0.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Amount:</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        ₹{currentSale.totalAmount?.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              <Box sx={{ mt: 5, textAlign: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  Thank you for your business! For any issues, contact support@example.com
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
