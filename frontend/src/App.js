import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import theme from './styles/theme';
import store from './store/store';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OTPVerification from './components/Auth/OTPVerification';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import PropertyDetail from './pages/PropertyDetail';
import Shortlist from './pages/Shortlist';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
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
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
