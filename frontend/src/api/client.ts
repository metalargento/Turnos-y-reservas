import axios from 'axios';

// Detectar si estamos en Vercel production (no localhost)
const isVercelProduction = typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1';

// En Vercel production o con VITE_API_URL explícito, usa esa URL
// En localhost dev, usa localhost
const API_URL = isVercelProduction
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
