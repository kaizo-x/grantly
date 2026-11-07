import type { LabelHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Renders a required-field marker; the input must also set `required`. */
  required?: boolean;
}

export function Label({ className, required = false, children, ...rest }: LabelProps) {
  return (
    <label className={cn('text-sm font-medium text-foreground', className)} {...rest}>
      {children}
      {required ? (
        <span className="ml-0.5 text-danger" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}
