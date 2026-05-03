import axios from 'axios';

const api = axios.create({
  baseURL: '/api/auth/',
});

api.interceptors.request.use(config => {
  console.log('Calling →', '/api/auth/' + config.url);
  return config;
});

export default {
  register: (data) => api.post('register/', data),
  login: (data) => api.post('login/', data),
  verifyOTP: (data) => api.post('verify-otp/', data),
  resendOTP: (phone) => api.post('resend-otp/', { phone }),
  logout: (token) => api.post('logout/', {}, { headers: { Authorization: `Token ${token}` } }),
  getCurrentUser: (token) => api.get('user/', { headers: { Authorization: `Token ${token}` } }),
  forgotPassword: (phone) => api.post('forgot-password/', { phone }),
  resetPassword: (phone, otp, newPassword) => api.post('reset-password/', { phone, otp, new_password: newPassword }),
};
