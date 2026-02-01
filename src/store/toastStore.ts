import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

let toastId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastId}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 4000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },
}));

// Helper functions for convenience
export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'success', title, message, duration });
  },
  error: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'error', title, message, duration });
  },
  warning: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'warning', title, message, duration });
  },
  info: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'info', title, message, duration });
  },
};
