import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://192.168.100.103:5050',  // твій бекенд
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  console.log('API Request Token:', token);  // Лог токена для перевірки
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;