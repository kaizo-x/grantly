import { cn } from '../../utils/cn';

export type ProgressTone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASSES: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export interface ProgressProps {
  /** Completion percentage, clamped to 0-100. */
  value: number;
  tone?: ProgressTone;
  /** Accessible label announced by screen readers. */
  label: string;
  /** When true the current value is rendered numerically beside the track. */
  showValue?: boolean;
  className?: string;
}

/** Accessible determinate progress bar built on the native `progressbar` role. */
export function Progress({ value, tone = 'primary', label, showValue = false, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${clamped}% complete`}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', TONE_CLASSES[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showValue ? (
        <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
          {clamped}%
        </span>
      ) : null}
    </div>
  );
}
