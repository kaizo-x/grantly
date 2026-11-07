import { useEffect } from 'react';

/**
 * Lock body scrolling while `active` is true.
 *
 * Compensates for the disappearing scrollbar with padding so the underlying
 * layout does not shift when a modal opens (protects against CLS).
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [active]);
}
