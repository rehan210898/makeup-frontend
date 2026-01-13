import { useMutation } from '@tanstack/react-query';
import { startRazorpayCheckout, refundOrder, CheckoutAddress } from '../services/razorpayCheckout';
import Toast from 'react-native-toast-message';

export const useRazorpayPayment = () => {
  const checkoutMutation = useMutation({
    mutationFn: (data: { 
        address: CheckoutAddress, 
        items: any[], 
        shipping_lines?: any[], 
        fee_lines?: any[], 
        coupon_lines?: any[] 
    }) => startRazorpayCheckout(data.address, data.items, data.shipping_lines, data.fee_lines, data.coupon_lines),
    onSuccess: (data) => {
      Toast.show({
        type: 'success',
        text1: 'Payment Successful',
        text2: `Order #${data.orderId} confirmed.`
      });
    },
    onError: (error: any) => {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: error.description || error.message || 'Something went wrong'
      });
    }
  });

  const refundMutation = useMutation({
    mutationFn: (data: { orderId: number, amount: string, reason?: string }) =>
      refundOrder(data.orderId, data.amount, data.reason),
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Refund Initiated',
        text2: 'Amount will be credited in 5-7 days.'
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Refund Failed',
        text2: error.message || 'Could not process refund'
      });
    }
  });

  return {
    startCheckout: checkoutMutation.mutate,
    isProcessing: checkoutMutation.isPending,
    refundOrder: refundMutation.mutate,
    isRefunding: refundMutation.isPending
  };
};
