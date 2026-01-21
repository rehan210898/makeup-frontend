import apiClient from './api';

export const CustomerService = {
  getProfile: async (id: number) => {
    return await apiClient.get(`/customers/${id}`);
  },

  updateProfile: async (id: number, data: { first_name?: string; last_name?: string; email?: string }) => {
    return await apiClient.put(`/customers/${id}`, data);
  },

  updatePassword: async (id: number, password: string) => {
    return await apiClient.put(`/customers/${id}`, { password });
  }
};
