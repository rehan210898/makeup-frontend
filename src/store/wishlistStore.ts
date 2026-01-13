import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types';
import Toast from 'react-native-toast-message';

interface WishlistState {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const { items } = get();
        if (items.some((item) => item.id === product.id)) return;

        set({ items: [...items, product] });
        Toast.show({
          type: 'success',
          text1: 'Added to Wishlist',
          text2: `${product.name} saved!`,
          position: 'bottom',
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
        Toast.show({
          type: 'info',
          text1: 'Removed from Wishlist',
          position: 'bottom',
        });
      },

      isInWishlist: (productId) => {
        return get().items.some((item) => item.id === productId);
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);