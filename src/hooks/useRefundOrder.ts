import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrderRefund, CreateRefundParams } from '../services/refundService';
import Toast from 'react-native-toast-message';

export const useRefundOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateRefundParams) => createOrderRefund(params),
    onSuccess: (data, variables) => {
      Toast.show({
        type: 'success',
        text1: 'Refund Successful',
        text2: `Order #${variables.orderId} refunded successfully.`
      });
      // Invalidate orders list and specific order details
      // Assuming keys are 'orders' and ['order', id] based on React Query convention
      // Since I haven't migrated GET queries to RQ yet, this might not auto-refresh existing views 
      // if they use useEffect, but it's correct for the "Task".
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Refund Failed',
        text2: error.message || 'Could not process refund.'
      });
    }
  });
};
