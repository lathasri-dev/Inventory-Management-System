import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Card, CircularProgress, TextField, Typography } from '@mui/material';
import { MarkEmailRead } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function RequestVerification() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error('Enter your email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authAPI.resendVerificationEmail(email);

      if (response.success) {
        toast.success('Verification email sent');
      }
    } catch (error) {
      toast.error(error.message || 'Unable to resend verification email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card sx={{ p: { xs: 3, md: 4 }, borderRadius: 4 }}>
      <Typography variant="overline" sx={{ letterSpacing: '0.18em', color: 'text.secondary' }}>
        Account Verification
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        Resend Verification Email
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        If you missed the email verification message, request a fresh one here.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2.2 }}>
        <TextField
          fullWidth
          label="Email address"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          InputProps={{ startAdornment: <MarkEmailRead sx={{ mr: 1, color: 'text.secondary' }} /> }}
        />

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Resend verification email'}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 3 }}>
        Back to <Link to="/login">login</Link>
      </Typography>
    </Card>
  );
}
