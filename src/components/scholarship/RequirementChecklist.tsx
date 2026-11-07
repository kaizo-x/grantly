import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { percent } from '../../utils/format';
import { Checkbox } from '../ui/Checkbox';
import { Progress, type ProgressTone } from '../ui/Progress';

export interface RequirementChecklistProps {
  /** Ordered requirement labels (the scholarship's required documents). */
  requirements: readonly string[];
  /** Completion map keyed by requirement label. */
  completed: Record<string, boolean>;
  onToggle: (requirement: string) => void;
  /** Prefix for element ids, keeping them unique across the page. */
  idPrefix: string;
  className?: string;
}

/**
 * Turn a requirement label into a valid HTML id fragment.
 * Labels contain spaces and punctuation, neither of which is legal in an id.
 */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Interactive requirement checklist with a live completion progress bar. */
export function RequirementChecklist({
  requirements,
  completed,
  onToggle,
  idPrefix,
  className,
}: RequirementChecklistProps) {
  const doneCount = requirements.filter((requirement) => completed[requirement]).length;
  const completion = percent(doneCount, requirements.length);
  const tone: ProgressTone = completion === 100 ? 'success' : completion >= 50 ? 'primary' : 'warning';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Requirement checklist</span>
          <span className="tabular-nums text-muted-foreground">
            {doneCount}/{requirements.length} complete
          </span>
        </div>
        <Progress value={completion} tone={tone} label="Requirement completion" showValue />
      </div>

      <ul className="flex flex-col gap-1">
        {requirements.map((requirement) => {
          const isDone = Boolean(completed[requirement]);
          return (
            <li
              key={requirement}
              className={cn(
                'flex items-center gap-3 rounded-lg px-2 py-2 transition-colors',
                isDone ? 'bg-success/8' : 'hover:bg-muted',
              )}
            >
              <Checkbox
                id={`${idPrefix}-${slugify(requirement)}`}
                checked={isDone}
                onChange={() => onToggle(requirement)}
                className="flex-1"
                label={
                  <span className={cn('transition-colors', isDone && 'text-muted-foreground line-through')}>
                    {requirement}
                  </span>
                }
              />
              {isDone ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ul>

      <p role="status" aria-live="polite" className="sr-only">
        {doneCount} of {requirements.length} requirements complete.
      </p>
    </div>
  );
}
