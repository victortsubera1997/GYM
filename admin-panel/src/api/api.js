// admin-panel/src/api/api.js
import axios from 'axios';

// Можна задати через .env файл admin-panel:
// REACT_APP_API_URL=http://192.168.100.103:5050/api
const BASE_URL =
  process.env.REACT_APP_API_URL ||
  'http://localhost:5050/api';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;