import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface SectionHeadingProps {
  title: string;
  description?: string;
  /** Heading level, so the document outline stays semantically correct. */
  as?: 'h1' | 'h2' | 'h3';
  action?: ReactNode;
  className?: string;
}

/** Consistent section header: title, supporting copy and an optional action. */
export function SectionHeading({ title, description, as: Tag = 'h2', action, className }: SectionHeadingProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <Tag className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</Tag>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}
