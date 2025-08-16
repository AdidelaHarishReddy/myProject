import axios from 'axios';

const API_URL = 'http://65.0.20.95:8000/api/properties/';
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



const getProperties = (filters) => {
  const params = new URLSearchParams();
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== '' && filters[key] !== null) {
      if (key === 'areaRange') {
        params.append('area__gte', filters[key][0]);
        params.append('area__lte', filters[key][1]);
      } else if (key === 'priceRange') {
        params.append('price__gte', filters[key][0]);
        params.append('price__lte', filters[key][1]);
      } else if (key === 'sortBy') {
        params.append('sort_by', filters[key]);
      } else {
        params.append(key, filters[key]);
      }
    }
  });

  return api.get(API_URL, { params });
};

const getPropertyById = (id) => {
  return api.get(`${API_URL}${id}/`);
};

const createProperty = (propertyData, token) => {
  return axios.post(API_URL, propertyData, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

const shortlistProperty = (propertyId, token) => {
  return axios.post(
    `${API_URL}${propertyId}/shortlist/`,
    {},
    { headers: { 'Authorization': `Token ${token}` } }
  );
};

const removeShortlist = (propertyId, token) => {
  return axios.delete(
    `${API_URL}${propertyId}/remove_shortlist/`,
    { headers: { 'Authorization': `Token ${token}` } }
  );
};

const getShortlistedProperties = (token) => {
  return axios.get(`${API_URL}shortlisted/`, {
    headers: { 'Authorization': `Token ${token}` }
  });
};

export default {
  getProperties,
  getPropertyById,
  createProperty,
  shortlistProperty,
  removeShortlist,
  getShortlistedProperties
};
