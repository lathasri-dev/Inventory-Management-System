import React, { useMemo, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import apiClient from '../services/apiClient';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  useMediaQuery,
  Paper,
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Notifications,
  Logout,
  Settings,
  Search,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useRedux';
import { useNotifications } from '../hooks/useRedux';
import { useUI } from '../hooks/useRedux';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { toggleDarkMode, setSidebarOpen } from '../redux/slices/uiSlice';

const DRAWER_WIDTH = 280;

/**
 * Main Layout Component
 * Wraps all protected pages with header, sidebar, and footer
 */
export default function MainLayout() {
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await apiClient.get(`/search?q=${searchQuery}`);
        if (res.success) {
          setSearchResults(res.data);
          setShowSearchDropdown(true);
        }
        setIsSearching(false);
      } catch (err) {
        console.error('Global search error:', err);
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);
  const { unreadCount } = useNotifications();
  const { darkMode } = useUI();
  const dispatch = useDispatch();

  const initials = useMemo(() => {
    if (!user?.fullName) {
      return 'U';
    }

    return user.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name[0])
      .join('')
      .toUpperCase();
  }, [user?.fullName]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen((open) => !open);
      return;
    }

    dispatch(setSidebarOpen(true));
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          transition: 'all 0.25s ease',
          backgroundColor: darkMode ? 'rgba(15,23,42,0.78)' : 'rgba(255,255,255,0.78)',
          color: darkMode ? '#fff' : '#0f172a',
          backdropFilter: 'blur(18px)',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            color="inherit"
            onClick={handleDrawerToggle}
            sx={{ mr: 0.5 }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, maxWidth: 520, width: '100%', position: 'relative' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search products, suppliers, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            {showSearchDropdown && searchResults && (
              <Paper
                elevation={4}
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  mt: 1,
                  maxHeight: 400,
                  overflowY: 'auto',
                  zIndex: 2000,
                  p: 2,
                  bgcolor: darkMode ? '#1e293b' : '#ffffff',
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: darkMode ? '#334155' : '#e2e8f0',
                }}
              >
                {searchResults.products?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', mb: 1, textTransform: 'uppercase' }}>
                      Products
                    </Typography>
                    {searchResults.products.map(p => (
                      <Box key={p._id} sx={{ py: 0.75, px: 1, '&:hover': { bgcolor: darkMode ? '#334155' : '#f1f5f9' }, cursor: 'pointer', borderRadius: 1 }} onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); window.location.href = `/products`; }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                        <Typography variant="caption" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>SKU: {p.sku} | Qty: {p.quantity} | Price: ₹{p.price}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {searchResults.categories?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', mb: 1, textTransform: 'uppercase' }}>
                      Categories
                    </Typography>
                    {searchResults.categories.map(c => (
                      <Box key={c._id} sx={{ py: 0.75, px: 1, '&:hover': { bgcolor: darkMode ? '#334155' : '#f1f5f9' }, cursor: 'pointer', borderRadius: 1 }} onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); window.location.href = `/categories`; }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {searchResults.suppliers?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', mb: 1, textTransform: 'uppercase' }}>
                      Suppliers
                    </Typography>
                    {searchResults.suppliers.map(s => (
                      <Box key={s._id} sx={{ py: 0.75, px: 1, '&:hover': { bgcolor: darkMode ? '#334155' : '#f1f5f9' }, cursor: 'pointer', borderRadius: 1 }} onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); window.location.href = `/suppliers`; }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.name}</Typography>
                        <Typography variant="caption" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>{s.companyName}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {searchResults.customers?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', mb: 1, textTransform: 'uppercase' }}>
                      Customers
                    </Typography>
                    {searchResults.customers.map(c => (
                      <Box key={c._id} sx={{ py: 0.75, px: 1, '&:hover': { bgcolor: darkMode ? '#334155' : '#f1f5f9' }, cursor: 'pointer', borderRadius: 1 }} onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); window.location.href = `/customers`; }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                        <Typography variant="caption" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>{c.phone}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {searchResults.orders?.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: darkMode ? '#94a3b8' : '#64748b', display: 'block', mb: 1, textTransform: 'uppercase' }}>
                      Sales Orders
                    </Typography>
                    {searchResults.orders.map(o => (
                      <Box key={o._id} sx={{ py: 0.75, px: 1, '&:hover': { bgcolor: darkMode ? '#334155' : '#f1f5f9' }, cursor: 'pointer', borderRadius: 1 }} onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); window.location.href = `/sales`; }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.saleNumber}</Typography>
                        <Typography variant="caption" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>Customer: {o.customer?.name} | Total: ₹{o.totalAmount}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {!(searchResults.products?.length || searchResults.categories?.length || searchResults.suppliers?.length || searchResults.customers?.length || searchResults.orders?.length) && (
                  <Typography variant="body2" sx={{ textAlign: 'center', py: 2, color: darkMode ? '#94a3b8' : '#64748b' }}>
                    No results found
                  </Typography>
                )}
              </Paper>
            )}
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={user?.role?.replace(/_/g, ' ') || 'viewer'}
              size="small"
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />

            <IconButton color="inherit" onClick={() => dispatch(toggleDarkMode())}>
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>

            <IconButton color="inherit" sx={{ mr: 0.5 }}>
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            <IconButton color="inherit" onClick={handleMenuOpen} sx={{ p: 0.5 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {initials}
              </Avatar>
            </IconButton>
          </Stack>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            slotProps={{ paper: { sx: { minWidth: 240 } } }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="subtitle2">{user?.fullName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleMenuClose}>
              <Settings sx={{ mr: 1 }} /> Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            mt: 8,
            borderRight: 0,
          },
        }}
      >
        <Sidebar />
      </Drawer>

      <Box
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          mt: 8,
          backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
          minHeight: '100vh',
          transition: 'all 0.25s ease',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
