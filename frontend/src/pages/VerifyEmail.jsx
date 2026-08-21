import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Button, Card, CircularProgress, Typography } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await authAPI.verifyEmail(token);
        if (response.success) {
          setStatus('verified');
          toast.success('Email verified successfully');
        }
      } catch (error) {
        setStatus('failed');
        toast.error(error.message || 'Email verification failed');
      }
    };

    verify();
  }, [token]);

  return (
    <Card sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, textAlign: 'center' }}>
      {status === 'verifying' && <CircularProgress />}
      {status === 'verified' && (
        <>
          <CheckCircleOutline sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Email verified
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your account is ready. You can now continue to login.
          </Typography>
          <Button variant="contained" component={Link} to="/login">
            Go to login
          </Button>
        </>
      )}
      {status === 'failed' && (
        <>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Verification failed
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The token is invalid or expired. Request a new verification email.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" component={Link} to="/login">
              Login
            </Button>
            <Button variant="outlined" component={Link} to="/register">
              Register again
            </Button>
          </Box>
        </>
      )}
    </Card>
  );
}
