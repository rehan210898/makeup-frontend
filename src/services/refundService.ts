import axios from 'axios';
import { API_CONFIG } from '../constants';

export interface CreateRefundParams {
  orderId: number;
  amount: string;
  reason?: string;
  api_refund?: boolean;
  line_items?: {
    id: number; // Order item ID
    quantity: number;
    refund_total?: string;
    refund_tax?: any[];
  }[];
}

export const createOrderRefund = async (params: CreateRefundParams) => {
  try {
    const { orderId, ...data } = params;
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/orders/${orderId}/refunds`,
      data,
      {
        headers: {
          'X-API-Key': API_CONFIG.API_KEY,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
