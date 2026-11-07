import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * A crash-proof `localStorage` adapter.
 *
 * Browsers can throw on `localStorage` access (private mode, disabled storage,
 * quota exceeded). Every read/write is guarded and falls back to an in-memory
 * map, so the app degrades gracefully instead of white-screening.
 */
const memoryFallback = new Map<string, string>();

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return memoryFallback.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      memoryFallback.set(name, value);
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      memoryFallback.delete(name);
    }
  },
};

export const zustandStorage = createJSONStorage(() => safeStorage);

/** Single storage key for the persisted application state. */
export const APP_STORAGE_KEY = 'grantly.store.v1';

/** Raw key mirroring the active theme, read by the pre-paint script. */
export const THEME_STORAGE_KEY = 'grantly.theme';

export type Theme = 'light' | 'dark';

/** Read the theme the pre-paint script already resolved. */
export function readInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/** Mirror the theme to `<html>` and to the raw key used before first paint. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* Non-fatal: the in-memory class toggle still applies for this session. */
  }
}
