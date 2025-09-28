import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardRoute } from '../utils/dashboardRouting';

const DashboardRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Always redirect to general dashboard
    const dashboardRoute = getDashboardRoute();
    navigate(dashboardRoute, { replace: true });
  }, [navigate]);

  return null; // This component doesn't render anything
};

export default DashboardRedirect;
