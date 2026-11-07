import { memo } from 'react';
import { BookmarkCheck, BookmarkPlus } from 'lucide-react';
import type { ScoredScholarship } from '../../utils/filter';
import { cn } from '../../utils/cn';
import { formatAnnualAmount, hueFor, monogramFor } from '../../utils/format';
import { CATEGORY_TONE } from '../../utils/match';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { MatchRing } from '../ui/MatchRing';
import { CountdownBadge } from './CountdownBadge';

export interface ScholarshipCardProps {
  item: ScoredScholarship;
  saved: boolean;
  tracked: boolean;
  /** Called with the scholarship id so the parent can pass a stable reference. */
  onOpen: (scholarshipId: string) => void;
  /** Called with the scholarship id so the parent can pass a stable reference. */
  onToggleSaved: (scholarshipId: string) => void;
  className?: string;
}

/**
 * Discovery card.
 *
 * Accessibility note — the whole card is clickable via a full-bleed overlay
 * button, while the save control sits above it in the stacking order. The
 * decorative content layer is `pointer-events-none` so that clicks anywhere
 * reach the overlay button, and every control keeps a `focus-visible` ring.
 */
function ScholarshipCardComponent({
  item,
  saved,
  tracked,
  onOpen,
  onToggleSaved,
  className,
}: ScholarshipCardProps) {
  const { scholarship, match, days } = item;
  const visibleFields = scholarship.fieldOfStudy.slice(0, 2);

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm',
        'transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg',
        className,
      )}
    >
      {/* Full-bleed activation target for the detail modal */}
      <button
        type="button"
        onClick={() => onOpen(scholarship.id)}
        aria-label={`View details for ${scholarship.title} from ${scholarship.provider}`}
        className={cn(
          'absolute inset-0 z-0 rounded-xl cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      />

      <div className="pointer-events-none relative z-10 flex flex-1 flex-col gap-4">
        <div className="flex items-start gap-3">
          <Avatar monogram={monogramFor(scholarship.provider)} hue={hueFor(scholarship.id)} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {scholarship.provider}
            </p>
            <h3 className="mt-0.5 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
              {scholarship.title}
            </h3>
          </div>
          <MatchRing score={match.score} size={48} />
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{scholarship.description}</p>

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <dt className="text-muted-foreground">Award</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {formatAnnualAmount(scholarship.amount)}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Education level</dt>
            <dd className="text-muted-foreground">{scholarship.educationLevel}</dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <CountdownBadge days={days} deadline={scholarship.deadline} size="sm" />
          <Badge variant={CATEGORY_TONE[scholarship.category]}>{scholarship.category}</Badge>
          {tracked ? (
            <Badge variant="info">Tracking</Badge>
          ) : null}
          {visibleFields.map((field) => (
            <Badge key={field} variant="outline">
              {field}
            </Badge>
          ))}
        </div>
      </div>

      {/* Keep the save affordance above the overlay button. */}
      <button
        type="button"
        onClick={() => onToggleSaved(scholarship.id)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${scholarship.title} from your shortlist` : `Save ${scholarship.title} to your shortlist`}
        className={cn(
          'pointer-events-auto absolute right-4 top-4 z-20 grid size-8 place-items-center rounded-lg border',
          'transition-colors duration-150',
          saved
            ? 'border-primary/30 bg-primary/12 text-primary'
            : 'border-border bg-card/90 text-muted-foreground hover:bg-muted hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        {saved ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <BookmarkPlus className="size-4" aria-hidden="true" />}
      </button>
    </article>
  );
}

/**
 * Memoised: with stable id-based callbacks from the parent, a re-render caused
 * by unrelated state (typing in the search box, opening a panel) no longer
 * re-renders the entire result grid or carousel.
 */
export const ScholarshipCard = memo(ScholarshipCardComponent);
