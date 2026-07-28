import axios from 'axios';
import { clearAuthSession, getStoredAccessToken, getStoredRefreshToken, persistAuthSession } from '@/lib/authStorage';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (import.meta.env.DEV) {
      console.error('API Error:', error.response?.data || error.message);
    }
    const originalRequest = error.config;

    // Skip auto-refresh redirect for the login endpoint itself
    const isLoginRequest = originalRequest.url?.includes('/auth/login');

    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true;
      const refreshToken = getStoredRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await api.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = data.data;
          persistAuthSession({ accessToken, refreshToken: newRefreshToken });
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          clearAuthSession();
          if (!isLoginRequest) window.location.href = '/login';
        }
      } else if (!isLoginRequest) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
