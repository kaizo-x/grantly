import { useCallback, useSyncExternalStore } from 'react';

/** Guard for environments without `window.matchMedia` (SSR, older browsers). */
function canMatch(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

/**
 * Subscribe to a CSS media query.
 *
 * `useSyncExternalStore` is the correct primitive here: it reads the current
 * value during render and re-renders only when the query actually flips, so
 * there is no extra effect pass and no layout thrash. The server snapshot is
 * always `false`, which keeps markup deterministic before hydration.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!canMatch()) return () => {};
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', onStoreChange);
      return () => mediaQuery.removeEventListener('change', onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => (canMatch() ? window.matchMedia(query).matches : false), [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Convenience wrapper for the `lg` breakpoint (1024px). */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
