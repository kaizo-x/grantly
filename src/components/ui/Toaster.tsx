import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { ToastMessage } from '../../types';
import { cn } from '../../utils/cn';
import { useToastStore } from '../../store/useToastStore';

const VARIANT_META: Record<
  ToastMessage['variant'],
  { icon: typeof Info; accent: string; iconClass: string }
> = {
  success: { icon: CheckCircle2, accent: 'border-l-success', iconClass: 'text-success' },
  error: { icon: XCircle, accent: 'border-l-danger', iconClass: 'text-danger' },
  warning: { icon: AlertTriangle, accent: 'border-l-warning', iconClass: 'text-warning' },
  info: { icon: Info, accent: 'border-l-info', iconClass: 'text-info' },
};

/**
 * Global toast viewport.
 *
 * Rendered once at the app root. The container is a polite live region so
 * assistive technology announces each notification without stealing focus.
 */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toastMessage) => {
          const meta = VARIANT_META[toastMessage.variant];
          const Icon = meta.icon;
          return (
            <motion.div
              key={toastMessage.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 32, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border border-l-4 border-border bg-card p-3.5 shadow-lg',
                meta.accent,
              )}
            >
              <Icon className={cn('mt-0.5 size-5 shrink-0', meta.iconClass)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{toastMessage.title}</p>
                {toastMessage.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{toastMessage.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toastMessage.id)}
                aria-label={`Dismiss notification: ${toastMessage.title}`}
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground',
                  'transition-colors hover:bg-muted hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
