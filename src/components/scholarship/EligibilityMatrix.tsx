import { Check, X } from 'lucide-react';
import type { EligibilityCheck } from '../../types';
import { cn } from '../../utils/cn';

export interface EligibilityMatrixProps {
  checks: readonly EligibilityCheck[];
  className?: string;
}

/** Resolved eligibility matrix: every requirement with a pass/fail indicator. */
export function EligibilityMatrix({ checks, className }: EligibilityMatrixProps) {
  const metCount = checks.filter((check) => check.met).length;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="text-sm text-muted-foreground">
        You meet{' '}
        <strong className="font-semibold text-foreground">
          {metCount} of {checks.length}
        </strong>{' '}
        eligibility requirements for this scholarship.
      </p>

      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-3 p-3.5">
            <span
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full',
                check.met ? 'bg-success/15 text-success' : 'bg-danger/12 text-danger',
              )}
              aria-hidden="true"
            >
              {check.met ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">{check.label}</span>
              <span className="block text-xs text-muted-foreground">{check.requirement}</span>
            </span>
            <span
              className={cn(
                'shrink-0 text-xs font-semibold',
                check.met ? 'text-success' : 'text-danger',
              )}
            >
              {check.met ? 'Met' : 'Not met'}
              {/* Explicit text keeps the state perceivable without colour. */}
              <span className="sr-only">: {check.label}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
