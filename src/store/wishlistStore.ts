import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';
import Toast from 'react-native-toast-message';

// Step 12: Persist only IDs to reduce AsyncStorage payload (~200 bytes vs ~40KB for 20 items)
interface WishlistState {
  itemIds: number[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      itemIds: [],

      addItem: (product) => {
        const { itemIds } = get();
        if (itemIds.includes(product.id)) return;

        set({ itemIds: [...itemIds, product.id] });
        Toast.show({
          type: 'success',
          text1: 'Added to Wishlist',
          text2: `${product.name} saved!`,
          position: 'bottom',
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          itemIds: state.itemIds.filter((id) => id !== productId),
        }));
        Toast.show({
          type: 'info',
          text1: 'Removed from Wishlist',
          position: 'bottom',
        });
      },

      isInWishlist: (productId) => {
        return get().itemIds.includes(productId);
      },

      clearWishlist: () => set({ itemIds: [] }),
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);