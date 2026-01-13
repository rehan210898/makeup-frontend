import axios from 'axios';
import { API_CONFIG } from '../constants';

const authClient = axios.create({
  baseURL: API_CONFIG.BASE_URL + '/auth',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_CONFIG.API_KEY,
  },
});

export const AuthService = {
  checkEmail: async (email: string) => {
    try {
      const response = await authClient.post('/check-email', { email });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Network error' };
    }
  },

  generateUsername: async (firstName: string, lastName: string, email: string) => {
    const response = await authClient.post('/generate-username', { firstName, lastName, email });
    return response.data;
  },

  checkUsername: async (username: string) => {
    const response = await authClient.post('/check-username', { username });
    return response.data;
  },

  register: async (data: any) => {
    try {
      const response = await authClient.post('/register', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  login: async (data: any) => {
    try {
      const response = await authClient.post('/login', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  resendVerification: async (email: string) => {
    const response = await authClient.post('/resend-verification', { email });
    return response.data;
  },

  verifyEmailToken: async (token: string) => {
    try {
      const response = await authClient.get(`/verify-email/${token}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'Verification failed' };
    }
  },

  getGoogleAuthUrl: () => `${API_CONFIG.BASE_URL}/auth/google`,
};

