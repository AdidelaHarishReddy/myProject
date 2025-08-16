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



const getProperties = (filters, token) => {
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

  const config = {};
  if (token) {
    config.headers = {
      'Authorization': `Token ${token}`
    };
  }

  return api.get('', { params, ...config });
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

const deleteProperty = (propertyId, token) => {
  return axios.delete(`${API_URL}${propertyId}/`, {
    headers: { 'Authorization': `Token ${token}` }
  });
};

// New method to get properties created by the current user
const getMyProperties = (token) => {
  return axios.get(`${API_URL}my_properties/`, {
    headers: { 'Authorization': `Token ${token}` }
  });
};

// New method to get a specific property created by the current user
const getMyPropertyDetail = (propertyId, token) => {
  return axios.get(`${API_URL}${propertyId}/my_property_detail/`, {
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

  return axios.get(API_URL, {
    params,
    headers: { 'Authorization': `Token ${token}` }
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
  deleteProperty,
  getMyProperties,
  getMyPropertyDetail,
  getMyPropertiesFiltered,
  shortlistProperty,
  removeShortlist,
  getShortlistedProperties
};
