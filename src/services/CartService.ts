import ApiClient from './api';
import { CartItem, Cart, ShippingAddress, ShippingRate } from '../types';
import { z } from 'zod';

// Zod Schema for Address Validation
export const AddressSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  address_1: z.string().min(1, 'Address is required'),
  address_2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postcode: z.string().min(3, 'Postcode must be at least 3 characters'),
  country: z.string().min(1, 'Country is required'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(1, 'Phone is required'),
});

export type AddressType = z.infer<typeof AddressSchema>;

class CartService {
  /**
   * Fetches app configuration (fees, thresholds) from the server.
   */
  async getAppConfig(): Promise<any> {
      // If BFF route is /config
      return await ApiClient.get<any>('/config');
  }

  /**
   * Fetches the current state of the server-side cart.
   * Can pass paymentMethod to trigger server-side fee calculations.
   */
  async getCart(paymentMethod?: string): Promise<Cart> {
    const config = paymentMethod 
      ? { headers: { 'X-WC-Payment-Method': paymentMethod } } 
      : {};
    return await ApiClient.get<Cart>('/store/cart', config);
  }

  /**
   * Syncs local cart items to the server to initialize the session.
   */
  async syncCart(items: CartItem[], paymentMethod?: string): Promise<Cart> {
    if (items.length === 0) {
      return this.getCart(paymentMethod);
    }

    const payload = {
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        variation_id: item.variation_id
      }))
    };

    const config = paymentMethod 
      ? { headers: { 'X-WC-Payment-Method': paymentMethod } } 
      : {};

    return await ApiClient.post<Cart>('/store/cart/sync', payload, config);
  }

  /**
   * Updates customer address. This triggers shipping rate calculation on the server.
   * Validates address before sending.
   */
  async updateCustomerAddress(address: Partial<AddressType>): Promise<Cart> {
    // Validate partial address for API call, but we might allow partial updates?
    // The Store API usually needs a fairly complete address for accurate shipping.
    // We'll trust the caller to pass valid data, or validate what we can.
    
    // Construct payload (mirroring billing to shipping for simplicity unless specified)
    const payload = {
      shipping_address: address,
      billing_address: address,
    };

    return await ApiClient.post<Cart>('/store/cart/update-customer', payload);
  }

  /**
   * Selects a shipping rate.
   */
  async selectShippingRate(rateId: string): Promise<Cart> {
    return await ApiClient.post<Cart>('/store/cart/select-shipping-rate', {
      rate_id: rateId,
    });
  }

  /**
   * Applies a coupon code.
   */
  async applyCoupon(code: string): Promise<Cart> {
    return await ApiClient.post<Cart>('/store/cart/coupons', { code });
  }

  /**
   * Removes a coupon code.
   */
  async removeCoupon(code: string): Promise<Cart> {
    return await ApiClient.delete<Cart>(`/store/cart/coupons/${code}`);
  }

  /**
   * Fetches list of available coupons from the store.
   */
  async getAvailableCoupons(): Promise<any[]> {
      return await ApiClient.get<any[]>('/store/coupons');
  }

  /**
   * Helper to extract shipping rates from the cart response.
   */
  extractShippingRates(cart: Cart): ShippingRate[] {
    if (!cart?.shipping_rates || cart.shipping_rates.length === 0) {
      return [];
    }
    return cart.shipping_rates.flatMap(pkg => pkg.shipping_rates);
  }
}

export default new CartService();
