import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeLayoutSection, Product } from '../types';

interface HomeState {
  layout: HomeLayoutSection[];
  popularProducts: Product[];
  lastUpdated: number | null;
  setHomeData: (layout: HomeLayoutSection[], popularProducts: Product[]) => void;
  setPopularProducts: (products: Product[]) => void;
}

export const useHomeStore = create<HomeState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'home-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
