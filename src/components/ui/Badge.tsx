import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-muted text-muted-foreground ring-border',
  primary: 'bg-primary/12 text-primary ring-primary/25',
  success: 'bg-success/12 text-success ring-success/25',
  warning: 'bg-warning/15 text-warning ring-warning/30',
  danger: 'bg-danger/12 text-danger ring-danger/25',
  info: 'bg-info/12 text-info ring-info/25',
  outline: 'bg-transparent text-muted-foreground ring-border',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/** Compact, non-interactive status pill. */
export function Badge({ variant = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        'ring-1 ring-inset [&_svg]:size-3',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
