import { useCallback, useEffect, useRef, type RefObject } from 'react';

/**
 * Invoke `handler` when a pointer-down occurs outside `ref`, or when Escape is
 * pressed. Used by dropdowns, popovers and the mobile navigation drawer.
 */
export function useDismissable<T extends HTMLElement>(
  active: boolean,
  onDismiss: () => void,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  const stableDismiss = useCallback(() => onDismiss(), [onDismiss]);

  useEffect(() => {
    if (!active) return;

    const handlePointerDown = (event: PointerEvent): void => {
      const node = ref.current;
      if (!node) return;
      if (event.target instanceof Node && !node.contains(event.target)) {
        stableDismiss();
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        stableDismiss();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, stableDismiss]);

  return ref;
}
