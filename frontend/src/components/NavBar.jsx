import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Inventory Management
        </Typography>
        <Button color="inherit" component={RouterLink} to="/">Products</Button>
        <Button color="inherit" component={RouterLink} to="/add">Add Product</Button>
      </Toolbar>
    </AppBar>
  );
}
