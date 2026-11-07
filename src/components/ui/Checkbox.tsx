import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Visible label rendered beside the control. */
  label?: ReactNode;
}

/** Native checkbox with a custom indicator; fully keyboard operable. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, ...rest },
  ref,
) {
  return (
    <label
      className={cn(
        'group flex cursor-pointer items-start gap-3 text-sm',
        rest.disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            'peer absolute inset-0 size-full cursor-pointer appearance-none rounded-md border border-input bg-card',
            'transition-colors duration-150 checked:border-primary checked:bg-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed',
          )}
          {...rest}
        />
        <Check
          className="pointer-events-none size-3.5 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
          aria-hidden="true"
          strokeWidth={3}
        />
      </span>
      {label ? <span className="leading-5 text-foreground group-hover:text-foreground/90">{label}</span> : null}
    </label>
  );
});
