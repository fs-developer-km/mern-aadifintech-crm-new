import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('finlead_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    // Only auto-redirect on 401 for protected routes — NOT for login/me/settings checks
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      const skipRedirect = ['/auth/me', '/auth/login', '/settings'].some(u => url.includes(u));
      if (!skipRedirect) {
        localStorage.removeItem('finlead_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
