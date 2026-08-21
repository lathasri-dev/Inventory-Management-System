import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
      }}
    >
      <Box sx={{ maxWidth: 520, mx: 'auto' }}>
        <Typography variant="overline" sx={{ letterSpacing: '0.2em', color: 'text.secondary' }}>
          Atlas Inventory
        </Typography>
        <Typography variant="h1" sx={{ fontWeight: 900, mb: 1 }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Page not found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The page you are looking for does not exist or has been moved.
        </Typography>
        <Button component={Link} to="/" variant="contained" size="large">
          Return to dashboard
        </Button>
      </Box>
    </Box>
  );
}
