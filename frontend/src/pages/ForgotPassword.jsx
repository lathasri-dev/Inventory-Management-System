import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, Card, CircularProgress, TextField, Typography } from '@mui/material';
import { EmailOutlined } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authAPI.forgotPassword(email);

      if (response.success) {
        toast.success('Password reset instructions sent to your email');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.message || 'Unable to send reset email');
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
        Forgot Password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the email tied to your account and we’ll send a secure reset link.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.2 }}>
        <TextField
          fullWidth
          label="Email address"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          InputProps={{ startAdornment: <EmailOutlined sx={{ mr: 1, color: 'text.secondary' }} /> }}
        />

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Send reset email'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 3 }}>
        Remembered your password? <Link to="/login">Back to login</Link>
      </Typography>
    </Card>
  );
}
