import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  darkMode: localStorage.getItem('darkMode') === 'true' || false,
  sidebarOpen: true,
  toastMessage: null,
  toastSeverity: 'info', // success, error, warning, info
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    showToast: (state, action) => {
      state.toastMessage = action.payload.message;
      state.toastSeverity = action.payload.severity || 'info';
    },
    clearToast: (state) => {
      state.toastMessage = null;
      state.toastSeverity = 'info';
    },
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  toggleSidebar,
  setSidebarOpen,
  showToast,
  clearToast,
} = uiSlice.actions;

export default uiSlice.reducer;
