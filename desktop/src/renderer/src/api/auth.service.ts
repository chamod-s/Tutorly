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
    teacherProfile?: {
      id: string;
      bio: string | null;
      subjects: string[];
      qualifications: string[];
      experience: number;
      approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
      isVerified: boolean;
      rejectionReason: string | null;
    } | null;
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
  bio?: string;
  subjects?: string[];
  qualifications?: string[];
  experience?: number;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<{ data: LoginResponse }>('/auth/login', { email, password });
    return response.data.data;
  },

  register: async (data: RegisterPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<{ data: LoginResponse }>('/auth/register', data);
    return response.data.data;
  },

  verifyAccount: async (email: string, code: string): Promise<LoginResponse> => {
    const response = await apiClient.post<{ data: LoginResponse }>('/auth/verify-account', { email, code });
    return response.data.data;
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
