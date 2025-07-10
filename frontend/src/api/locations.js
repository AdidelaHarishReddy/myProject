import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_BASE_URL}/api/locations/`;

const getStates = () => {
  return axios.get(`${API_URL}states/`).then(res => res.data);
};

const getDistricts = (state) => {
  return axios.get(`${API_URL}districts/?state=${state}`).then(res => res.data);
};

const getSubDistricts = (state, district) => {
  return axios.get(`${API_URL}sub_districts/?state=${state}&district=${district}`)
    .then(res => res.data);
};

const getVillages = (state, district, subDistrict) => {
  return axios.get(
    `${API_URL}villages/?state=${state}&district=${district}&sub_district=${subDistrict}`
  ).then(res => res.data);
};

const getPinCodes = (state, district, subDistrict, village) => {
  let url = `${API_URL}pin_codes/?`;
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
