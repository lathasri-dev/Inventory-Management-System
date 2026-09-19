import apiClient from './apiClient';

/**
 * Authentication API service
 */
export const authAPI = {
  login: (email, password, role) => apiClient.post('/auth/login', { email, password, role }),

  register: (userData) => apiClient.post('/auth/register', userData),

  logout: () => apiClient.post('/auth/logout'),

  refreshToken: (refreshToken) =>
    apiClient.post('/auth/refresh-token', { refreshToken }),

  getCurrentUser: () => apiClient.get('/auth/me'),

  updateProfile: (userData) => apiClient.put('/auth/profile', userData),

  changePassword: (passwords) => apiClient.post('/auth/change-password', passwords),

  setupSecurity: (data) => apiClient.post('/auth/setup-security', data),

  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),

  verifyRecovery: (data) => apiClient.post('/auth/verify-recovery', data),

  resetPassword: (token, password, confirmPassword) =>
    apiClient.post(`/auth/reset-password/${token}`, { password, confirmPassword }),

  verifyEmail: (token) => apiClient.get(`/auth/verify-email/${token}`),

  resendVerificationEmail: (email) =>
    apiClient.post('/auth/resend-verification', { email }),
};

/**
 * Products API service
 */
export const productsAPI = {
  getAll: (params) => apiClient.get('/products', { params }),

  getById: (id) => apiClient.get(`/products/${id}`),

  create: (data) => apiClient.post('/products', data),

  update: (id, data) => apiClient.put(`/products/${id}`, data),

  delete: (id) => apiClient.delete(`/products/${id}`),

  bulkDelete: (ids) => apiClient.post('/products/bulk-delete', { ids }),

  search: (query) => apiClient.get('/products/search', { params: { query } }),

  getByCategory: (categoryId) =>
    apiClient.get(`/products/category/${categoryId}`),

  getLowStock: () => apiClient.get('/products/stock/low'),

  getOutOfStock: () => apiClient.get('/products/stock/out'),

  updateQuantity: (id, quantity) =>
    apiClient.patch(`/products/${id}/quantity`, { quantity }),
};

/**
 * Categories API service
 */
export const categoriesAPI = {
  // Pass params to support search and optional pagination
  getAll: (params) => apiClient.get('/categories', { params }),

  getById: (id) => apiClient.get(`/categories/${id}`),

  create: (data) => apiClient.post('/categories', data),

  update: (id, data) => apiClient.put(`/categories/${id}`, data),

  delete: (id) => apiClient.delete(`/categories/${id}`),
};

/**
 * Suppliers API service
 */
export const suppliersAPI = {
  getAll: (params) => apiClient.get('/suppliers', { params }),

  getById: (id) => apiClient.get(`/suppliers/${id}`),

  create: (data) => apiClient.post('/suppliers', data),

  update: (id, data) => apiClient.put(`/suppliers/${id}`, data),

  delete: (id) => apiClient.delete(`/suppliers/${id}`),

  getProducts: (id) => apiClient.get(`/suppliers/${id}/products`),
};

/**
 * Customers API service
 */
export const customersAPI = {
  getAll: (params) => apiClient.get('/customers', { params }),

  getById: (id) => apiClient.get(`/customers/${id}`),

  create: (data) => apiClient.post('/customers', data),

  update: (id, data) => apiClient.put(`/customers/${id}`, data),

  delete: (id) => apiClient.delete(`/customers/${id}`),

  getSalesHistory: (id) => apiClient.get(`/customers/${id}/sales`),
};

/**
 * Sales API service
 */
export const salesAPI = {
  getAll: (params) => apiClient.get('/sales', { params }),

  getById: (id) => apiClient.get(`/sales/${id}`),

  create: (data) => apiClient.post('/sales', data),

  update: (id, data) => apiClient.put(`/sales/${id}`, data),

  delete: (id) => apiClient.delete(`/sales/${id}`),

  generateInvoice: (id) => apiClient.get(`/sales/${id}/invoice`),

  getDailyRevenue: () => apiClient.get('/sales/analytics/daily-revenue'),

  getMonthlyRevenue: () => apiClient.get('/sales/analytics/monthly-revenue'),

  getTopProducts: () => apiClient.get('/sales/analytics/top-products'),
};

/**
 * Purchases API service
 */
export const purchasesAPI = {
  getAll: (params) => apiClient.get('/purchases', { params }),

  getById: (id) => apiClient.get(`/purchases/${id}`),

  create: (data) => apiClient.post('/purchases', data),

  update: (id, data) => apiClient.put(`/purchases/${id}`, data),

  delete: (id) => apiClient.delete(`/purchases/${id}`),
};

/**
 * Dashboard API service
 */
export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),

  getCharts: () => apiClient.get('/dashboard/charts'),

  getLowStockAlerts: () => apiClient.get('/dashboard/alerts/low-stock'),

  getExpiryAlerts: () => apiClient.get('/dashboard/alerts/expiry'),
};

/**
 * Reports API service
 */
export const reportsAPI = {
  generateInventoryReport: (format = 'pdf') =>
    apiClient.get(`/reports/inventory?format=${format}`, {
      responseType: format === 'pdf' ? 'blob' : 'json',
    }),

  generateSalesReport: (format = 'pdf') =>
    apiClient.get(`/reports/sales?format=${format}`, {
      responseType: format === 'pdf' ? 'blob' : 'json',
    }),

  generateRevenueReport: (format = 'pdf') =>
    apiClient.get(`/reports/revenue?format=${format}`, {
      responseType: format === 'pdf' ? 'blob' : 'json',
    }),

  generateSupplierReport: (format = 'pdf') =>
    apiClient.get(`/reports/suppliers?format=${format}`, {
      responseType: format === 'pdf' ? 'blob' : 'json',
    }),

  generateCustomerReport: (format = 'pdf') =>
    apiClient.get(`/reports/customers?format=${format}`, {
      responseType: format === 'pdf' ? 'blob' : 'json',
    }),
};

/**
 * Notifications API service
 */
export const notificationsAPI = {
  getAll: () => apiClient.get('/notifications'),

  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.patch('/notifications/read-all'),

  delete: (id) => apiClient.delete(`/notifications/${id}`),

  deleteAll: () => apiClient.delete('/notifications'),
};

/**
 * User Management API service
 */
export const usersAPI = {
  getAll: () => apiClient.get('/users'),
  updateRole: (id, role) => apiClient.put(`/users/${id}/role`, { role }),
  toggleStatus: (id) => apiClient.put(`/users/${id}/status`),
  delete: (id) => apiClient.delete(`/users/${id}`),
};

/**
 * Activity Logs API service
 */
export const activityLogsAPI = {
  getAll: (params) => apiClient.get('/activity-logs', { params }),
};

/**
 * Inventory Logs API service
 */
export const inventoryLogsAPI = {
  getAll: (params) => apiClient.get('/inventory-logs', { params }),
};
