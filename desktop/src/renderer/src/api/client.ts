import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Default backend port is 5000, modify if env variables exist
const API_URL = 'http://127.0.0.1:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // If the server returns a 401, the token is expired or invalid
    if (error.response?.status === 401) {
      const logout = useAuthStore.getState().logout;
      logout();
      
      // Optionally redirect to login, though the ProtectedRoute 
      // will handle this automatically when state clears.
      window.location.hash = '#/auth/login';
    }
    return Promise.reject(error);
  }
);
