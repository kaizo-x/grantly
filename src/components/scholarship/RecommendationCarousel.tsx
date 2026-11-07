import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { ScoredScholarship } from '../../utils/filter';
import { cn } from '../../utils/cn';
import { useAppStore } from '../../store/useAppStore';
import { ScholarshipCard } from './ScholarshipCard';

export interface RecommendationCarouselProps {
  items: readonly ScoredScholarship[];
  onOpen: (scholarshipId: string) => void;
  headingId?: string;
  title?: string;
  description?: string;
}

/**
 * Horizontally scrollable row of personalised recommendations.
 *
 * Implemented with native overflow scrolling plus explicit previous/next
 * buttons, so it works with a mouse, a touch swipe and the keyboard alike.
 */
export function RecommendationCarousel({
  items,
  onOpen,
  headingId = 'recommendations-heading',
  title = 'Recommended for you',
  description = 'Ranked by how well each award fits your profile.',
}: RecommendationCarouselProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const savedIds = useAppStore((state) => state.savedIds);
  const applications = useAppStore((state) => state.applications);
  const toggleSaved = useAppStore((state) => state.toggleSaved);

  const syncEdges = useCallback((): void => {
    const node = scrollerRef.current;
    if (!node) return;
    setAtStart(node.scrollLeft <= 4);
    setAtEnd(node.scrollLeft + node.clientWidth >= node.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncEdges();
  }, [items.length, syncEdges]);

  const scrollBy = useCallback((direction: 1 | -1): void => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.max(280, node.clientWidth * 0.8), behavior: 'smooth' });
  }, []);

  const handleScrollLeft = useCallback(() => scrollBy(-1), [scrollBy]);
  const handleScrollRight = useCallback(() => scrollBy(1), [scrollBy]);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2
            id={headingId}
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
          >
            <Sparkles className="size-4.5 text-primary" aria-hidden="true" />
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleScrollLeft}
            disabled={atStart}
            aria-label="Scroll recommendations left"
            className={cn(
              'grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground',
              'transition-colors hover:bg-muted hover:text-foreground',
              'disabled:pointer-events-none disabled:opacity-45',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleScrollRight}
            disabled={atEnd}
            aria-label="Scroll recommendations right"
            className={cn(
              'grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground',
              'transition-colors hover:bg-muted hover:text-foreground',
              'disabled:pointer-events-none disabled:opacity-45',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul
        ref={scrollerRef}
        onScroll={syncEdges}
        className={cn(
          'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2',
          '-mx-1 px-1 [scrollbar-width:thin]',
        )}
      >
        {items.map((item) => (
          <li key={item.scholarship.id} className="w-[min(20rem,82vw)] shrink-0 snap-start">
            <ScholarshipCard
              item={item}
              saved={savedIds.includes(item.scholarship.id)}
              tracked={Boolean(applications[item.scholarship.id])}
              onOpen={onOpen}
              onToggleSaved={toggleSaved}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
