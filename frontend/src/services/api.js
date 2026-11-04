import axios from 'axios';

export const TOKEN_KEY = 'tm_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED' ? 'The server took too long to respond' : null) ||
      (!error.response ? 'Cannot reach the server. Is the backend running?' : 'Something went wrong');

    const isAuthCall = error.config?.url?.startsWith('/auth/login') || error.config?.url?.startsWith('/auth/register');
    if (status === 401 && !isAuthCall && onUnauthorized) onUnauthorized(message);

    const normalized = new Error(message);
    normalized.status = status;
    normalized.errors = error.response?.data?.errors;
    return Promise.reject(normalized);
  }
);

export default api;
