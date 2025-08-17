import axios from 'axios';

const API_URL = 'http://${REACT_APP_API_BASE_URL}:8000/api/locations/';

// Create Axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token'); // or 'authToken', adjust as per your key
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

const getStates = async () => {
  try {
    const response = await api.get('states/');
    console.log('States response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching states:', error);
    // Return fallback data
    return { states: ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Gujarat'] };
  }
};

const getDistricts = async (state) => {
  try {
    const response = await api.get(`districts/?state=${encodeURIComponent(state)}`);
    console.log('Districts response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching districts:', error);
    // Return fallback data
    const fallbackDistricts = {
      'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
      'Karnataka': ['Bangalore', 'Mysore', 'Mangalore'],
      'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
      'Delhi': ['New Delhi', 'North Delhi', 'South Delhi'],
      'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara']
    };
    return { districts: fallbackDistricts[state] || [] };
  }
};

const getSubDistricts = async (state, district) => {
  try {
    const response = await api.get(`sub_districts/?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
    console.log('Sub-districts response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching sub-districts:', error);
    // Return fallback data
    const fallbackSubDistricts = {
      'Maharashtra': {
        'Mumbai': ['Mumbai Suburban', 'Mumbai City'],
        'Pune': ['Pune City', 'Pune Rural']
      },
      'Karnataka': {
        'Bangalore': ['Bangalore Urban', 'Bangalore Rural']
      }
    };
    return { sub_districts: fallbackSubDistricts[state]?.[district] || [] };
  }
};

const getVillages = async (state, district, subDistrict) => {
  try {
    const response = await api.get(`villages/?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&sub_district=${encodeURIComponent(subDistrict)}`);
    console.log('Villages response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching villages:', error);
    // Return fallback data
    const fallbackVillages = {
      'Maharashtra': {
        'Mumbai': {
          'Mumbai Suburban': ['Andheri', 'Bandra', 'Juhu']
        }
      }
    };
    return { villages: fallbackVillages[state]?.[district]?.[subDistrict] || [] };
  }
};

const getPinCodes = async (state, district, subDistrict, village) => {
  try {
    let url = `pin_codes/?`;
    if (state) url += `state=${encodeURIComponent(state)}&`;
    if (district) url += `district=${encodeURIComponent(district)}&`;
    if (subDistrict) url += `sub_district=${encodeURIComponent(subDistrict)}&`;
    if (village) url += `village=${encodeURIComponent(village)}`;
    
    const response = await api.get(url);
    console.log('Pin codes response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching pin codes:', error);
    // Return fallback data
    return { pin_codes: ['400058', '400050', '400049', '411001', '411045'] };
  }
};

export default {
  getStates,
  getDistricts,
  getSubDistricts,
  getVillages,
  getPinCodes
};
