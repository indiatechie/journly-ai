import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  secondary?: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant, secondary?: string) => void;
  removeToast: (id: string) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, variant = 'success', secondary) => {
    const id = String(++nextId);
    set((s) => ({ toasts: [...s.toasts, { id, message, secondary, variant }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
