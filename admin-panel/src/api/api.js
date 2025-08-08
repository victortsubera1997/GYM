import axios from 'axios';

// Припускаю, що у тебе є якийсь спосіб отримати токен, наприклад з localStorage
const getToken = () => localStorage.getItem('token');

const api = axios.create({
  baseURL: 'http://192.168.100.103:5050/api',
});

// Додаємо interceptor, щоб підставляти токен в заголовок Authorization
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;