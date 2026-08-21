import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  totalRevenue: 0,
  isLoading: false,
  error: null,
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    fetchSalesStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchSalesSuccess: (state, action) => {
      state.isLoading = false;
      state.items = action.payload.sales;
      state.totalRevenue = action.payload.totalRevenue;
    },
    fetchSalesFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addSale: (state, action) => {
      state.items.push(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchSalesStart,
  fetchSalesSuccess,
  fetchSalesFailure,
  addSale,
  clearError,
} = salesSlice.actions;

export default salesSlice.reducer;
