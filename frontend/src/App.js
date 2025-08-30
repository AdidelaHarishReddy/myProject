import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
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
import authAPI from './api/auth';

const App = () => {
  useEffect(() => {
    // Check authentication on app load
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getCurrentUser(token)
        .then(response => {
          store.dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { token, user: response.data }
          });
        })
        .catch(error => {
          console.error('Error fetching user:', error);
          localStorage.removeItem('token');
        });
    }
  }, []);

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
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
