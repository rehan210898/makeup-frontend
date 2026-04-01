import api from './api';
import { Order } from '../types';

export interface ShipmentTracking {
  status: string;
  status_code: number;
  awb: string | null;
  courier: string | null;
  etd: string | null;
  tracking_url: string | null;
  updated_at: string;
  history: { status: string; status_code: number; timestamp: string }[];
}

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

  getShipmentTracking: async (orderId: number): Promise<ShipmentTracking | null> => {
    try {
      const response = await api.get<{ success: boolean; data: ShipmentTracking | null }>(
        `/shiprocket/tracking/${orderId}`
      );
      return response.data;
    } catch {
      return null;
    }
  },
};
