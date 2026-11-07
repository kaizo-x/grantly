import { useEffect, useRef } from 'react';

/** Selector matching every natively focusable element. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Trap keyboard focus inside a container while `active` is true.
 *
 * Implements the WAI-ARIA dialog pattern:
 *  - moves focus into the container on activation,
 *  - cycles Tab / Shift+Tab within the container,
 *  - restores focus to the previously focused element on teardown.
 *
 * Returns a ref that must be attached to the container element, which should
 * itself carry `tabIndex={-1}` so it can receive focus when empty.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;
    const node = containerRef.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement,
      );

    // Move focus inside once the container is painted.
    const raf = window.requestAnimationFrame(() => {
      const target = getFocusable()[0] ?? node;
      target.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        node.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey) {
        if (current === first || !node.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last || !node.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [active]);

  return containerRef;
}
