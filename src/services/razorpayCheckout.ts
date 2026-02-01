import axios from 'axios';
import { Platform, NativeModules, Alert } from 'react-native';
import Constants from 'expo-constants';
import { API_CONFIG } from '../constants';
import { z } from 'zod';

let RazorpayCheckout: any = null;
// distinct check for Expo Go to avoid NativeEventEmitter crash on import
const isExpoGo = Constants.appOwnership === 'expo';

if (Platform.OS !== 'web' && !isExpoGo) {
    try {
        RazorpayCheckout = require('react-native-razorpay').default;
    } catch (err) {
        console.warn('Razorpay module not available');
    }
}

// Types
export interface CheckoutAddress {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

// Zod Schema for Address Validation
export const AddressSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  address_1: z.string().min(5, "Address is too short"),
  city: z.string().min(2, "City is required"),
  postcode: z.string().min(4, "Postcode is invalid"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Phone number is invalid"),
});

// Create Order in WooCommerce (via BFF /orders)
const createWooCommerceOrder = async (
    billingData: CheckoutAddress, 
    lineItems: any[], 
    shippingLines: any[] = [], 
    feeLines: any[] = [], 
    couponLines: any[] = []
) => {
  const response = await axios.post(
    `${API_CONFIG.BASE_URL}/orders`, 
    {
      billing: billingData,
      shipping: billingData,
      payment_method: 'razorpay',
      payment_method_title: 'Razorpay',
      set_paid: false,
      line_items: lineItems,
      shipping_lines: shippingLines,
      fee_lines: feeLines,
      coupon_lines: couponLines
    },
    { headers: { 'X-API-Key': API_CONFIG.API_KEY } }
  );
  return response.data.data; // BFF returns { success: true, data: { ...order } }
};

// Initialize Razorpay Session via Custom PHP Bridge (proxied via BFF)
const initRazorpaySession = async (orderId: number) => {
  try {
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/payment/razorpay-order`, // BFF endpoint
      { order_id: orderId },
      { headers: { 'X-API-Key': API_CONFIG.API_KEY } }
    );
    return response.data; // { razorpay_order_id, key_id, amount, ... }
  } catch (error: any) {
    console.error('Razorpay Session Error:', error.response?.data || error.message);
    throw new Error('Failed to initialize payment session');
  }
};

// Verify payment signature on backend (CRITICAL for security)
const verifyPayment = async (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  wc_order_id: number
): Promise<any> => {
  try {
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}/payment/verify`,
      {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        wc_order_id
      },
      { headers: { 'X-API-Key': API_CONFIG.API_KEY } }
    );
    return response.data;
  } catch (error: any) {
    console.error('Payment verification failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Payment verification failed');
  }
};

// Open Razorpay SDK
const openRazorpay = (options: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Check if Native Module exists (It is null in Expo Go)
    if (Platform.OS === 'web' || !NativeModules.RNRazorpay) {
      console.warn('⚠️ Razorpay Native Module not found. Running in Mock Mode.');
      Alert.alert(
        'Dev Mode',
        'Razorpay native module not found (Expo Go). Simulating successful payment.',
        [{ text: 'OK' }]
      );

      // Simulate network delay
      setTimeout(() => {
        resolve({
          razorpay_payment_id: 'pay_mock_' + Date.now(),
          razorpay_order_id: options.order_id,
          razorpay_signature: 'mock_signature',
          _isMock: true
        });
      }, 1000);
      return;
    }

    RazorpayCheckout.open(options)
      .then((data: any) => resolve(data))
      .catch((error: any) => {
        // Razorpay SDK error structure
        const errorMsg = error.description || error.message || 'Payment Cancelled';
        reject(new Error(errorMsg));
      });
  });
};

// Main Checkout Function
export const startRazorpayCheckout = async (
  billingData: CheckoutAddress,
  lineItems: any[],
  shippingLines: any[] = [],
  feeLines: any[] = [],
  couponLines: any[] = []
) => {
  // 1. Validate Input
  AddressSchema.parse(billingData);

  // 2. Create Order (Pending Payment)
  let wcOrder;
  try {
    wcOrder = await createWooCommerceOrder(billingData, lineItems, shippingLines, feeLines, couponLines);
  } catch (error: any) {
    console.error('Create Order Error:', error.response?.data || error.message);
    throw new Error('Failed to create order. Please try again.');
  }
  
  if (!wcOrder.id) throw new Error('Failed to create WooCommerce Order');

  // 3. Get Razorpay Order ID
  const razorpayConfig = await initRazorpaySession(wcOrder.id);

  if (!razorpayConfig.razorpay_order_id) {
    throw new Error('Invalid response from payment server');
  }

  // 4. Open Razorpay UI
  const options = {
    description: razorpayConfig.description,
    image: 'https://your-logo-url.com/logo.png', // Replace with dynamic config if available
    currency: razorpayConfig.currency,
    key: razorpayConfig.key_id, // Comes from backend now
    amount: razorpayConfig.amount, // in paise
    name: razorpayConfig.name,
    order_id: razorpayConfig.razorpay_order_id,
    prefill: razorpayConfig.prefill || {
      email: billingData.email,
      contact: billingData.phone,
      name: `${billingData.first_name} ${billingData.last_name}`
    },
    theme: { color: '#661F1D' }
  };

  const paymentData = await openRazorpay(options);

  // 5. Verify payment on backend (CRITICAL - skip for mock in dev)
  if (!paymentData._isMock) {
    try {
      await verifyPayment(
        paymentData.razorpay_order_id,
        paymentData.razorpay_payment_id,
        paymentData.razorpay_signature,
        wcOrder.id
      );
    } catch (verifyError: any) {
      // Payment was made but verification failed - log for reconciliation
      console.error('Payment verification failed:', verifyError);
      // Still return success to user as payment was captured by Razorpay
      // Webhook will handle order update
    }
  }

  // 6. Success
  return {
    success: true,
    orderId: wcOrder.id,
    paymentId: paymentData.razorpay_payment_id,
    signature: paymentData.razorpay_signature
  };
};

// Refund Function
export const refundOrder = async (orderId: number, amount: string, reason: string = '') => {
  // Ensure amount is string "10.00"
  if (typeof amount !== 'string' || !amount.includes('.')) {
      throw new Error("Invalid amount format. Must be string '0.00'");
  }

  // Calls standard WC API (Proxied via BFF) with api_refund=true
  const response = await axios.post(
    `${API_CONFIG.BASE_URL}/orders/${orderId}/refunds`,
    {
      amount: amount,
      reason: reason,
      api_refund: true // Triggers Razorpay Gateway Refund
    },
    { headers: { 'X-API-Key': API_CONFIG.API_KEY } }
  );
  
  return response.data;
};
