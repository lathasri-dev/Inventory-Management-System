import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../hooks/useRedux';
import { normalizeRole, roleMatches } from '../utils/roles';
import { loginSuccess, logout } from '../redux/slices/authSlice';
import apiClient from '../services/apiClient';

/**
 * Protected Route Component
 * On first render, validates the stored token against /auth/me.
 * If the token is expired or invalid, clears auth state and redirects to /login.
 * This prevents stale tokens from bypassing the sign-in page.
 */
export default function ProtectedRoute({ requiredRole = null }) {
  const dispatch = useDispatch();
  const { isAuthenticated, token, user } = useAuth();
  const currentRole = normalizeRole(user?.role);

  // Track whether we've finished the token validation check
  const [checking, setChecking] = useState(!user && !!token);

  useEffect(() => {
    // If we have a token but no user object, validate the token with the backend
    if (token && !user) {
      apiClient
        .get('/auth/me')
        .then((res) => {
          if (res.success && res.data) {
            dispatch(
              loginSuccess({
                user: res.data.user || res.data,
                token,
                refreshToken: localStorage.getItem('refreshToken') || token,
              })
            );
          } else {
            dispatch(logout());
          }
        })
        .catch(() => {
          // Token invalid or expired — clear it and redirect to login
          dispatch(logout());
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [token, user, dispatch]);

  // Show a loading spinner while we're checking the token
  if (checking) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (requiredRole && !roleMatches(currentRole, requiredRole)) {
    return <Navigate to="/" replace />;
  }

  // Render protected content
  return <Outlet />;
}
