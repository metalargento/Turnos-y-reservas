import axios from 'axios';

// En production, siempre usa Fly.io. En desarrollo, permite localhost
const API_URL = import.meta.env.PROD
  ? 'https://turnos-y-reservas.fly.dev'
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
