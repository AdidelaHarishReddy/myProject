import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardRoute, getUserType } from '../utils/dashboardRouting';

const DashboardRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userType = getUserType();
    const dashboardRoute = getDashboardRoute(userType);
    navigate(dashboardRoute, { replace: true });
  }, [navigate]);

  return null; // This component doesn't render anything
};

export default DashboardRedirect;
