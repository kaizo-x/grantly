import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Card } from './Card';

export type StatTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_CLASSES: Record<StatTone, string> = {
  primary: 'bg-primary/12 text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/12 text-danger',
  info: 'bg-info/12 text-info',
  neutral: 'bg-muted text-muted-foreground',
};

export interface StatCardProps {
  label: string;
  value: string;
  /** Secondary line, e.g. "3 due within 14 days". */
  hint?: string;
  icon: ReactNode;
  tone?: StatTone;
  className?: string;
}

/** Compact KPI tile used across the dashboard and tracker headers. */
export function StatCard({ label, value, hint, icon, tone = 'primary', className }: StatCardProps) {
  return (
    <Card className={cn('flex items-center gap-4 p-4', className)}>
      <span
        className={cn('grid size-11 shrink-0 place-items-center rounded-xl [&_svg]:size-5', TONE_CLASSES[tone])}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums text-foreground">{value}</p>
        {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </Card>
  );
}
