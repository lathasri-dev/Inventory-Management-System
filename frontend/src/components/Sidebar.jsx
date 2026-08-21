import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  LocalShipping as SuppliersIcon,
  People as CustomersIcon,
  ShoppingCart as SalesIcon,
  Receipt as PurchasesIcon,
  BarChart as ReportsIcon,
  Settings as SettingsIcon,
  PeopleAlt as UsersIcon,
  History as StockIcon,
  ShieldOutlined as SecurityIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useRedux';
import { normalizeRole, ROLE_IDS } from '../utils/roles';

const menuItems = [
  { label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
  { label: 'Products', icon: InventoryIcon, path: '/products' },
  { label: 'Categories', icon: CategoryIcon, path: '/categories' },
  { label: 'Stock Control', icon: StockIcon, path: '/stock-control' },
  { label: 'Suppliers', icon: SuppliersIcon, path: '/suppliers' },
  { label: 'Customers', icon: CustomersIcon, path: '/customers' },
  { label: 'Sales', icon: SalesIcon, path: '/sales' },
  { label: 'Purchases', icon: PurchasesIcon, path: '/purchases' },
  { label: 'Reports', icon: ReportsIcon, path: '/reports' },
  { label: 'Users', icon: UsersIcon, path: '/users' },
  { label: 'Audit Logs', icon: SecurityIcon, path: '/audit-logs' },
  { label: 'Settings', icon: SettingsIcon, path: '/settings' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isAdmin = role === ROLE_IDS.SUPER_ADMIN || role === ROLE_IDS.ADMIN;

  const visibleItems = menuItems.filter((item) => {
    if (item.path === '/users' || item.path === '/audit-logs' || item.path === '/settings') {
      return isAdmin;
    }
    return true;
  });

  return (
    <Box sx={{ p: 2.25, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header */}
      <Box
        sx={{
          mb: 3,
          px: 1,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.2)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Atlas Inventory
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: '#10b981',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(0.9)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)' },
                  '70%': { transform: 'scale(1)', boxShadow: '0 0 0 4px rgba(16, 185, 129, 0)' },
                  '100%': { transform: 'scale(0.9)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
                }
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
              System Live
            </Typography>
          </Stack>
        </Box>
      </Box>

      <List sx={{ flex: 1, px: 0.5 }}>
        {visibleItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            end={item.path === '/'}
            sx={{
              borderRadius: '8px',
              mb: 0.5,
              px: 1.75,
              py: 1,
              transition: 'all 0.15s ease',
              color: 'text.secondary',
              '&.active': {
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(45,212,191,0.08)' : 'rgba(15,118,110,0.06)',
                color: 'primary.main',
                '& .MuiListItemIcon-root': {
                  color: 'primary.main',
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 700,
                }
              },
              '&:hover': {
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)',
                color: 'text.primary',
                '& .MuiListItemIcon-root': {
                  color: 'text.primary',
                }
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 35, color: 'inherit' }}>
              <item.icon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ fontSize: '0.92rem', fontWeight: 600 }} 
            />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary" sx={{ px: 1, display: 'block', opacity: 0.8 }}>
        Use the sidebar to manage inventory, orders, and reporting.
      </Typography>
    </Box>
  );
}
