import apiClient from './api';

export const CustomerService = {
  updateProfile: async (id: number, data: { first_name?: string; last_name?: string; email?: string }) => {
    return await apiClient.put(`/customers/${id}`, data);
  },

  updatePassword: async (id: number, password: string) => {
    return await apiClient.put(`/customers/${id}`, { password });
  }
};
