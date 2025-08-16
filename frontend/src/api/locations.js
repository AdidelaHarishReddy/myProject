import axios from 'axios';

const API_URL = 'http://65.0.20.95:8000/api/locations/';

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

const getStates = () => {
  return api.get(`states/`).then(res => res.data);
};

const getDistricts = (state) => {
  return api.get(`districts/?state=${state}`).then(res => res.data);
};

const getSubDistricts = (state, district) => {
  return api.get(`sub_districts/?state=${state}&district=${district}`)
    .then(res => res.data);
};

const getVillages = (state, district, subDistrict) => {
  return api.get(
    `villages/?state=${state}&district=${district}&sub_district=${subDistrict}`
  ).then(res => res.data);
};

const getPinCodes = (state, district, subDistrict, village) => {
  let url = `pin_codes/?`;
  if (state) url += `state=${state}&`;
  if (district) url += `district=${district}&`;
  if (subDistrict) url += `sub_district=${subDistrict}&`;
  if (village) url += `village=${village}`;
  
  return axios.get(url).then(res => res.data);
};

export default {
  getStates,
  getDistricts,
  getSubDistricts,
  getVillages,
  getPinCodes
};
