import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = useSelector(state => state.isAuthenticated);
  const user = useSelector(state => state.user);
  
  // Debug logging
  console.log('PrivateRoute - isAuthenticated:', isAuthenticated, 'user:', user);
  
  if (!isAuthenticated) {
    console.log('PrivateRoute - Redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.user_type)) {
    console.log('PrivateRoute - User role not allowed, redirecting to home');
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default PrivateRoute;
