import { apiClient } from './client';
import { Role } from '../store/useAuthStore';

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    role: Role;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  grade?: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: RegisterPayload): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  verifyAccount: async (email: string, code: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/verify-account', { email, code });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyOtp: async (email: string, code: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/verify-otp', { email, code });
    return response.data;
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', { email, code, newPassword });
    return response.data;
  }
};
