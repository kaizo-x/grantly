import { useMemo } from 'react';
import { INDIAN_SCHOLARSHIPS_DATA } from '../data/scholarships';
import { useAppStore } from '../store/useAppStore';
import { applyFilters, recommend, scoreScholarship, type ScoredScholarship } from '../utils/filter';

/**
 * Every scholarship, enriched with a match score computed against the live
 * student profile. Recomputed only when the profile actually changes.
 */
export function useScoredScholarships(): ScoredScholarship[] {
  const profile = useAppStore((state) => state.profile);
  return useMemo(
    () => INDIAN_SCHOLARSHIPS_DATA.map((scholarship) => scoreScholarship(scholarship, profile)),
    [profile],
  );
}

/** The scored collection with the active discovery filters applied. */
export function useDiscoveryResults(): ScoredScholarship[] {
  const filters = useAppStore((state) => state.filters);
  const scored = useScoredScholarships();
  return useMemo(() => applyFilters(scored, filters), [scored, filters]);
}

/** The top personalised recommendations shown in the dashboard carousel. */
export function useRecommendations(limit = 6): ScoredScholarship[] {
  const scored = useScoredScholarships();
  const savedIds = useAppStore((state) => state.savedIds);
  return useMemo(
    () => recommend(scored.filter((item) => !savedIds.includes(item.scholarship.id)), limit),
    [scored, savedIds, limit],
  );
}

/** Look up a single scored scholarship by id. */
export function useScoredScholarship(id: string | null): ScoredScholarship | undefined {
  const scored = useScoredScholarships();
  return useMemo(
    () => (id ? scored.find((item) => item.scholarship.id === id) : undefined),
    [scored, id],
  );
}
