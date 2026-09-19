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
  Divider,
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
  AddBox as AddBoxIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../hooks/useRedux';
import { ROLE_IDS, normalizeRole } from '../utils/roles';

// Custom Elegant Stat Card
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
    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: color }} />
    <CardContent sx={{ p: 2.5, pt: 3, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.82rem' }}>
          {title}
        </Typography>
        <Box sx={{ backgroundColor: `${color}10`, p: 1, borderRadius: '8px', display: 'flex', border: '1px solid', borderColor: `${color}20` }}>
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
          <Button size="small" onClick={onAction} sx={{ fontSize: '0.72rem', fontWeight: 700, p: 0, minWidth: 'auto', color: 'primary.main', textTransform: 'none', '&:hover': { background: 'none', textDecoration: 'underline' } }}>
            {action}
          </Button>
        )}
      </Stack>
    </CardContent>
  </Card>
);

// Quick Action Button
const QuickActionButton = ({ icon: Icon, label, onClick, color = "primary" }) => (
  <Button
    variant="outlined"
    color={color}
    onClick={onClick}
    startIcon={<Icon />}
    sx={{ fontWeight: 600, borderRadius: 2, textTransform: 'none', px: 3, py: 1.2 }}
  >
    {label}
  </Button>
);

// ----------------------------------------------------------------------
// ADMIN DASHBOARD
// ----------------------------------------------------------------------
const AdminDashboard = ({ stats, formatCurrency, onRefresh }) => {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>System Administration</Typography>
          <Typography variant="body2" color="text.secondary">Manage the entire system, users, and overall inventory.</Typography>
        </Box>
        <Button variant="outlined" onClick={onRefresh}>Refresh</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 4, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'text.secondary' }}>QUICK ACTIONS</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <QuickActionButton icon={AddBoxIcon} label="Add Product" onClick={() => window.location.href = '/products'} />
          <QuickActionButton icon={CustomersIcon} label="Add User" onClick={() => window.location.href = '/users'} color="secondary" />
          <QuickActionButton icon={InventoryIcon} label="Stock In" onClick={() => window.location.href = '/purchases'} color="success" />
          <QuickActionButton icon={SalesIcon} label="Stock Out" onClick={() => window.location.href = '/sales'} color="warning" />
          <QuickActionButton icon={AssessmentIcon} label="View Reports" onClick={() => window.location.href = '/reports'} color="info" />
        </Stack>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={InventoryIcon} title="Total Products" value={stats.totalProducts || 0} color="#14b8a6" subtitle="Catalog items" action="View" onAction={() => window.location.href = '/products'} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={CustomersIcon} title="Total Users" value={stats.totalUsers || 0} color="#3b82f6" subtitle="System Accounts" action="Manage" onAction={() => window.location.href = '/users'} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={SupplierIcon} title="Total Suppliers" value={stats.totalSuppliers || 0} color="#8b5cf6" subtitle="Active suppliers" action="View" onAction={() => window.location.href = '/suppliers'} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={CustomersIcon} title="Total Customers" value={stats.totalCustomers || 0} color="#0ea5e9" subtitle="Registered clients" /></Grid>
        
        <Grid item xs={12} sm={6} md={3}><StatCard icon={TrendingIcon} title="Inventory Value" value={formatCurrency(stats.totalInventoryValue)} color="#10b981" subtitle="Total market value" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={WarningIcon} title="Low Stock" value={stats.lowStockProducts || 0} color="#f59e0b" subtitle="Below reorder level" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={ErrorIcon} title="Out of Stock" value={stats.outOfStockProducts || 0} color="#ef4444" subtitle="Zero quantity" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={InventoryIcon} title="Today's Stock In" value={stats.purchaseOrders || 0} color="#ec4899" subtitle="Purchases today" /></Grid>
      </Grid>
      
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Recent System Activity</Typography>
        <Stack spacing={1.5}>
          {(stats.recentActivities || []).slice(0, 5).map((activity, idx) => (
            <Box key={idx} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{activity.action}</Typography>
              <Typography variant="caption" color="text.secondary">{activity.module} · {new Date(activity.createdAt).toLocaleString()}</Typography>
            </Box>
          ))}
          {(!stats.recentActivities || stats.recentActivities.length === 0) && (
            <Typography variant="body2" color="text.secondary">No recent activities.</Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

// ----------------------------------------------------------------------
// MANAGER DASHBOARD
// ----------------------------------------------------------------------
const ManagerDashboard = ({ stats, formatCurrency, onRefresh }) => {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Inventory Management</Typography>
          <Typography variant="body2" color="text.secondary">Oversee catalog, monitor stock levels, and handle daily purchases.</Typography>
        </Box>
        <Button variant="outlined" onClick={onRefresh}>Refresh</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 4, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'text.secondary' }}>QUICK ACTIONS</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <QuickActionButton icon={InventoryIcon} label="Stock In" onClick={() => window.location.href = '/purchases'} color="success" />
          <QuickActionButton icon={SalesIcon} label="Stock Out" onClick={() => window.location.href = '/sales'} color="warning" />
          <QuickActionButton icon={AddBoxIcon} label="Add Product" onClick={() => window.location.href = '/products'} />
          <QuickActionButton icon={WarningIcon} label="View Low Stock" onClick={() => window.location.href = '/stock-control'} color="error" />
          <QuickActionButton icon={HistoryIcon} label="Stock History" onClick={() => window.location.href = '/reports'} color="info" />
        </Stack>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={InventoryIcon} title="Total Products" value={stats.totalProducts || 0} color="#14b8a6" subtitle="Items in catalog" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={InventoryIcon} title="Stock Value" value={formatCurrency(stats.totalInventoryValue)} color="#10b981" subtitle="Current inventory value" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={WarningIcon} title="Low Stock" value={stats.lowStockProducts || 0} color="#f59e0b" subtitle="Needs reorder" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={ErrorIcon} title="Out of Stock" value={stats.outOfStockProducts || 0} color="#ef4444" subtitle="Zero stock available" /></Grid>
        
        <Grid item xs={12} sm={6} md={4}><StatCard icon={InventoryIcon} title="Today's Stock In" value={stats.purchaseOrders || 0} color="#ec4899" subtitle="New stock added today" /></Grid>
        <Grid item xs={12} sm={6} md={4}><StatCard icon={SalesIcon} title="Today's Stock Out" value={formatCurrency(stats.todaySales)} color="#06b6d4" subtitle="Value of stock out today" /></Grid>
      </Grid>
    </Box>
  );
};

// ----------------------------------------------------------------------
// USER / STAFF DASHBOARD
// ----------------------------------------------------------------------
const UserDashboard = ({ stats, formatCurrency, onRefresh }) => {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Daily Operations</Typography>
          <Typography variant="body2" color="text.secondary">View catalog, check stock levels, and log your stock out transactions.</Typography>
        </Box>
        <Button variant="outlined" onClick={onRefresh}>Refresh</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 4, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'text.secondary' }}>QUICK ACTIONS</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <QuickActionButton icon={InventoryIcon} label="View Products" onClick={() => window.location.href = '/products'} />
          <QuickActionButton icon={AssessmentIcon} label="Check Stock" onClick={() => window.location.href = '/products'} color="info" />
          <QuickActionButton icon={SalesIcon} label="Stock Out" onClick={() => window.location.href = '/sales'} color="warning" />
          <QuickActionButton icon={HistoryIcon} label="My Transactions" onClick={() => window.location.href = '/sales'} color="secondary" />
        </Stack>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}><StatCard icon={InventoryIcon} title="Available Products" value={stats.totalProducts || 0} color="#14b8a6" subtitle="Items to browse" /></Grid>
        <Grid item xs={12} sm={6} md={4}><StatCard icon={WarningIcon} title="Low Stock Alerts" value={stats.lowStockProducts || 0} color="#f59e0b" subtitle="Products running low" /></Grid>
        <Grid item xs={12} sm={6} md={4}><StatCard icon={HistoryIcon} title="My Transactions Today" value={stats.todaySales ? "Recorded" : 0} color="#6366f1" subtitle="Your recent operations" /></Grid>
      </Grid>
      
      <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>My Recent Transactions</Typography>
        <Typography variant="body2" color="text.secondary">
          (Navigate to the Stock Out page to see the full list of your recorded transactions).
        </Typography>
      </Paper>
    </Box>
  );
};

// ----------------------------------------------------------------------
// MAIN DASHBOARD COMPONENT
// ----------------------------------------------------------------------
export default function Dashboard() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isAdmin = role === ROLE_IDS.ADMIN;
  const isManager = role === ROLE_IDS.MANAGER;
  const isUser = role === ROLE_IDS.USER;

  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({});

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await dashboardAPI.getStats();
      if (response.success) {
        setStats(response.data);
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

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  return (
    <Box sx={{ p: 1 }}>
      {isAdmin && <AdminDashboard stats={stats} formatCurrency={formatCurrency} onRefresh={fetchDashboardData} />}
      {isManager && <ManagerDashboard stats={stats} formatCurrency={formatCurrency} onRefresh={fetchDashboardData} />}
      {isUser && <UserDashboard stats={stats} formatCurrency={formatCurrency} onRefresh={fetchDashboardData} />}
    </Box>
  );
}
