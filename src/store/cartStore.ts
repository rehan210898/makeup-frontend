import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { CartItem, Product, ProductVariation, Coupon, Cart } from '../types';
import { STORAGE_KEYS } from '../constants';

interface CartStore {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  coupons: Coupon[];
  serverTotals: Cart['totals'];
  
  addItem: (
    product: Product, 
    quantity?: number, 
    variationId?: number,
    selectedAttributes?: { [key: string]: string },
    isStitched?: boolean
  ) => boolean;
  removeItem: (productId: number, variationId?: number, isStitched?: boolean) => void;
  updateQuantity: (productId: number, quantity: number, variationId?: number, isStitched?: boolean) => boolean;
  clearCart: () => void;
  getItemQuantity: (productId: number, variationId?: number, isStitched?: boolean) => number;
  isInCart: (productId: number, variationId?: number, isStitched?: boolean) => boolean;
  setServerCart: (cart: Cart) => void;
}

const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => {
    const price = parseFloat(item.product.price) || 0;
    const stitchingCost = item.isStitched ? 35 : 0;
    return total + ((price + stitchingCost) * item.quantity);
  }, 0);
};

const calculateItemCount = (items: CartItem[]): number => {
  return items.reduce((count, item) => count + item.quantity, 0);
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      subtotal: 0,
      coupons: [],
      serverTotals: undefined,

      setServerCart: (cart: Cart) => {
          set({
              coupons: cart.coupons || [],
              serverTotals: cart.totals
          });
      },

      addItem: (product, quantity = 1, variationId, selectedAttributes, isStitched = false) => {
        const state = get();
        // Item uniqueness now depends on product_id, variation_id AND isStitched status
        const existingItem = state.items.find(
          item => item.product_id === product.id && 
                  item.variation_id === variationId &&
                  item.isStitched === isStitched
        );
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        const newTotalQuantity = currentQuantity + quantity;

        // Check if product is in stock
        if (!product.inStock) {
          Toast.show({
            type: 'error',
            text1: 'Out of Stock',
            text2: `${product.name} is currently unavailable`,
            position: 'bottom',
          });
          return false;
        }

        // Check stock quantity limit
        if (product.manageStock && product.stockQuantity !== null) {
          if (newTotalQuantity > product.stockQuantity) {
            Toast.show({
              type: 'error',
            text1: 'Stock Limit Reached',
            text2: `You have reached the available stock limit. You have ${currentQuantity} in cart.`,
            visibilityTime: 3000,
            });
            return false;
          }
        }

        // Check purchase limit (if set on product)
        const maxQuantity = product.maxQuantity || 99;
        if (newTotalQuantity > maxQuantity) {
          Toast.show({
            type: 'error',
            text1: 'Purchase Limit',
            text2: `This item has a limit of ${maxQuantity} per customer`,
            position: 'bottom',
          });
          return false;
        }

        // All checks passed - add to cart
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => item.product_id === product.id && 
                      item.variation_id === variationId &&
                      item.isStitched === isStitched
          );

          let newItems: CartItem[];

          if (existingItemIndex > -1) {
            newItems = [...state.items];
            newItems[existingItemIndex].quantity += quantity;
          } else {
            const newItem: CartItem = {
              product_id: product.id,
              variation_id: variationId,
              quantity,
              product,
              selectedAttributes,
              isStitched,
            };
            newItems = [...state.items, newItem];
          }

          return {
            items: newItems,
            subtotal: calculateSubtotal(newItems),
            itemCount: calculateItemCount(newItems),
            // Reset server totals when local items change as they are stale
            serverTotals: undefined, 
            coupons: [] // Optionally clear coupons on cart change or keep them? WC usually keeps them but validates.
          };
        });

        // Success message with variation info
        const variationText = selectedAttributes 
          ? ` (${Object.values(selectedAttributes).join(', ')})` 
          : '';
        
        Toast.show({
          type: 'success',
          text1: 'Added to Cart',
          text2: `${product.name}${variationText}`,
          position: 'bottom',
        });

        return true;
      },

      removeItem: (productId, variationId, isStitched) => {
        set((state) => {
          const newItems = state.items.filter(
            (item) => !(item.product_id === productId && 
                        item.variation_id === variationId && 
                        // If isStitched is provided, filter exactly, otherwise could be ambiguous but usually passed
                        (isStitched === undefined || item.isStitched === isStitched))
          );

          return {
            items: newItems,
            subtotal: calculateSubtotal(newItems),
            itemCount: calculateItemCount(newItems),
            serverTotals: undefined // Invalidated
          };
        });

        Toast.show({
          type: 'info',
          text1: 'Item Removed',
          text2: 'Item removed from cart',
          position: 'bottom',
        });
      },

      updateQuantity: (productId, quantity, variationId, isStitched) => {
        if (quantity <= 0) {
          get().removeItem(productId, variationId, isStitched);
          return true;
        }

        const state = get();
        const item = state.items.find(
          i => i.product_id === productId && 
               i.variation_id === variationId &&
               (isStitched === undefined || i.isStitched === isStitched)
        );
        
        if (!item) return false;

        const product = item.product;

        // Check stock limit
        if (product.manageStock && product.stockQuantity !== null) {
          if (quantity > product.stockQuantity) {
            Toast.show({
              type: 'error',
                          text1: 'Stock Limit',
                          text2: `You have reached the available stock limit`,
                          visibilityTime: 2000,            });
            return false;
          }
        }

        // Check purchase limit (if set on product)
        const maxQuantity = product.maxQuantity || 99;
        if (quantity > maxQuantity) {
          Toast.show({
            type: 'error',
            text1: 'Purchase Limit',
            text2: `Maximum ${maxQuantity} items per customer`,
            position: 'bottom',
          });
          return false;
        }

        set((state) => {
          const newItems = state.items.map((item) =>
            item.product_id === productId && 
            item.variation_id === variationId &&
            (isStitched === undefined || item.isStitched === isStitched)
              ? { ...item, quantity }
              : item
          );

          return {
            items: newItems,
            subtotal: calculateSubtotal(newItems),
            itemCount: calculateItemCount(newItems),
            serverTotals: undefined // Invalidated
          };
        });

        return true;
      },

      clearCart: () => {
        set({
          items: [],
          itemCount: 0,
          subtotal: 0,
          coupons: [],
          serverTotals: undefined
        });
      },

      getItemQuantity: (productId, variationId, isStitched) => {
        const item = get().items.find(
          (item) => item.product_id === productId && 
                    item.variation_id === variationId &&
                    (isStitched === undefined || item.isStitched === isStitched)
        );
        return item?.quantity || 0;
      },

      isInCart: (productId, variationId, isStitched) => {
        return get().items.some(
          (item) => item.product_id === productId && 
                    item.variation_id === variationId &&
                    (isStitched === undefined || item.isStitched === isStitched)
        );
      },
    }),
    {
      name: STORAGE_KEYS.CART,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.itemCount = calculateItemCount(state.items);
          state.subtotal = calculateSubtotal(state.items);
        }
      },
    }
  )
);