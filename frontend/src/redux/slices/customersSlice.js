import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isLoading: false,
  error: null,
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    fetchCustomersStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchCustomersSuccess: (state, action) => {
      state.isLoading = false;
      state.items = action.payload;
    },
    fetchCustomersFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addCustomer: (state, action) => {
      state.items.push(action.payload);
    },
    updateCustomer: (state, action) => {
      const index = state.items.findIndex((c) => c._id === action.payload._id);
      if (index !== -1) state.items[index] = action.payload;
    },
    deleteCustomer: (state, action) => {
      state.items = state.items.filter((c) => c._id !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchCustomersStart,
  fetchCustomersSuccess,
  fetchCustomersFailure,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  clearError,
} = customersSlice.actions;

export default customersSlice.reducer;
