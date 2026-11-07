import { useEffect, useState } from 'react';

/**
 * Returns a value that only updates after `delay` ms of silence.
 *
 * Used to keep the discovery search input responsive while preventing a
 * re-filter on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
