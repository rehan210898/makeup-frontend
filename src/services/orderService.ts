import api from './api';
import { Order } from '../types';

export const orderService = {
  getOrders: async (customerId: number): Promise<Order[]> => {
    const response = await api.get<{ success: boolean; data: Order[] }>(
      `/orders?customer=${customerId}&status=any&t=${Date.now()}`
    );
    return response.data;
  },

  getOrderById: async (orderId: number): Promise<Order> => {
    const response = await api.get<{ success: boolean; data: Order }>(
      `/orders/${orderId}?t=${Date.now()}`
    );
    return response.data;
  },
};
