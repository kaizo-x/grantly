import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/** Shared interaction + focus-visible contract for every button in the app. */
const BASE_CLASSES = [
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium',
  'transition-[background-color,color,box-shadow,transform] duration-150',
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  '[&_svg]:size-4 [&_svg]:shrink-0',
].join(' ');

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/75',
  outline: 'border border-border bg-card text-foreground hover:bg-muted',
  ghost: 'text-foreground hover:bg-muted',
  danger: 'bg-danger text-danger-foreground shadow-sm hover:bg-danger/90',
  success: 'bg-success text-success-foreground shadow-sm hover:bg-success/90',
  link: 'text-primary underline-offset-4 hover:underline rounded-md',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'size-10 p-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner and marks the control busy/inert. */
  loading?: boolean;
  /** Convenience slot rendered before the label. */
  leftIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, leftIcon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)}
      {...rest}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : leftIcon}
      {children}
    </button>
  );
});
