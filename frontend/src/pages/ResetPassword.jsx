import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CircularProgress, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.password || formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authAPI.resetPassword(token, formData.password);

      if (response.success) {
        toast.success('Password reset successfully');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.message || 'Unable to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
      <Typography variant="overline" sx={{ letterSpacing: '0.18em', color: 'text.secondary' }}>
        Account Recovery
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Reset Password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create a new secure password for your account.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.2 }}>
        <TextField
          fullWidth
          label="New password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
          InputProps={{
            startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((value) => !value)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
          InputProps={{ startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} /> }}
        />

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Reset password'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 3 }}>
        Need help? <Link to="/login">Return to login</Link>
      </Typography>
    </Card>
  );
}
