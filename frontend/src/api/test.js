import axios from 'axios';

// Get API URL with fallback
const getAPIUrl = () => {
  const baseUrl = window._env_?.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
  return `${baseUrl}/api/`;
};

const API_URL = getAPIUrl();

// Create Axios instance
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
    console.log('Making test API request to:', config.url);
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
    console.log('Test API response received:', response.status);
    return response;
  },
  error => {
    console.error('Test API response error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

const testConnection = () => {
  return api.get('test/');
};

export default {
  testConnection
};
