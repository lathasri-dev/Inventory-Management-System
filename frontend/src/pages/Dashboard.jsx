import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  useTheme,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  LocalShipping as SupplierIcon,
  People as CustomersIcon,
  ShoppingCart as SalesIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { dashboardAPI } from '../services/api';

const emptySeries = [];

// Curated SaaS colors
const STOCK_COLORS = ['#fbbf24', '#ef4444', '#10b981']; // Warning (Low), Error (Out), Success (Healthy)
const BAR_COLOR = '#14b8a6'; // Teal primary

// Elegant Stat Card
const StatCard = ({ icon: Icon, title, value, color, subtitle, action, onAction }) => (
  <Card
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid',
      borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
      boxShadow: 'none',
      transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: (theme) => theme.palette.mode === 'dark'
          ? `0 10px 30px -10px rgba(0,0,0,0.5), 0 0 0 1px ${color}33`
          : `0 10px 25px -10px rgba(15,23,42,0.08), 0 0 0 1px ${color}33`,
      },
    }}
  >
    {/* Subtle top accent bar */}
    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: color }} />
    
    <CardContent sx={{ p: 2.5, pt: 3, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.82rem' }}>
          {title}
        </Typography>
        <Box 
          sx={{ 
            backgroundColor: `${color}10`, 
            p: 1, 
            borderRadius: '8px', 
            display: 'flex',
            border: '1px solid',
            borderColor: `${color}20`,
          }}
        >
          <Icon sx={{ color, fontSize: 18 }} />
        </Box>
      </Box>

      <Typography sx={{ fontSize: '1.875rem', fontWeight: 800, mb: 0.5, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
        {value}
      </Typography>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 500 }}>
          {subtitle}
        </Typography>
        {action && (
          <Button
            size="small"
            onClick={onAction}
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              p: 0,
              minWidth: 'auto',
              color: 'primary.main',
              textTransform: 'none',
              '&:hover': { background: 'none', textDecoration: 'underline' }
            }}
          >
            {action}
          </Button>
        )}
      </Stack>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [revenueData, setRevenueData] = useState(emptySeries);
  const [topProducts, setTopProducts] = useState(emptySeries);
  const [categoryData, setCategoryData] = useState(emptySeries);
  const recentActivities = stats.recentActivities || [];
  const recentNotifications = stats.recentNotifications || [];

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardAPI.getStats();
      if (response.success) {
        setStats(response.data);
        
        // Populate top selling products
        setTopProducts(
          (response.data.topSellingProducts || []).map((item) => ({
            name: item._id ? (item._id.name || 'Product') : 'Product',
            sales: item.totalSold || 0,
          }))
        );

        // Populate revenue trend
        setRevenueData([
          { name: 'Monthly Revenue', revenue: response.data.monthlyRevenue || 0, target: response.data.monthlyRevenue * 0.85 || 0 },
          { name: 'Today\'s Sales', revenue: response.data.todaySales || 0, target: response.data.todaySales * 0.90 || 0 }
        ]);

        // Populate stock health chart
        setCategoryData([
          { name: 'Low Stock', value: response.data.lowStockProducts || 0 },
          { name: 'Out of Stock', value: response.data.outOfStockProducts || 0 },
          { name: 'Healthy', value: Math.max((response.data.totalProducts || 0) - (response.data.lowStockProducts || 0) - (response.data.outOfStockProducts || 0), 0) },
        ]);
      }
      setIsLoading(false);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch dashboard data');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Format currency value helper
  const formatCurrency = (val) => {
    return `₹${(val || 0).toLocaleString('en-IN')}`;
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
            Operations Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of catalog statistics, revenue totals, logistics notifications, and ledger alerts.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={fetchDashboardData}
            disabled={isLoading}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Refresh
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.href = '/products'}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            + Add Product
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={() => window.location.href = '/suppliers'}
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            + Add Supplier
          </Button>
        </Stack>
      </Box>

      {/* Grid of cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={InventoryIcon}
            title="Active Products"
            value={stats.totalProducts || 0}
            color="#14b8a6"
            subtitle="Registered items"
            action="View Catalog"
            onAction={() => window.location.href = '/products'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={CategoryIcon}
            title="Total Categories"
            value={stats.totalCategories || 0}
            color="#6366f1"
            subtitle="Sections created"
            action="Manage"
            onAction={() => window.location.href = '/categories'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={SupplierIcon}
            title="Managed Suppliers"
            value={stats.totalSuppliers || 0}
            color="#8b5cf6"
            subtitle="Active partners"
            action="View Suppliers"
            onAction={() => window.location.href = '/suppliers'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={CustomersIcon}
            title="Customer Profiles"
            value={stats.totalCustomers || 0}
            color="#0ea5e9"
            subtitle="Active accounts"
            action="View Customers"
            onAction={() => window.location.href = '/customers'}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={SalesIcon}
            title="Pending Orders"
            value={stats.pendingOrders || 0}
            color="#f59e0b"
            subtitle="Awaiting processing"
            action="Sales Ledger"
            onAction={() => window.location.href = '/sales'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={InventoryIcon}
            title="Stock Valuation"
            value={formatCurrency(stats.totalInventoryValue)}
            color="#10b981"
            subtitle="Asset market value"
            action="Audit Ledger"
            onAction={() => window.location.href = '/stock-control'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={TrendingIcon}
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            color="#ec4899"
            subtitle="Current calendar month"
            action="View Reports"
            onAction={() => window.location.href = '/reports'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={TrendingIcon}
            title="Today's Billings"
            value={formatCurrency(stats.todaySales)}
            color="#06b6d4"
            subtitle="Billings generated today"
          />
        </Grid>
      </Grid>

      {/* Main Charts block */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Left Chart - Revenue details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Monthly Revenue vs Target Trend
            </Typography>
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="4 4" stroke={isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    cursor={{ fill: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 118, 110, 0.03)', radius: [6, 6, 0, 0] }}
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
                      borderRadius: '8px',
                      boxShadow: isDarkMode ? '0 10px 25px -5px rgba(0,0,0,0.4)' : '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontFamily: 'inherit',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                    formatter={(value) => [formatCurrency(value), undefined]}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Actual Revenue" />
                  <Bar dataKey="target" fill="#6366f1" radius={[6, 6, 0, 0]} name="Baseline Target" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Right Chart - Stock distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Stock Level Distribution
            </Typography>
            <Box sx={{ height: 320, display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center' }}>
              {(() => {
                const isPieEmpty = categoryData.every(d => d.value === 0);
                const pieData = isPieEmpty 
                  ? [{ name: 'No Alerts Active', value: 1 }] 
                  : categoryData.filter(d => d.value > 0);
                const pieColors = isPieEmpty
                  ? [isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)']
                  : categoryData.filter(d => d.value > 0).map(entry => {
                      const entryIndex = categoryData.findIndex(d => d.name === entry.name);
                      return STOCK_COLORS[entryIndex % STOCK_COLORS.length];
                    });

                return (
                  <Box sx={{ position: 'relative', width: '100%', height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={85}
                          paddingAngle={isPieEmpty ? 0 : 3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          disabled={isPieEmpty}
                          contentStyle={{
                            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
                            borderRadius: '8px',
                            boxShadow: isDarkMode ? '0 10px 25px -5px rgba(0,0,0,0.4)' : '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
                            color: isDarkMode ? '#f8fafc' : '#0f172a',
                            fontFamily: 'inherit',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>
                        {isPieEmpty ? '0' : stats.totalProducts || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.5, display: 'block' }}>
                        Total Items
                      </Typography>
                    </Box>
                  </Box>
                );
              })()}
              <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                {categoryData.map((item, idx) => (
                  <Stack key={item.name} direction="row" spacing={0.5} alignItems="center">
                    <Box sx={{ width: 8, height: 8, bgcolor: STOCK_COLORS[idx], borderRadius: '50%' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      {item.name}: {item.value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Second block - Sales details & Low stock alerts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Top selling products bar chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Top Selling Products
            </Typography>
            <Box sx={{ height: 300 }}>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="4 4" stroke={isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} />
                    <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={90} />
                    <Tooltip 
                      cursor={{ fill: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 118, 110, 0.03)', radius: [0, 6, 6, 0] }}
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
                        borderRadius: '8px',
                        boxShadow: isDarkMode ? '0 10px 25px -5px rgba(0,0,0,0.4)' : '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
                        color: isDarkMode ? '#f8fafc' : '#0f172a',
                        fontFamily: 'inherit',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="sales" fill={BAR_COLOR} radius={[0, 6, 6, 0]} name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    No sales orders recorded yet.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Low Stock and expiring alerts panel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Critical Inventory Alerts
            </Typography>
            <Stack spacing={2} sx={{ flex: 1, justifyContent: 'center' }}>
              {/* Out of Stock Alert */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                  border: '1px solid',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.2)' : '#fca5a5',
                  borderRadius: 2,
                }}
              >
                <ErrorIcon sx={{ color: '#ef4444', mr: 2 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: (theme) => theme.palette.mode === 'dark' ? '#fca5a5' : '#7f1d1d' }}>
                    {stats.outOfStockProducts || 0} Products Out of Stock
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Requires immediate stock replenishment.
                  </Typography>
                </Box>
              </Box>

              {/* Low Stock Alert */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245,158,11,0.1)' : '#fffbeb',
                  border: '1px solid',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245,158,11,0.2)' : '#fde68a',
                  borderRadius: 2,
                }}
              >
                <WarningIcon sx={{ color: '#f59e0b', mr: 2 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: (theme) => theme.palette.mode === 'dark' ? '#fde68a' : '#78350f' }}>
                    {stats.lowStockProducts || 0} Products at Reorder Level
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Items are below target thresholds.
                  </Typography>
                </Box>
              </Box>

              {/* Expiring Soon Alert */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.1)' : '#eef2ff',
                  border: '1px solid',
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.2)' : '#c7d2fe',
                  borderRadius: 2,
                }}
              >
                <SuccessIcon sx={{ color: '#6366f1', mr: 2 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: (theme) => theme.palette.mode === 'dark' ? '#c7d2fe' : '#312e81' }}>
                    {stats.expiringSoonProducts || 0} Products Expiring Soon
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Items expiring within the next 30 days.
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Activity Logs & Notifications row */}
      <Grid container spacing={3}>
        {/* Recent actions log */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Recent Console Activities
            </Typography>
            <Stack spacing={1.5}>
              {recentActivities.slice(0, 4).map((activity, index) => (
                <Paper key={activity._id || index} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {activity.action}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Module: <strong>{activity.module || 'system'}</strong> · Performed by: {activity.user?.fullName || 'System Account'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                    {new Date(activity.createdAt).toLocaleString()}
                  </Typography>
                </Paper>
              ))}
              {recentActivities.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                  No recent activities recorded.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Notifications log */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Recent System Notifications
            </Typography>
            <Stack spacing={1.5}>
              {recentNotifications.slice(0, 4).map((notif, index) => (
                <Paper key={notif._id || index} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {notif.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {notif.message || notif.body}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </Typography>
                </Paper>
              ))}
              {recentNotifications.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                  No recent notifications recorded.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
