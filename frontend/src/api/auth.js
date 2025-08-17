import axios from 'axios';

const API_URL = `http://${process.env.REACT_APP_API_BASE_URL}:8000/api/auth/`;

const register = (userData) => {
  return axios.post(`${API_URL}register/`, userData);
};

const login = (credentials) => {
  return axios.post(`${API_URL}login/`, credentials);
};

const verifyOTP = (otpData) => {
  return axios.post(`${API_URL}verify-otp/`, otpData);
};

const resendOTP = (phone) => {
  return axios.post(`${API_URL}resend-otp/`, { phone });
};

const logout = (token) => {
  return axios.post(`${API_URL}logout/`, {}, {
    headers: { 'Authorization': `Token ${token}` }
  });
};

const getCurrentUser = (token) => {
  return axios.get(`${API_URL}user/`, {
    headers: { 'Authorization': `Token ${token}` }
  });
};

export default {
  register,
  login,
  verifyOTP,
  resendOTP,
  logout,
  getCurrentUser
};
