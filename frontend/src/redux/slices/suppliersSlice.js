import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isLoading: false,
  error: null,
};

const suppliersSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {
    fetchSuppliersStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchSuppliersSuccess: (state, action) => {
      state.isLoading = false;
      state.items = action.payload;
    },
    fetchSuppliersFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addSupplier: (state, action) => {
      state.items.push(action.payload);
    },
    updateSupplier: (state, action) => {
      const index = state.items.findIndex((s) => s._id === action.payload._id);
      if (index !== -1) state.items[index] = action.payload;
    },
    deleteSupplier: (state, action) => {
      state.items = state.items.filter((s) => s._id !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchSuppliersStart,
  fetchSuppliersSuccess,
  fetchSuppliersFailure,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  clearError,
} = suppliersSlice.actions;

export default suppliersSlice.reducer;
