// my-app/utils/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ВАЖЛИВО: заміни IP на свій локальний, якщо тестуєш на реальному телефоні.
// Або створи my-app/.env та підтягни звідти.
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'http://192.168.100.103:5050'; // <- поміняй на свій IP

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;