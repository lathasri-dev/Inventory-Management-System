import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  isLoading: false,
  error: null,
};

const purchasesSlice = createSlice({
  name: 'purchases',
  initialState,
  reducers: {
    fetchPurchasesStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchPurchasesSuccess: (state, action) => {
      state.isLoading = false;
      state.items = action.payload;
    },
    fetchPurchasesFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    addPurchase: (state, action) => {
      state.items.push(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchPurchasesStart,
  fetchPurchasesSuccess,
  fetchPurchasesFailure,
  addPurchase,
  clearError,
} = purchasesSlice.actions;

export default purchasesSlice.reducer;
