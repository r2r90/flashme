import { LoginResponse, MessageResponse } from '../types';
import { apiClient } from './client';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  register: async (
    email: string,
    password: string,
    tenantId: string,
  ): Promise<MessageResponse> => {
    const { data } = await apiClient.post<MessageResponse>('/auth/register', {
      email,
      password,
      tenantId,
    });
    return data;
  },

  verifyEmail: async (token: string): Promise<MessageResponse> => {
    const { data } = await apiClient.post<MessageResponse>(
      '/auth/verify-email',
      { token },
    );
    return data;
  },

  resendVerification: async (email: string): Promise<MessageResponse> => {
    const { data } = await apiClient.post<MessageResponse>(
      '/auth/resend-verification',
      { email },
    );
    return data;
  },
};
