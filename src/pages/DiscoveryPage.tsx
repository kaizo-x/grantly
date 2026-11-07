import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { SortKey } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useDiscoveryResults } from '../hooks/useScholarships';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { countActiveFilters } from '../utils/filter';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import { SkeletonGrid } from '../components/ui/Skeleton';
import { FilterPanel } from '../components/scholarship/FilterPanel';
import { LazyScholarshipModal } from '../components/scholarship/LazyScholarshipModal';
import { ScholarshipCard } from '../components/scholarship/ScholarshipCard';

const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: 'match', label: 'Best match' },
  { value: 'deadline', label: 'Deadline: soonest' },
  { value: 'amount-desc', label: 'Award: high to low' },
  { value: 'amount-asc', label: 'Award: low to high' },
  { value: 'title', label: 'Title: A to Z' },
];

/**
 * Simulated first-load window during which skeleton cards are shown.
 * Kept short so it never feels like latency, but long enough to make the
 * loading state (and its zero-CLS, card-shaped placeholders) verifiable.
 */
const HYDRATION_MS = 420;

/**
 * Discovery — the smart match and search surface.
 *
 * A debounced query, a multi-criteria filter rail and a sortable, animated
 * result grid. Every card opens the code-split detail dialog.
 */
export default function DiscoveryPage() {
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  const resetFilters = useAppStore((state) => state.resetFilters);
  const savedIds = useAppStore((state) => state.savedIds);
  const applications = useAppStore((state) => state.applications);
  const toggleSaved = useAppStore((state) => state.toggleSaved);

  const results = useDiscoveryResults();
  const activeCount = countActiveFilters(filters);

  const [showFilters, setShowFilters] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(true);

  /**
   * The input is local so typing stays instant; the value is mirrored into the
   * store after the debounce. `pushedQuery` records the last value this page
   * wrote so the two-way sync cannot loop.
   */
  const [term, setTerm] = useState(filters.query);
  const debouncedTerm = useDebouncedValue(term, 250);
  const pushedQuery = useRef(filters.query);

  useEffect(() => {
    if (debouncedTerm === pushedQuery.current) return;
    pushedQuery.current = debouncedTerm;
    setFilters({ query: debouncedTerm });
  }, [debouncedTerm, setFilters]);

  // Adopt a query set elsewhere (e.g. the global search bar in the top bar).
  useEffect(() => {
    if (filters.query === pushedQuery.current) return;
    pushedQuery.current = filters.query;
    setTerm(filters.query);
  }, [filters.query]);

  useEffect(() => {
    const timer = window.setTimeout(() => setHydrating(false), HYDRATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  /* Stable callbacks keep the memoised result cards from re-rendering on
     unrelated state changes such as typing in the search box. */
  const handleOpen = useCallback((scholarshipId: string) => setActiveId(scholarshipId), []);
  const handleCloseModal = useCallback(() => setActiveId(null), []);
  const handleToggleSaved = useCallback((scholarshipId: string) => toggleSaved(scholarshipId), [toggleSaved]);
  const handleSearchSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  }, []);
  const handleTermChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setTerm(event.target.value.slice(0, 120));
  }, []);
  const handleClearSearch = useCallback(() => setTerm(''), []);
  const handleSortChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => setFilters({ sortBy: event.target.value as SortKey }),
    [setFilters],
  );
  const handleToggleFilters = useCallback(() => setShowFilters((open) => !open), []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Discover scholarships</h1>
            <p className="text-sm text-muted-foreground">
              Every award is scored against your profile, so the strongest matches surface first.
            </p>
          </div>
        </div>

        <form role="search" onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <Label htmlFor="discovery-search" className="sr-only">
              Search scholarships
            </Label>
            <Input
              id="discovery-search"
              name="search"
              type="search"
              value={term}
              onChange={handleTermChange}
              placeholder="Search by scheme, provider, discipline or field…"
              autoComplete="off"
              maxLength={120}
              leadingIcon={<Search />}
              trailingSlot={
                term ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                    className={cn(
                      'grid size-8 place-items-center rounded-md text-muted-foreground',
                      'transition-colors hover:bg-muted hover:text-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : undefined
              }
            />
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="w-48">
              <Label htmlFor="discovery-sort" className="sr-only">
                Sort results
              </Label>
              <Select
                id="discovery-sort"
                name="sort"
                value={filters.sortBy}
                onChange={handleSortChange}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <Button
              variant="outline"
              className="lg:hidden"
              aria-expanded={showFilters}
              aria-controls="discovery-filters"
              onClick={handleToggleFilters}
              leftIcon={<SlidersHorizontal />}
            >
              Filters
              {activeCount > 0 ? (
                <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
                  {activeCount}
                </span>
              ) : null}
            </Button>
          </div>
        </form>
      </header>

      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside
          id="discovery-filters"
          aria-label="Scholarship filters"
          className={cn(
            'lg:sticky lg:top-20 lg:block lg:h-fit lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-1',
            showFilters ? 'block' : 'hidden',
          )}
        >
          <div className="rounded-xl border border-border bg-card p-5">
            <FilterPanel />
          </div>
        </aside>

        {/* `min-h` reserves the results footprint so the footer does not jump
            upward when the skeleton grid is replaced by a shorter result set. */}
        <section aria-label="Search results" className="flex min-h-[24rem] min-w-0 flex-col gap-4">
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            {hydrating
              ? 'Loading scholarships…'
              : `${results.length} scholarship${results.length === 1 ? '' : 's'} match your filters`}
            {!hydrating && activeCount > 0 ? ' · filters applied' : ''}
          </p>

          {hydrating ? (
            <SkeletonGrid count={6} />
          ) : results.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="No scholarships match those filters"
              description="Try widening the award range, removing a discipline, or clearing the deadline filter."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {results.map((item) => (
                  <motion.li
                    key={item.scholarship.id}
                    layout="position"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="[content-visibility:auto] [contain-intrinsic-size:auto_20rem]"
                  >
                    <ScholarshipCard
                      item={item}
                      saved={savedIds.includes(item.scholarship.id)}
                      tracked={Boolean(applications[item.scholarship.id])}
                      onOpen={handleOpen}
                      onToggleSaved={handleToggleSaved}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>
      </div>

      <LazyScholarshipModal scholarshipId={activeId} onClose={handleCloseModal} />
    </div>
  );
}
