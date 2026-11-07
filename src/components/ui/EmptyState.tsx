import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/** Friendly, informative placeholder for empty collections. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-6 py-12 text-center',
        className,
      )}
    >
      <span
        className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
