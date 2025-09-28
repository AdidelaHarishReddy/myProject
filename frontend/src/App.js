import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { Provider } from 'react-redux';
import store from './store/store';
import theme from './styles/theme';

// Pages
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OTPVerification from './components/Auth/OTPVerification';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import EditProperty from './pages/EditProperty';
import PropertyDetail from './pages/PropertyDetail';
import Shortlist from './pages/Shortlist';
import Profile from './components/Profile';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import DashboardRedirect from './components/DashboardRedirect';
import authAPI from './api/auth';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check authentication on app load
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    console.log('App - Initial token check:', token ? 'Token exists' : 'No token');
    
    if (token) {
      console.log('App - Attempting to fetch user with token');
      authAPI.getCurrentUser(token)
        .then(response => {
          console.log('App - User fetch successful:', response.data);
          // Store updated user data
          localStorage.setItem('user', JSON.stringify(response.data));
          store.dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { token, user: response.data }
          });
        })
        .catch(error => {
          console.error('App - Error fetching user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Explicitly set unauthenticated state
          store.dispatch({
            type: 'LOGOUT'
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      console.log('App - No token, setting unauthenticated state');
      // Ensure unauthenticated state is set when no token
      store.dispatch({
        type: 'LOGOUT'
      });
      setIsLoading(false);
    }
  }, []);
  
  if (isLoading) {
    return (
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="100vh"
          >
            <CircularProgress />
          </Box>
        </ThemeProvider>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<OTPVerification />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <BuyerDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/dashboard" element={
              <PrivateRoute>
                <DashboardRedirect />
              </PrivateRoute>
            } />
            
            <Route path="/seller" element={
              <PrivateRoute allowedRoles={['SELLER']}>
                <SellerDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/edit-property/:id" element={
              <PrivateRoute allowedRoles={['SELLER']}>
                <EditProperty />
              </PrivateRoute>
            } />
            
            <Route path="/property/:id" element={
              <PrivateRoute>
                <PropertyDetail />
              </PrivateRoute>
            } />
            
            <Route path="/shortlist" element={
              <PrivateRoute>
                <Shortlist />
              </PrivateRoute>
            } />
            
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile token={localStorage.getItem('token')} />
              </PrivateRoute>
            } />
            
            {/* Fallback route - redirect to login if no other route matches */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
