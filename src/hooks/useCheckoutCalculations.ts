import { useQuery } from '@tanstack/react-query';
import CartService from '../services/CartService';
import { Cart, ShippingRate } from '../types';

/**
 * Hook to handle all pricing calculations for the checkout.
 * Centralizes logic for Subtotal, Shipping, COD Fees, and Totals.
 */
export const useCheckoutCalculations = (
    serverCart: Cart | undefined,
    localSubtotal: number,
    shippingRates: ShippingRate[],
    paymentMethod: 'cod' | 'card'
) => {
    // Fetch App Config (Fees, Thresholds) from Server
    const { data: appConfig } = useQuery({
        queryKey: ['appConfig'],
        queryFn: async () => await CartService.getAppConfig(),
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    // Configuration Defaults
    const CONFIG_COD_FEE = parseFloat(appConfig?.cod_fee || 20);
    const CONFIG_THRESHOLD = parseFloat(appConfig?.free_shipping_threshold || 500);
    const CONFIG_SHIPPING = parseFloat(appConfig?.shipping_cost || 79);

    const getCurrency = () => serverCart?.totals?.currency_symbol || '₹';

    // Subtotal: Prefer Server Calculation > Local Calculation
    const getEffectiveSubtotal = () => {
        return serverCart?.totals 
            ? (parseInt(serverCart.totals.total_items) / 100) 
            : localSubtotal;
    };

    // Shipping Cost Calculation
    const getShippingCostValue = () => {
        const subtotal = getEffectiveSubtotal();
        // Rule 1: Free Shipping Threshold
        if (subtotal >= CONFIG_THRESHOLD) return 0;

        // Rule 2: Selected Rate from Server
        const selected = shippingRates.find(r => r.selected);
        if (selected) return parseInt(selected.price) / 100;

        // Rule 3: Fallback to First Rate or Default Config
        if (shippingRates.length > 0) return parseInt(shippingRates[0].price) / 100;
        return CONFIG_SHIPPING;
    };

    // COD Fee Calculation
    const getCodFeeAmount = () => {
        // Rule 1: Server Authority (If fee exists in cart)
        if (serverCart?.fees) {
            const fee = serverCart.fees.find(f => f.name.toLowerCase().includes('cod'));
            if (fee) return parseInt(fee.totals.total);
        }
        if (serverCart?.totals?.total_fees && parseInt(serverCart.totals.total_fees) > 0) {
            // Note: This might include other fees, but simplified for now
            return parseInt(serverCart.totals.total_fees);
        }

        // Rule 2: Client Prediction (Fallback)
        const subtotal = getEffectiveSubtotal();
        if (subtotal < CONFIG_THRESHOLD) {
            return CONFIG_COD_FEE * 100; // Convert to cents
        }
        return 0;
    };

    // Total Calculation with Heuristics for Server Lag
    const getTotal = () => {
        let total = 0;
        const codFee = getCodFeeAmount();
        const shipping = getShippingCostValue();

        if (serverCart && serverCart.totals) {
            total = parseInt(serverCart.totals.total_price);
            
            // Heuristic: Add local COD fee if server hasn't applied it yet (lag)
            const serverHasFee = parseInt(serverCart.totals.total_fees || '0') > 0;
            if (!serverHasFee && paymentMethod === 'cod' && codFee > 0) {
                total += codFee;
            }

            // Heuristic: Remove COD fee visually if switched to Card but server still has it
            if (paymentMethod === 'card' && serverHasFee) {
                 const codFeeInCart = serverCart.fees?.find(f => f.name.toLowerCase().includes('cod'));
                 if (codFeeInCart) total -= parseInt(codFeeInCart.totals.total);
            }

            // Heuristic: Add shipping if server shows 0 but we expect shipping cost
            const serverHasShipping = parseInt(serverCart.totals.total_shipping || '0') > 0;
            if (!serverHasShipping && shipping > 0) {
                 total += (shipping * 100);
            }
        } else {
            // Fully Local Fallback
            total = localSubtotal * 100;
            if (paymentMethod === 'cod' && codFee > 0) total += codFee;
            total += (shipping * 100);
        }
        return (total / 100).toFixed(2);
    };

    // Coupon Fees (Negative Fees Workaround for 500 Error)
    const couponFees = serverCart?.coupons?.map(c => ({
        name: `Discount (${c.code})`,
        total: `-${(parseInt(c.totals.total_discount) / 100).toFixed(2)}`,
        tax_status: 'none',
        tax_class: ''
    })) || [];

    return {
        getCurrency,
        getEffectiveSubtotal,
        getShippingCostValue,
        getShippingCost: () => {
            const val = getShippingCostValue();
            return val === 0 ? 'Free' : `${getCurrency()} ${val.toFixed(2)}`;
        },
        getCodFeeAmount,
        getTotal,
        couponFees,
        config: {
            codFee: CONFIG_COD_FEE,
            freeShippingThreshold: CONFIG_THRESHOLD
        }
    };
};
