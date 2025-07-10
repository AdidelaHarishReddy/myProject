import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/properties/`;

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

  return axios.get(API_URL, { params });
};

const getPropertyById = (id) => {
  return axios.get(`${API_URL}${id}/`);
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
