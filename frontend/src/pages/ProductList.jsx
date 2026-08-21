import React, { useEffect, useState } from 'react';
import { Paper, Typography, Box, CircularProgress, Button, Stack } from '@mui/material';
import { productsAPI } from '../services/api';
import ProductTable from '../components/ProductTable';
import { useNavigate } from 'react-router-dom';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const res = await productsAPI.getAll();
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productsAPI.delete(id);
      setProducts((prev) => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Products</Typography>
        <Button variant="contained" onClick={() => navigate('/products')}>Add Product</Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress/></Box>
      ) : products.length === 0 ? (
        <Typography>No products yet. Add one.</Typography>
      ) : (
        <ProductTable products={products} onDelete={handleDelete} />
      )}
    </Paper>
  );
}
