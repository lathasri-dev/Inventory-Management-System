import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Stack,
  Divider,
  Chip,
  Link as MuiLink,
  Collapse,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  PlayArrow,
  CheckCircle,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  clearError,
} from '../redux/slices/authSlice';

const DEMO_ROLES = [
  { label: 'Admin', email: 'admin@example.com', password: 'Admin@123', color: '#6366f1' },
  { label: 'Manager', email: 'manager@example.com', password: 'Manager@123', color: '#14b8a6' },
  { label: 'Viewer', email: 'viewer@example.com', password: 'Viewer@123', color: '#f59e0b' },
];

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const fillDemoCredentials = (demo) => {
    setFormData({ email: demo.email, password: demo.password });
    setFieldErrors({});
    if (error) dispatch(clearError());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    if (error) dispatch(clearError());
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      dispatch(loginStart());
      const response = await authAPI.login(formData.email, formData.password);

      if (response.success) {
        dispatch(
          loginSuccess({
            user: response.data.user,
            token: response.data.token,
            refreshToken: response.data.refreshToken,
          })
        );
        setSuccess(true);
        toast.success(`Welcome back, ${response.data.user?.name || 'User'}!`);
        
        // Role-based redirection logic
        setTimeout(() => {
          const role = response.data.user?.role || 'viewer';
          const normalized = String(role).trim().toLowerCase();
          
          if (normalized.includes('sales')) {
            navigate('/sales');
          } else if (normalized.includes('manager')) {
            navigate('/products');
          } else if (normalized.includes('viewer')) {
            navigate('/reports');
          } else {
            // Admin or Super Admin
            navigate('/dashboard');
          }
        }, 600);
      }
    } catch (err) {
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      dispatch(loginFailure(errorMessage));
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            mb: 1,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            '.dark-mode &': {
              background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
            },
          }}
        >
          Sign In
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          Enter your credentials to access the inventory management platform.
        </Typography>
      </Box>

      {/* Error Alert */}
      <Collapse in={!!error}>
        <Alert
          severity="error"
          onClose={() => dispatch(clearError())}
          sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.85rem' }}
        >
          {error}
        </Alert>
      </Collapse>

      {/* Success state */}
      <Collapse in={success}>
        <Alert
          severity="success"
          icon={<CheckCircle />}
          sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.85rem' }}
        >
          Login successful! Redirecting to dashboard...
        </Alert>
      </Collapse>

      {/* Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="admin@example.com"
            disabled={isLoading || success}
            autoComplete="email"
            autoFocus
            error={!!fieldErrors.email}
            helperText={fieldErrors.email}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email fontSize="small" sx={{ color: fieldErrors.email ? 'error.main' : 'text.secondary', opacity: 0.7 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 0 0 3px rgba(99,102,241,0.08)' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(99,102,241,0.12)' },
              },
            }}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            disabled={isLoading || success}
            autoComplete="current-password"
            error={!!fieldErrors.password}
            helperText={fieldErrors.password}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock fontSize="small" sx={{ color: fieldErrors.password ? 'error.main' : 'text.secondary', opacity: 0.7 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 0 0 3px rgba(99,102,241,0.08)' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(99,102,241,0.12)' },
              },
            }}
          />

          <Stack direction="row" justifyContent="flex-end">
            <MuiLink
              component={Link}
              to="/forgot-password"
              variant="body2"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                textDecoration: 'none',
                fontSize: '0.82rem',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Forgot Password?
            </MuiLink>
          </Stack>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading || success}
            sx={{
              py: 1.5,
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: '10px',
              letterSpacing: '0.01em',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
              transition: 'all 0.25s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                boxShadow: '0 8px 25px rgba(99,102,241,0.45)',
                transform: 'translateY(-1px)',
              },
              '&:active': { transform: 'translateY(0)' },
              '&.Mui-disabled': {
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                opacity: 0.7,
              },
            }}
          >
            {isLoading ? (
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                <CircularProgress size={18} sx={{ color: '#fff' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>
                  Signing in...
                </Typography>
              </Stack>
            ) : success ? (
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <CheckCircle fontSize="small" />
                <span>Redirecting...</span>
              </Stack>
            ) : (
              'Sign In to Dashboard'
            )}
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          QUICK ACCESS
        </Typography>
      </Divider>

      {/* Demo Credentials Panel */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Demo Accounts — click to fill
        </Typography>
        <Stack spacing={1.5}>
          {DEMO_ROLES.map((demo) => (
            <Box
              key={demo.label}
              onClick={() => !isLoading && fillDemoCredentials(demo)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: demo.color,
                  backgroundColor: `${demo.color}08`,
                  transform: 'translateX(4px)',
                },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${demo.color}22, ${demo.color}44)`,
                    border: `1px solid ${demo.color}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: demo.color,
                  }}
                >
                  {demo.label[0]}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: demo.color }}>
                    {demo.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                    {demo.email}
                  </Typography>
                </Box>
              </Stack>
              <Chip
                label="Use"
                size="small"
                icon={<PlayArrow sx={{ fontSize: '12px !important' }} />}
                sx={{
                  fontSize: '0.7rem',
                  height: 22,
                  bgcolor: `${demo.color}15`,
                  color: demo.color,
                  border: `1px solid ${demo.color}30`,
                  '& .MuiChip-icon': { color: demo.color },
                }}
              />
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Register link */}
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{' '}
          <MuiLink
            component={Link}
            to="/register"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Create Account
          </MuiLink>
        </Typography>
      </Box>
    </Box>
  );
}
