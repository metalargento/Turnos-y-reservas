/**
 * Cliente axios para endpoints públicos (sin autenticación).
 * A diferencia de apiClient.ts, este NO agrega Authorization header
 * y NO redirige a login en caso de 401.
 */
import axios, { AxiosInstance } from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const publicClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export { publicClient };
