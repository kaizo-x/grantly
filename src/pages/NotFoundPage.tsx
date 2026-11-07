import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, SearchX } from 'lucide-react';
import { cn } from '../utils/cn';

/** Shared styling for the two recovery actions so focus states stay identical. */
const PRIMARY_ACTION = [
  'inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground',
  'transition-colors hover:bg-primary/90',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
].join(' ');

const SECONDARY_ACTION = [
  'inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground',
  'transition-colors hover:bg-muted',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
].join(' ');

/**
 * Fallback view for unmatched routes. Rendered inside the application shell so
 * navigation stays available while the student recovers.
 */
export default function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm"
    >
      <span
        className="grid size-14 place-items-center rounded-full bg-primary/12 text-primary"
        aria-hidden="true"
      >
        <SearchX className="size-7" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 id="not-found-title" className="text-2xl font-semibold tracking-tight text-foreground">
          We could not find that page
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The link may be outdated or the view may have moved. Return to your dashboard, or keep
          exploring awards that fit your profile.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className={PRIMARY_ACTION}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to dashboard
        </Link>
        <Link to="/discover" className={cn(SECONDARY_ACTION)}>
          <Compass className="size-4" aria-hidden="true" />
          Browse scholarships
        </Link>
      </div>
    </section>
  );
}
