import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SecureStorageAdapter } from '../utils/SecureStorageAdapter';
import { User, SavedAddress } from '../types';

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  addAddress: (address: SavedAddress) => void;
  removeAddress: (id: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user, token) => set((state) => ({ 
        user: { ...user, savedAddresses: state.user?.savedAddresses || [] }, // Preserve local addresses if any, or init empty
        token, 
        isAuthenticated: true 
      })),

      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),

      updateUser: (updatedUser) => set((state) => ({
        user: state.user ? { ...state.user, ...updatedUser } : null
      })),

      addAddress: (address) => set((state) => {
        if (!state.user) return state;
        const currentAddresses = state.user.savedAddresses || [];
        return {
          user: {
            ...state.user,
            savedAddresses: [...currentAddresses, address]
          }
        };
      }),

      removeAddress: (id) => set((state) => {
        if (!state.user) return state;
        return {
          user: {
            ...state.user,
            savedAddresses: (state.user.savedAddresses || []).filter(a => a.id !== id)
          }
        };
      }),
    }),
    {
      name: 'user-storage-secure', // Changed name to avoid conflicts with old AsyncStorage data
      storage: createJSONStorage(() => SecureStorageAdapter),
    }
  )
);