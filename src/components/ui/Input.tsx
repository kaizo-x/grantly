import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

const CONTROL_CLASSES = [
  'w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground',
  'placeholder:text-muted-foreground/70 transition-colors duration-150',
  'disabled:cursor-not-allowed disabled:opacity-60',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/40',
].join(' ');

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Decorative icon rendered inside the control on the left. */
  leadingIcon?: ReactNode;
  /** Interactive content rendered inside the control on the right. */
  trailingSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leadingIcon, trailingSlot, type = 'text', ...rest },
  ref,
) {
  const control = (
    <input
      ref={ref}
      type={type}
      className={cn(
        CONTROL_CLASSES,
        'h-10',
        leadingIcon && 'pl-9',
        trailingSlot && 'pr-10',
        className,
      )}
      {...rest}
    />
  );

  if (!leadingIcon && !trailingSlot) return control;

  return (
    <div className="relative w-full">
      {leadingIcon ? (
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4"
          aria-hidden="true"
        >
          {leadingIcon}
        </span>
      ) : null}
      {control}
      {trailingSlot ? <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailingSlot}</span> : null}
    </div>
  );
});
