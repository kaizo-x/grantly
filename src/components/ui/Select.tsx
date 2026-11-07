import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Options rendered as `<option>` elements, or arbitrary children. */
  children: ReactNode;
}

/**
 * Native select: guaranteed keyboard and screen-reader behaviour with no
 * JavaScript emulation required.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          'h-10 w-full appearance-none rounded-lg border border-input bg-card pl-3 pr-9 text-sm text-foreground',
          'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  );
});
