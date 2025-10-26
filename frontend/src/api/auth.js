import axios from 'axios';

// Get API URL with fallback
const getAPIUrl = () => {
  const baseUrl = window._env_?.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
  return `${baseUrl}/api/auth/`;
};

const API_URL = getAPIUrl();

// Create Axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for error handling
api.interceptors.request.use(
  config => {
    console.log('Making API request to:', config.url);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => {
    console.log('API response received:', response.status);
    return response;
  },
  error => {
    console.error('Response error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

const register = (userData) => {
  return api.post('register/', userData);
};

const login = (credentials) => {
  return api.post('login/', credentials);
};

const verifyOTP = (otpData) => {
  return api.post('verify-otp/', otpData);
};

const resendOTP = (phone) => {
  return api.post('resend-otp/', { phone });
};

const logout = (token) => {
  return api.post('logout/', {}, {
    headers: { 'Authorization': `Token ${token}` }
  });
};

const getCurrentUser = (token) => {
  return api.get('user/', {
    headers: { 'Authorization': `Token ${token}` }
  });
};

const forgotPassword = (phone) => {
  return api.post('forgot-password/', { phone });
};

const resetPassword = (phone, otp, newPassword) => {
  return api.post('reset-password/', { phone, otp, new_password: newPassword });
};

export default {
  register,
  login,
  verifyOTP,
  resendOTP,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword
};
