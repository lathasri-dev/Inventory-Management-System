import React, { useState } from 'react';
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
  Link as MuiLink,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  ContentCopy,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import {
  registerStart,
  registerSuccess,
  registerFailure,
  clearError,
} from '../redux/slices/authSlice';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user', // Default role
    securityQuestion: 'What was the name of your first school?',
    securityAnswer: '',
  });
  const [errors, setErrors] = useState({});
  const [recoveryCode, setRecoveryCode] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.match(/^[0-9]{10,}$/)) {
      newErrors.phone = 'Phone must be at least 10 digits';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'Password must contain uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.securityQuestion) {
      newErrors.securityQuestion = 'Security question is required';
    }

    if (!formData.securityAnswer.trim()) {
      newErrors.securityAnswer = 'Security answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      dispatch(registerStart());
      const response = await authAPI.register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role, // Pass the role to backend
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer,
      });

      if (response.success) {
        dispatch(
          registerSuccess({
            user: response.data.user,
            token: response.data.token,
            refreshToken: response.data.refreshToken,
          })
        );
        setRecoveryCode(response.data.recoveryCode);
        toast.success('Registration successful. Save your recovery code!');
      }
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      dispatch(registerFailure(errorMessage));
      toast.error(errorMessage);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Register to set up your store inventory, branch, and team console.
        </Typography>
      </Box>

      {/* Error Alert */}
      {(error || Object.keys(errors).length > 0) && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error || 'Please correct the validation errors below.'}
        </Alert>
      )}

      {/* Form */}
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            disabled={isLoading}
            error={!!errors.fullName}
            helperText={errors.fullName}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person fontSize="small" sx={{ color: 'text.secondary', opacity: 0.8 }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            disabled={isLoading}
            error={!!errors.email}
            helperText={errors.email}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email fontSize="small" sx={{ color: 'text.secondary', opacity: 0.8 }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="9876543210"
            disabled={isLoading}
            error={!!errors.phone}
            helperText={errors.phone}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone fontSize="small" sx={{ color: 'text.secondary', opacity: 0.8 }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            placeholder="Min. 8 chars (A-z, 0-9)"
            disabled={isLoading}
            error={!!errors.password}
            helperText={errors.password}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock fontSize="small" sx={{ color: 'text.secondary', opacity: 0.8 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            select
            label="Account Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={isLoading}
            SelectProps={{
              native: true,
            }}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
          </TextField>

          <TextField
            fullWidth
            select
            label="Security Question"
            name="securityQuestion"
            value={formData.securityQuestion}
            onChange={handleChange}
            disabled={isLoading}
            error={!!errors.securityQuestion}
            helperText={errors.securityQuestion}
            SelectProps={{
              native: true,
            }}
          >
            <option value="What was the name of your first school?">What was the name of your first school?</option>
            <option value="What was the name of your first teacher?">What was the name of your first teacher?</option>
            <option value="What was the name of your first pet?">What was the name of your first pet?</option>
            <option value="What was your childhood nickname?">What was your childhood nickname?</option>
            <option value="What was the first place you traveled to?">What was the first place you traveled to?</option>
            <option value="What was your favorite subject in school?">What was your favorite subject in school?</option>
          </TextField>

          <TextField
            fullWidth
            label="Security Answer"
            name="securityAnswer"
            value={formData.securityAnswer}
            onChange={handleChange}
            placeholder="Your answer"
            disabled={isLoading}
            error={!!errors.securityAnswer}
            helperText={errors.securityAnswer}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat password"
            disabled={isLoading}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock fontSize="small" sx={{ color: 'text.secondary', opacity: 0.8 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    size="small"
                  >
                    {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{
              py: 1.5,
              mt: 1,
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: '8px',
              boxShadow: '0 8px 20px rgba(20,184,166,0.15)',
              background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
              color: '#fff',
              '&:hover': {
                background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
                boxShadow: '0 10px 24px rgba(20,184,166,0.25)',
              },
            }}
          >
            {isLoading ? (
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                <CircularProgress size={20} color="inherit" />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#fff' }}>Creating account...</Typography>
              </Stack>
            ) : (
              'Create Account'
            )}
          </Button>
        </Stack>
      </Box>

      {recoveryCode && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ color: 'warning.contrastText', fontWeight: 'bold' }}>
            REGISTRATION SUCCESSFUL!
          </Typography>
          <Typography variant="body2" sx={{ color: 'warning.contrastText', mt: 1 }}>
            Save this recovery code somewhere safe. You will need it if you forget your password. It will NEVER be shown again.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.3)', p: 1, borderRadius: 1, mt: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flexGrow: 1 }}>
              {recoveryCode}
            </Typography>
            <IconButton onClick={() => {
              navigator.clipboard.writeText(recoveryCode);
              toast.success('Recovery code copied to clipboard!');
            }} color="inherit">
              <ContentCopy />
            </IconButton>
          </Box>
          <Button 
            variant="contained" 
            fullWidth 
            color="primary"
            onClick={() => navigate('/')}
          >
            I have saved the code, proceed to app
          </Button>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Login Redirect */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <MuiLink
            component={Link}
            to="/login"
            sx={{ fontWeight: 700, color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            Sign in instead
          </MuiLink>
        </Typography>
      </Box>
    </Box>
  );
}
