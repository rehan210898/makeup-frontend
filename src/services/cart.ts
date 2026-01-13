import ApiClient from './api';
import { CartItem, Cart } from '../types';

/**
 * Syncs the local cart items to the server-side WooCommerce Store API cart.
 * This is necessary because the app maintains a local cart state (zustand/AsyncStorage),
 * but shipping calculation requires the items to be present in the server session.
 */
export const syncCartWithServer = async (items: CartItem[]): Promise<Cart> => {
  if (items.length === 0) {
    // If local cart is empty, we might want to return the empty server cart
    // or clear the server cart (not implemented here for safety)
    return ApiClient.get<Cart>('/store/cart');
  }

  // Payload structure matches what our BFF /store/cart/sync endpoint expects
  const payload = {
    items: items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      variation_id: item.variation_id
    }))
  };

  const response = await ApiClient.post<Cart>('/store/cart/sync', payload);
  return response;
};

export const applyCoupon = async (code: string): Promise<Cart> => {
  const response = await ApiClient.post<Cart>('/store/cart/coupons', { code });
  return response;
};

export const removeCoupon = async (code: string): Promise<Cart> => {
  const response = await ApiClient.delete<Cart>(`/store/cart/coupons/${code}`);
  return response;
};
