import { cn } from '../../utils/cn';

export interface SkeletonProps {
  className?: string;
}

/**
 * Loading placeholder.
 *
 * `aria-hidden` keeps it out of the accessibility tree while `role="status"` is
 * announced by the parent container — see `SkeletonList`.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-muted', className)}
    />
  );
}

/** A card-shaped skeleton matching the scholarship card footprint (no CLS). */
export function ScholarshipCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <Skeleton className="size-12 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="mt-auto flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

/** Grid of card skeletons with a polite live-region announcement. */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <span className="sr-only">Loading scholarships…</span>
      {Array.from({ length: count }, (_, index) => (
        <ScholarshipCardSkeleton key={index} />
      ))}
    </div>
  );
}
