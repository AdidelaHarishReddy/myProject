import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = useSelector(state => state.isAuthenticated);
  const user = useSelector(state => state.user);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.user_type)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default PrivateRoute;
