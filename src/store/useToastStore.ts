import { create } from 'zustand';
import type { ToastMessage } from '../types';
import { createId } from '../lib/id';

interface ToastStore {
  toasts: ToastMessage[];
  push: (toast: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: string) => void;
}

/** How long a toast stays on screen before auto-dismissing. */
const TOAST_TTL_MS = 4500;
/** Maximum simultaneous toasts; the oldest is dropped beyond this. */
const MAX_TOASTS = 4;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  push: (toast) => {
    const id = createId('toast');
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }].slice(-MAX_TOASTS) }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((entry) => entry.id !== id) }));
    }, TOAST_TTL_MS);
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((entry) => entry.id !== id) })),
}));

/**
 * Imperative toast API usable from anywhere — including non-React code paths.
 *
 * ```ts
 * toast.success('Saved', 'Application moved to Submitted.');
 * ```
 */
export const toast = {
  success: (title: string, description?: string): void =>
    useToastStore.getState().push({ title, description, variant: 'success' }),
  error: (title: string, description?: string): void =>
    useToastStore.getState().push({ title, description, variant: 'error' }),
  info: (title: string, description?: string): void =>
    useToastStore.getState().push({ title, description, variant: 'info' }),
  warning: (title: string, description?: string): void =>
    useToastStore.getState().push({ title, description, variant: 'warning' }),
};
