import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';

// Auth hooks
export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  return {
    ...auth,
    dispatch,
  };
};

// Products hooks
export const useProducts = () => {
  const products = useSelector((state) => state.products);
  return products;
};

// Categories hooks
export const useCategories = () => {
  const categories = useSelector((state) => state.categories);
  return categories;
};

// Suppliers hooks
export const useSuppliers = () => {
  const suppliers = useSelector((state) => state.suppliers);
  return suppliers;
};

// Customers hooks
export const useCustomers = () => {
  const customers = useSelector((state) => state.customers);
  return customers;
};

// Sales hooks
export const useSales = () => {
  const sales = useSelector((state) => state.sales);
  return sales;
};

// Purchases hooks
export const usePurchases = () => {
  const purchases = useSelector((state) => state.purchases);
  return purchases;
};

// Notifications hooks
export const useNotifications = () => {
  const notifications = useSelector((state) => state.notifications);
  return notifications;
};

// UI hooks
export const useUI = () => {
  const ui = useSelector((state) => state.ui);
  return ui;
};

/**
 * Custom hook for showing toast notifications
 */
export const useToast = () => {
  const dispatch = useDispatch();
  const { showToast } = require('../redux/slices/uiSlice');

  return useCallback(
    (message, severity = 'info') => {
      dispatch(showToast({ message, severity }));
    },
    [dispatch]
  );
};
