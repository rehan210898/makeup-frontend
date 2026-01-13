import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CartService, { AddressType } from '../services/CartService';
import { Cart, CartItem, ShippingRate } from '../types';
import Toast from 'react-native-toast-message';

// Query Key for React Query
export const SERVER_CART_KEY = ['serverCart'];

// Helper to clean HTML entities from WC error messages
const cleanErrorMessage = (msg: string) => {
    if (!msg) return 'Unknown error occurred';
    return msg
        .replace(/&quot;/g, '"')
        .replace(/&#8377;/g, '₹')
        .replace(/&#036;/g, '$')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]*>/g, ''); // strip HTML tags
};

/**
 * Hook to manage server-side cart state.
 * - Syncs local items to server
 * - Fetches shipping rates
 * - Handles address updates and coupon application
 * - Optimistic updates for snappy UI
 */
export const useCartServer = (localItems: CartItem[], defaultPaymentMethod: string = 'razorpay') => {
  const queryClient = useQueryClient();

  // Create a signature for the cart items to trigger refetch when they change
  // Sort items to ensure signature is stable regardless of order
  const cartSignature = localItems
      .slice()
      .sort((a, b) => a.product_id - b.product_id)
      .map(i => `${i.product_id}-${i.variation_id || '0'}-${i.quantity}`)
      .join('|');

  // 1. Initial Sync & Fetch (Primary Source of Truth)
  const { data: cart, isLoading, error, refetch } = useQuery({
    queryKey: [...SERVER_CART_KEY, cartSignature, defaultPaymentMethod],
    queryFn: async () => {
      console.log('🔄 Syncing/Fetching Server Cart...', cartSignature, defaultPaymentMethod);
      return await CartService.syncCart(localItems, defaultPaymentMethod);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 2. Fetch Available Coupons
  const { data: availableCoupons, isLoading: isCouponsLoading } = useQuery({
      queryKey: ['availableCoupons'],
      queryFn: async () => await CartService.getAvailableCoupons(),
      staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Derived State
  const shippingRates = cart ? CartService.extractShippingRates(cart) : [];

  // Helper to update cache manually (Optimistic Update)
  const updateCache = (newCart: Cart) => {
    // Must match the useQuery key exactly!
    const queryKey = [...SERVER_CART_KEY, cartSignature, defaultPaymentMethod];
    console.log('💾 Updating Cache for:', queryKey);
    
    // 1. Optimistic/Immediate Update
    queryClient.setQueryData(queryKey, newCart);
    
    // 2. Invalidate to ensure consistency (refetches in background)
    queryClient.invalidateQueries({ queryKey: SERVER_CART_KEY });
  };

  // Mutations
  const selectRateMutation = useMutation({
    mutationFn: (rateId: string) => CartService.selectShippingRate(rateId),
    onSuccess: (data) => {
        console.log('✅ Shipping Rate Selected.');
        updateCache(data);
    },
    onError: (err: any) => {
        console.error('❌ Rate Selection Failed:', err);
        Toast.show({ type: 'error', text1: 'Shipping Selection Failed', text2: err.message });
    }
  });

  // Auto-select shipping rate if available but not selected
  useEffect(() => {
      if (shippingRates.length > 0 && !selectRateMutation.isPending) {
          const hasSelected = shippingRates.some(r => r.selected);
          if (!hasSelected) {
              console.log('🤖 Auto-selecting initial shipping rate:', shippingRates[0].name);
              selectRateMutation.mutate(shippingRates[0].rate_id);
          }
      }
  }, [shippingRates, selectRateMutation.isPending]);

  const updateAddressMutation = useMutation({
    mutationFn: (address: Partial<AddressType>) => CartService.updateCustomerAddress(address),
    onSuccess: (data) => {
        console.log('✅ Address Updated. Cart Refreshed.');
        updateCache(data);
        
        // Auto-select first rate if none selected (e.g., after address change)
        const rates = CartService.extractShippingRates(data);
        const hasSelected = rates.some(r => r.selected);
        if (rates.length > 0 && !hasSelected) {
            console.log('🤖 Auto-selecting default shipping rate:', rates[0].name);
            selectRateMutation.mutate(rates[0].rate_id);
        }
    },
    onError: (err: any) => {
        console.error('❌ Address Update Failed:', err);
        Toast.show({ type: 'error', text1: 'Address Update Failed', text2: err.message });
    }
  });

  const applyCouponMutation = useMutation({
    mutationFn: (code: string) => CartService.applyCoupon(code),
    onSuccess: (data) => {
        updateCache(data);
        Toast.show({ type: 'success', text1: 'Coupon Applied' });
    },
    onError: (err: any) => {
        const rawMsg = err.response?.data?.message || err.message;
        const cleanMsg = cleanErrorMessage(rawMsg);
        Toast.show({ type: 'error', text1: 'Invalid Coupon', text2: cleanMsg });
    }
  });

  const removeCouponMutation = useMutation({
    mutationFn: (code: string) => CartService.removeCoupon(code),
    onSuccess: (data) => {
        updateCache(data);
        Toast.show({ type: 'info', text1: 'Coupon Removed' });
    },
    onError: (err: any) => {
        Toast.show({ type: 'error', text1: 'Removal Failed', text2: err.message });
    }
  });

  const setPaymentMethodMutation = useMutation({
    mutationFn: (method: string) => CartService.getCart(method),
    onSuccess: updateCache,
    onError: (err: any) => {
        console.error('Failed to set payment method', err);
    }
  });

  return {
    cart,
    shippingRates,
    availableCoupons: availableCoupons || [],
    isLoading: isLoading || updateAddressMutation.isPending || selectRateMutation.isPending || setPaymentMethodMutation.isPending,
    isSyncing: isLoading,
    isCouponsLoading,
    
    // Actions
    updateAddress: updateAddressMutation.mutate,
    updateAddressAsync: updateAddressMutation.mutateAsync,
    
    selectRate: selectRateMutation.mutate,
    selectRateAsync: selectRateMutation.mutateAsync,
    
    applyCoupon: applyCouponMutation.mutate,
    applyCouponAsync: applyCouponMutation.mutateAsync,
    
    removeCoupon: removeCouponMutation.mutate,

    setPaymentMethod: setPaymentMethodMutation.mutate,
    
    // States
    isUpdatingAddress: updateAddressMutation.isPending,
    isSelectingRate: selectRateMutation.isPending,
    isApplyingCoupon: applyCouponMutation.isPending,
    isSettingPayment: setPaymentMethodMutation.isPending,
    
    refetchCart: refetch
  };
};
