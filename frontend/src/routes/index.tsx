import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';

// Pages (to be created)
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Dashboard from '../pages/Dashboard';
import Donors from '../pages/Donors';
import Donations from '../pages/Donations';
import Cows from '../pages/Cows';
import Sponsorships from '../pages/Sponsorships';
import Reports from '../pages/Reports';
import Staff from '../pages/Staff';
import Profile from '../pages/Profile';

// Route Guard for Admin Only
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/profile" replace />;
  }
  return <>{children}</>;
};

// Route Guard for Admin/Staff Only
const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    return <Navigate to="/profile" replace />;
  }
  return <>{children}</>;
};

export const router = createBrowserRouter([
  // Public / Guest Auth Routes
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
    ],
  },
  
  // Authenticated Dashboard Routes
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        ),
      },
      {
        path: 'donors',
        element: (
          <StaffRoute>
            <Donors />
          </StaffRoute>
        ),
      },
      {
        path: 'donations',
        element: <Donations />,
      },
      {
        path: 'cows',
        element: <Cows />,
      },
      {
        path: 'sponsorships',
        element: <Sponsorships />,
      },
      {
        path: 'reports',
        element: (
          <StaffRoute>
            <Reports />
          </StaffRoute>
        ),
      },
      {
        path: 'staff',
        element: (
          <AdminRoute>
            <Staff />
          </AdminRoute>
        ),
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
  
  // Fallback redirect
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
export default router;
