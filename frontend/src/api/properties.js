import axios from 'axios';

// Get API URL with fallback
const getAPIUrl = () => {
  const baseUrl = window._env_?.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
  return `${baseUrl}/api/properties/`;
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



const getProperties = (filters, token) => {
  console.log('getProperties called with filters:', filters, 'token:', token ? 'present' : 'none');
  
  const params = new URLSearchParams();
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
      if (key === 'areaRange') {
        params.append('area__gte', filters[key][0]);
        params.append('area__lte', filters[key][1]);
      } else if (key === 'priceRange') {
        params.append('price__gte', filters[key][0]);
        params.append('price__lte', filters[key][1]);
      } else if (key === 'sortBy') {
        params.append('sort_by', filters[key]);
      } else if (key === 'userLatitude') {
        params.append('user_latitude', filters[key]);
      } else if (key === 'userLongitude') {
        params.append('user_longitude', filters[key]);
      } else if (key === 'maxDistance') {
        params.append('max_distance', filters[key]);
      } else {
        params.append(key, filters[key]);
      }
    }
  });

  console.log('API URL:', API_URL);
  console.log('Query params:', params.toString());

  const config = {};
  if (token) {
    config.headers = {
      'Authorization': `Token ${token}`
    };
  }

  return api.get('', { params, ...config });
};

const getPropertyById = (id) => {
  return api.get(`${id}/`);
};

const createProperty = (propertyData, token) => {
  console.log('Creating property with token:', token ? 'Token present' : 'No token');
  console.log('API URL:', API_URL);
  
  return api.post('', propertyData, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

const deleteProperty = (propertyId, token) => {
  return api.delete(`${propertyId}/`, {
    headers: { 'Authorization': `Token ${token}` }
  });
};

const updateProperty = (propertyId, formData, token) => {
  return api.patch(`${propertyId}/`, formData, {
    headers: { 
      'Authorization': `Token ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

// New method to get properties created by the current user
const getMyProperties = (token) => {
  return api.get('my_properties/', {
    headers: { 'Authorization': `Token ${token}` }
  });
};

// New method to get a specific property created by the current user
const getMyPropertyDetail = (propertyId, token) => {
  return api.get(`${propertyId}/my_property_detail/`, {
    headers: { 'Authorization': `Token ${token}` }
  });
};

// Method to get properties with 'my_properties' filter
const getMyPropertiesFiltered = (filters, token) => {
  const params = new URLSearchParams();
  
  // Add the my_properties filter
  params.append('my_properties', 'true');
  
  // Map frontend filter names to backend parameter names
  if (filters.property_type && filters.property_type !== '') {
    params.append('property_type', filters.property_type);
  }
  
  if (filters.priceRange && filters.priceRange.length === 2) {
    if (filters.priceRange[0] > 0) {
      params.append('price__gte', filters.priceRange[0]);
    }
    if (filters.priceRange[1] < 10000000) {
      params.append('price__lte', filters.priceRange[1]);
    }
  }
  
  if (filters.areaRange && filters.areaRange.length === 2) {
    if (filters.areaRange[0] > 0) {
      params.append('area__gte', filters.areaRange[0]);
    }
    if (filters.areaRange[1] < 10000) {
      params.append('area__lte', filters.areaRange[1]);
    }
  }
  
  if (filters.sortBy && filters.sortBy !== 'newest') {
    params.append('sort_by', filters.sortBy);
  }

  console.log('Filter params:', params.toString());

  return api.get('', {
    params,
    headers: { 'Authorization': `Token ${token}` }
  });
};

const shortlistProperty = (propertyId, token) => {
  return api.post(
    `${propertyId}/shortlist/`,
    {},
    { headers: { 'Authorization': `Token ${token}` } }
  );
};

const removeShortlist = (propertyId, token) => {
  return api.delete(
    `${propertyId}/remove_shortlist/`,
    { headers: { 'Authorization': `Token ${token}` } }
  );
};

const getShortlistedProperties = (token) => {
  return api.get('shortlisted/', {
    headers: { 'Authorization': `Token ${token}` }
  });
};

export default {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  getMyPropertyDetail,
  getMyPropertiesFiltered,
  shortlistProperty,
  removeShortlist,
  getShortlistedProperties
};
