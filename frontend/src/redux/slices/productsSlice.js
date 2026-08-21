import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  currentProduct: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    category: null,
    supplier: null,
    priceRange: [0, 10000],
    stockStatus: 'all', // all, low, out
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
  sort: {
    field: 'createdAt',
    order: 'desc',
  },
};

/**
 * Products Slice
 * Manages product state
 */
const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Fetch products
    fetchProductsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchProductsSuccess: (state, action) => {
      state.isLoading = false;
      state.items = action.payload.products;
      state.pagination = action.payload.pagination;
    },
    fetchProductsFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Create product
    createProductStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    createProductSuccess: (state, action) => {
      state.isLoading = false;
      state.items.unshift(action.payload);
    },
    createProductFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Update product
    updateProductStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    updateProductSuccess: (state, action) => {
      state.isLoading = false;
      const index = state.items.findIndex((p) => p._id === action.payload._id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    updateProductFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Delete product
    deleteProductStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    deleteProductSuccess: (state, action) => {
      state.isLoading = false;
      state.items = state.items.filter((p) => p._id !== action.payload);
    },
    deleteProductFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Set current product
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },

    // Update filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filters change
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },

    // Update sort
    setSort: (state, action) => {
      state.sort = action.payload;
    },

    // Update pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  createProductStart,
  createProductSuccess,
  createProductFailure,
  updateProductStart,
  updateProductSuccess,
  updateProductFailure,
  deleteProductStart,
  deleteProductSuccess,
  deleteProductFailure,
  setCurrentProduct,
  setFilters,
  clearFilters,
  setSort,
  setPagination,
  clearError,
} = productsSlice.actions;

export default productsSlice.reducer;
