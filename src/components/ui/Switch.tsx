import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role' | 'aria-checked' | 'type'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Accessible toggle built on the ARIA `switch` pattern.
 * Callers must supply an accessible name via `aria-label` or `aria-labelledby`.
 */
export function Switch({ checked, onCheckedChange, className, disabled, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-55',
        checked ? 'bg-primary' : 'bg-muted-foreground/35',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
