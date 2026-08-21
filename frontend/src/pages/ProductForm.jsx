import React, { useEffect, useState } from 'react';
import { Paper, TextField, Button, Stack, Typography } from '@mui/material';
import { productsAPI } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';

export default function ProductForm() {
  const params = useParams();
  const id = params.id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    item_number: '',
    price: '',
    quantity: ''
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productsAPI.getById(id).then((res) => {
      const product = res.data;
      setForm({
        name: product.name || '',
        item_number: product.sku || '',
        price: product.price ?? '',
        quantity: product.quantity ?? '',
      });
    }).catch(err => {
      console.error(err);
      alert('Failed to load product');
    }).finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Type conversion for numeric fields
    let processedValue = value;
    if (name === 'price') {
      // Allow decimal input for price
      processedValue = value;
    } else if (name === 'quantity') {
      // Only allow whole numbers for quantity
      processedValue = value.replace(/[^0-9]/g, '');
    }
    
    setForm(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!form.name || !form.item_number || form.price === '' || form.quantity === '') {
      alert('Please fill all fields');
      return;
    }
    
    // Type validation
    const numPrice = parseFloat(form.price);
    const numQuantity = parseInt(form.quantity);
    
    if (isNaN(numPrice) || numPrice < 0) {
      alert('Please enter a valid price (must be a positive number)');
      return;
    }
    
    if (isNaN(numQuantity) || numQuantity < 0 || !Number.isInteger(numQuantity)) {
      alert('Please enter a valid quantity (must be a positive whole number)');
      return;
    }
    
    const payload = {
      name: form.name.trim(),
      item_number: form.item_number.trim(),
      price: numPrice,
      quantity: numQuantity
    };

    try {
      if (id) {
        await productsAPI.update(id, {
          name: payload.name,
          sku: payload.item_number,
          price: payload.price,
          quantity: payload.quantity,
        });
        alert('Updated');
      } else {
        await productsAPI.create({
          name: payload.name,
          sku: payload.item_number,
          price: payload.price,
          quantity: payload.quantity,
        });
        alert('Created');
      }
      navigate('/products');
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Operation failed';
      alert(msg);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>{id ? 'Edit Product' : 'Add Product'}</Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} required />
          <TextField label="Item Number" name="item_number" value={form.item_number} onChange={handleChange} required />
          <TextField 
            label="Price ($)" 
            name="price" 
            value={form.price} 
            onChange={handleChange} 
            type="number" 
            required 
            inputProps={{ min: 0, step: "0.01", max: "999999.99" }}
            placeholder="0.00"
            helperText="Enter price in dollars (e.g., 19.99)"
          />
          <TextField 
            label="Quantity" 
            name="quantity" 
            value={form.quantity} 
            onChange={handleChange} 
            type="number" 
            required 
            inputProps={{ min: 0, step: "1", max: "999999" }}
            placeholder="0"
            helperText="Enter quantity as whole number (e.g., 100)"
          />
          <Stack direction="row" spacing={2}>
            <Button variant="contained" type="submit" disabled={loading}>{id ? 'Update' : 'Create'}</Button>
            <Button variant="outlined" onClick={() => navigate('/products')}>Cancel</Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  );
}
