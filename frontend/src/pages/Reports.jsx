import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Chip,
  Rating,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingIcon,
  People as PeopleIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { reportsAPI } from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'];

export default function Reports() {
  const [tabIndex, setTabIndex] = useState(0);

  // Report data states
  const [revenueData, setRevenueData] = useState({ revenue: 0, salesCount: 0 });
  const [inventoryData, setInventoryData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [customerData, setCustomerData] = useState([]);

  // Fetch report data on mount/tab change
  useEffect(() => {
    const fetchAllData = async () => {
      const [revRes, invRes, salesRes, supRes, custRes] = await Promise.allSettled([
        reportsAPI.generateRevenueReport('json'),
        reportsAPI.generateInventoryReport('json'),
        reportsAPI.generateSalesReport('json'),
        reportsAPI.generateSupplierReport('json'),
        reportsAPI.generateCustomerReport('json'),
      ]);

      if (revRes.status === 'fulfilled' && revRes.value?.success) {
        setRevenueData(revRes.value.data || { revenue: 0, salesCount: 0 });
      }
      if (invRes.status === 'fulfilled' && invRes.value?.success) {
        setInventoryData(invRes.value.data || []);
      }
      if (salesRes.status === 'fulfilled' && salesRes.value?.success) {
        setSalesData(salesRes.value.data || []);
      }
      if (supRes.status === 'fulfilled' && supRes.value?.success) {
        setSupplierData(supRes.value.data || []);
      }
      if (custRes.status === 'fulfilled' && custRes.value?.success) {
        setCustomerData(custRes.value.data || []);
      }

      // Only show a single warning if ALL requests failed
      const allFailed = [revRes, invRes, salesRes, supRes, custRes].every(
        (r) => r.status === 'rejected' || !r.value?.success
      );
      if (allFailed) {
        toast.error('Could not load report data. Check your permissions or backend connection.');
      }
    };
    fetchAllData();
  }, []);

  // Compute values for inventory
  const totalValue = inventoryData.reduce(
    (sum, prod) => sum + (prod.price || 0) * (prod.quantity || 0),
    0
  );

  const lowStockCount = inventoryData.filter(
    (prod) => prod.quantity <= prod.reorderLevel && prod.quantity > 0
  ).length;

  const outOfStockCount = inventoryData.filter((prod) => prod.quantity === 0).length;

  // Chart data preps
  const categoryChartData = Object.values(
    inventoryData.reduce((acc, curr) => {
      const catName = curr.category?.name || 'Unclassified';
      if (!acc[catName]) acc[catName] = { name: catName, value: 0 };
      acc[catName].value += (curr.price || 0) * (curr.quantity || 0);
      return acc;
    }, {})
  );

  const topCustomersChart = customerData.slice(0, 5).map((cust) => ({
    name: cust.name,
    spent: cust.totalSpent || 0,
  }));

  // Client Side Exports
  const handleExportExcel = (data, sheetName, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }
    const cleanData = data.map((item) => {
      // Flatten populated subdocs for cleaner excel
      const output = { ...item };
      if (item.category) output.category = item.category.name || item.category;
      if (item.supplier) output.supplier = item.supplier.name || item.supplier;
      if (item.customer) output.customer = item.customer.name || item.customer;
      delete output._id;
      delete output.__v;
      return output;
    });

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    toast.success('Spreadsheet exported successfully!');
  };

  const handleExportCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }
    const cleanData = data.map((item) => {
      const output = { ...item };
      if (item.category) output.category = item.category.name || item.category;
      if (item.supplier) output.supplier = item.supplier.name || item.supplier;
      if (item.customer) output.customer = item.customer.name || item.customer;
      delete output._id;
      delete output.__v;
      return output;
    });

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    toast.success('CSV log exported successfully!');
  };

  const handleExportPDF = (title, rows, filename) => {
    if (!rows || rows.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 14;
    let cursorY = margin;

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, cursorY);
    cursorY += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, cursorY);
    cursorY += 8;

    rows.slice(0, 25).forEach((row, index) => {
      const values = Object.entries(row)
        .filter(([key]) => !['_id', '__v'].includes(key))
        .slice(0, 4)
        .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join(' | ');

      const text = `${index + 1}. ${values}`;
      const splitText = pdf.splitTextToSize(text, 180);

      if (cursorY + splitText.length * 5 > 280) {
        pdf.addPage();
        cursorY = margin;
      }

      pdf.text(splitText, margin, cursorY);
      cursorY += splitText.length * 5 + 2;
    });

    pdf.save(`${filename}.pdf`);
    toast.success('PDF exported successfully!');
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Reports & Business Intelligence
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Analyze sales performance, inventory turnover levels, customer spend ratios, and vendor performance.
        </Typography>
      </Box>

      {/* Analytics Tabs */}
      <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} sx={{ mb: 3 }}>
        <Tab label="Sales & Revenue" icon={<TrendingIcon />} iconPosition="start" />
        <Tab label="Stock & Inventory" icon={<InventoryIcon />} iconPosition="start" />
        <Tab label="Customer Intelligence" icon={<PeopleIcon />} iconPosition="start" />
        <Tab label="Supplier Logs" icon={<ShippingIcon />} iconPosition="start" />
      </Tabs>

      {/* TAB 0 - SALES & REVENUE */}
      {tabIndex === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                  Gross revenue
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  ₹{(revenueData.revenue || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                  Total Transactions
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {revenueData.salesCount || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                  Average Order Value
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  ₹
                  {revenueData.salesCount
                    ? Math.round(revenueData.revenue / revenueData.salesCount).toLocaleString()
                    : 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                  Export Options
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExportExcel(salesData, 'Sales', 'sales_report')}
                  >
                    Excel
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleExportCSV(salesData, 'sales_report')}
                  >
                    CSV
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleExportPDF('Sales Report', salesData, 'sales_report')}
                  >
                    PDF
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Daily Revenue Performance
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={salesData.slice(-10).map((s) => ({
                      date: new Date(s.createdAt).toLocaleDateString(),
                      amount: s.totalAmount || 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#667eea" strokeWidth={2} name="Order total (₹)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Transaction Split
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Cash Sales</TableCell>
                        <TableCell align="right">
                          {salesData.filter((s) => s.paymentMethod === 'cash').length}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>UPI/QR Payments</TableCell>
                        <TableCell align="right">
                          {salesData.filter((s) => s.paymentMethod === 'upi').length}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Card Transactions</TableCell>
                        <TableCell align="right">
                          {salesData.filter((s) => s.paymentMethod === 'card').length}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Bank Transfers</TableCell>
                        <TableCell align="right">
                          {salesData.filter((s) => s.paymentMethod === 'bank_transfer').length}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 1 - INVENTORY & STOCK */}
      {tabIndex === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                  Total Stock Value
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  ₹{totalValue.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                  Low Stock warnings
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'warning.main' }}>
                  {lowStockCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                  Out of Stock items
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main' }}>
                  {outOfStockCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                  Export Options
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExportExcel(inventoryData, 'Inventory', 'inventory_report')}
                  >
                    Excel
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleExportCSV(inventoryData, 'inventory_report')}
                  >
                    CSV
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleExportPDF('Inventory Report', inventoryData, 'inventory_report')}
                  >
                    PDF
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Stock Value Spread by Category
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#764ba2" name="Stock Value (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Top Alerts (Low Stock)
                </Typography>
                <TableContainer sx={{ maxHeight: 250 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>SKU / Name</TableCell>
                        <TableCell align="right">Qty</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryData
                        .filter((p) => p.quantity <= p.reorderLevel)
                        .slice(0, 5)
                        .map((prod) => (
                          <TableRow key={prod._id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {prod.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                SKU: {prod.sku}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={prod.quantity}
                                color={prod.quantity === 0 ? 'error' : 'warning'}
                                size="small"
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 2 - CUSTOMER INTELLIGENCE */}
      {tabIndex === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Top Spender Performance
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topCustomersChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="spent" fill="#00f2fe" name="Total Spent (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Segment Exports
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportExcel(customerData, 'Customers', 'customers_report')}
                >
                  Download Customer Directory
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleExportCSV(customerData, 'customers_report')}
                >
                  Export Customer CSV
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleExportPDF('Customer Report', customerData, 'customers_report')}
                >
                  Export Customer PDF
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleExportPDF('Customer Report', customerData, 'customers_report')}
                >
                  Export Customer PDF
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Client Leaderboard
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Purchases Count</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Total Spent</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerData.slice(0, 10).map((c) => (
                        <TableRow key={c._id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                          <TableCell>{c.email}</TableCell>
                          <TableCell align="right">{c.totalPurchases || 0}</TableCell>
                          <TableCell align="right">₹{(c.totalSpent || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 3 - SUPPLIERS REPORT */}
      {tabIndex === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Supplier Intel Export
                </Typography>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportExcel(supplierData, 'Suppliers', 'suppliers_report')}
                >
                  Export Supplier Directory
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleExportCSV(supplierData, 'suppliers_report')}
                >
                  Export CSV Logs
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Vendor Summary Log
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Company Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>GST Ref</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Performance Rating</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Products Supplied</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {supplierData.map((s) => (
                        <TableRow key={s._id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.companyName || s.name}</Typography>
                            <Typography variant="caption" color="textSecondary">{s.name}</Typography>
                          </TableCell>
                          <TableCell>{s.gstNumber}</TableCell>
                          <TableCell>
                            <Rating value={s.rating || 0} readOnly size="small" />
                          </TableCell>
                          <TableCell align="right">{s.products?.length || 0}</TableCell>
                        </TableRow>
                      ))}
                      {supplierData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            No supplier records available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
