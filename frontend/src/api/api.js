import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/api$/, '') ||
  import.meta.env.VITE_API_BASE ||
  'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE + '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const getProducts = () => api.get('/products');
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (payload) => api.post('/products', payload);
export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

export default api;
