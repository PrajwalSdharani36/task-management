import api from './api';

export const authService = {
  config: () => api.get('/auth/config'),
  login: (credentials) => api.post('/auth/login', credentials),
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
  updateMe: (payload) => api.patch('/auth/me', payload),
};
