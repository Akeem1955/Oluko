
import apiClient from './apiClient';
import { LoginRequest, SignupRequest, OtpRequest, User } from '@/lib/types';

const AUTH_BASE = '/NeuronFlow/api/v1';

export const authService = {
  signup: async (data: SignupRequest) => {
    const response = await apiClient.post(`${AUTH_BASE}/signup`, data);
    return response.data;
  },

  verifySignup: async (params: OtpRequest) => {
    const otp = encodeURIComponent(params.otp);
    const email = encodeURIComponent(params.email);
    const response = await apiClient.post(`${AUTH_BASE}/verify-signup?otp=${otp}&email=${email}`);
    return response.data as string;
  },

  login: async (data: LoginRequest) => {
    const response = await apiClient.post(`${AUTH_BASE}/login`, data);
    return response.data;
  },

  verifyLogin: async (params: OtpRequest) => {
    const otp = encodeURIComponent(params.otp);
    const email = encodeURIComponent(params.email);
    const response = await apiClient.post(`${AUTH_BASE}/verify-login?otp=${otp}&email=${email}`);
    return response.data as string;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<User>(`${AUTH_BASE}/me`);
    return response.data;
  },

  resetPassword: async (email: string) => {
    const response = await apiClient.post(`${AUTH_BASE}/resetPassword`, { email });
    return response.data;
  },

  verifyResetPassword: async (params: OtpRequest & { newPassword: string }) => {
    const otp = encodeURIComponent(params.otp);
    const email = encodeURIComponent(params.email);
    const newPassword = encodeURIComponent(params.newPassword);
    const response = await apiClient.post(`${AUTH_BASE}/verify-resetPassword?otp=${otp}&email=${email}&newPassword=${newPassword}`);
    return response.data;
  },

  updateProfile: async (data: { base64Image?: string; weeklyGoalHours?: number }) => {
    const response = await apiClient.put(`${AUTH_BASE}/users/me`, data);
    return response.data;
  }
};
