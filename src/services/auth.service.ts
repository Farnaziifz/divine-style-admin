import api from './api';

export interface SendOtpResponse {
  message: string;
  expiresAt: string;
  code?: string; // For dev mode
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    mobile: string;
    role?: string;
    name?: string | null;
    lastName?: string | null;
  };
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    mobile: string;
    role?: string;
    name?: string | null;
    lastName?: string | null;
  };
}

export const authService = {
  sendOtp: async (mobile: string): Promise<SendOtpResponse> => {
    const response = await api.post('/auth/otp', { mobile });
    return response.data;
  },

  verifyOtp: async (mobile: string, code: string): Promise<VerifyOtpResponse> => {
    const response = await api.post('/auth/verify', { mobile, code });
    return response.data;
  },

  login: async (mobile: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { mobile, password });
    return response.data;
  },

  setPassword: async (password: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/set-password', { password });
    return response.data;
  },
  
  refreshToken: async (refreshToken: string) => {
    // This is handled by api.ts interceptor, but exposed here if needed manually
    const response = await api.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
    return response.data;
  }
};
