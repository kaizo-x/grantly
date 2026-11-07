import { cn } from '../../utils/cn';
import { formatCountdown } from '../../utils/format';
import { getUrgency, URGENCY_META } from '../../utils/match';

export interface CountdownBadgeProps {
  /** Whole days until the deadline; negative when it has passed. */
  days: number;
  /** ISO deadline, used for the machine-readable `dateTime` attribute. */
  deadline: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Deadline countdown pill with an urgency-derived colour treatment. */
export function CountdownBadge({ days, deadline, size = 'md', className }: CountdownBadgeProps) {
  const meta = URGENCY_META[getUrgency(days)];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        meta.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', meta.dot)} aria-hidden="true" />
      <time dateTime={deadline}>{formatCountdown(days)}</time>
    </span>
  );
}
