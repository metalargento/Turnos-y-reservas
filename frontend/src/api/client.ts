import axios from 'axios';

// Usa URLs relativas para que Vercel pueda redirigir /api/* a Fly.io
// En desarrollo, vite.config.ts proxy maneja el rewrite a localhost:8000
// En producción (Vercel), vercel.json rewrites maneja el rewrite a Fly.io
const API_URL = '/api';

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
