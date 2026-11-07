import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useScrollLock } from '../../hooks/useScrollLock';

export type ModalSize = 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<ModalSize, string> = {
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Sticky action row rendered beneath the scrollable body. */
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
}

/**
 * Accessible modal dialog.
 *
 * - renders in a portal so it escapes any stacking/overflow context,
 * - traps keyboard focus and restores it on close,
 * - closes on Escape and on backdrop click,
 * - locks background scroll without layout shift,
 * - animates in/out with Framer Motion (skipped for reduced-motion users).
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'lg',
  className,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  const containerRef = useFocusTrap<HTMLDivElement>(open);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        createPortal(
          <div
            key="modal"
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
              onClick={onClose}
              aria-hidden="true"
            />

            <motion.div
              ref={containerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descriptionId : undefined}
              tabIndex={-1}
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className={cn(
                'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden',
                'rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl',
                SIZE_CLASSES[size],
                className,
              )}
            >
              <header className="flex items-start gap-4 border-b border-border p-5">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h2 id={titleId} className="text-lg font-semibold tracking-tight text-foreground">
                    {title}
                  </h2>
                  {description ? (
                    <p id={descriptionId} className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground',
                    'transition-colors hover:bg-muted hover:text-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  )}
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>

              {footer ? (
                <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-muted/40 p-4">
                  {footer}
                </footer>
              ) : null}
            </motion.div>
          </div>,
          document.body,
        )
      ) : null}
    </AnimatePresence>
  );
}
