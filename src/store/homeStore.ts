import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeLayoutSection, Product } from '../types';

const HOME_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface HomeState {
  layout: HomeLayoutSection[];
  popularProducts: Product[];
  lastUpdated: number | null;
  setHomeData: (layout: HomeLayoutSection[], popularProducts: Product[]) => void;
  setPopularProducts: (products: Product[]) => void;
  isCacheValid: () => boolean;
}

export const useHomeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      layout: [],
      popularProducts: [],
      lastUpdated: null,

      setHomeData: (layout, popularProducts) => set({
        layout,
        popularProducts,
        lastUpdated: Date.now(),
      }),

      setPopularProducts: (products) => set({
        popularProducts: products,
      }),

      // Step 23: TTL invalidation - check if cached layout is stale
      isCacheValid: () => {
        const { lastUpdated } = get();
        if (!lastUpdated) return false;
        return (Date.now() - lastUpdated) < HOME_CACHE_TTL;
      },
    }),
    {
      name: 'home-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
