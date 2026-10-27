import axios from 'axios';

const test = async () => {
  const API_BASE = 'http://localhost:5001/api';
  const apiClient = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error.response?.data || error)
  );

  try {
    const res = await apiClient.post('/auth/login', {
      email: 'admin@inventory.com',
      password: 'Password123!',
      role: 'admin'
    });
    console.log('Login Response:', res);
  } catch (err) {
    console.log('Error:', err);
  }
};

test();
