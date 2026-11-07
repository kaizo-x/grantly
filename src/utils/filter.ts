/**
 * Discovery pipeline: score → filter → sort.
 *
 * Kept as pure functions so the results can be memoised and unit-tested
 * independently of React.
 */
import type {
  DeadlineStatus,
  FilterState,
  MatchResult,
  Scholarship,
  StudentProfile,
  UrgencyLevel,
} from '../types';
import { daysUntil } from './format';
import { computeMatch, getDeadlineStatus, getUrgency } from './match';

/** A scholarship enriched with its derived, profile-dependent metrics. */
export interface ScoredScholarship {
  readonly scholarship: Scholarship;
  readonly match: MatchResult;
  readonly days: number;
  readonly urgency: UrgencyLevel;
  readonly deadlineStatus: DeadlineStatus;
}

/** The neutral filter state used on first load and by "Reset". */
export const DEFAULT_FILTERS: FilterState = {
  query: '',
  fields: [],
  educationLevels: [],
  categories: [],
  minAmount: 0,
  maxPercentRequirement: null,
  deadlineStatus: [],
  sortBy: 'match',
};

/** Derive the profile-dependent metrics for a single scholarship. */
export function scoreScholarship(
  scholarship: Scholarship,
  profile: StudentProfile,
): ScoredScholarship {
  const days = daysUntil(scholarship.deadline);
  return {
    scholarship,
    match: computeMatch(scholarship, profile),
    days,
    urgency: getUrgency(days),
    deadlineStatus: getDeadlineStatus(days),
  };
}

/** Case-insensitive, multi-field text search across a scholarship record. */
function matchesQuery(item: ScoredScholarship, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const { scholarship } = item;
  const haystack = [
    scholarship.title,
    scholarship.provider,
    scholarship.category,
    scholarship.educationLevel,
    scholarship.description,
    ...scholarship.fieldOfStudy,
    ...scholarship.eligibility,
  ]
    .join(' ')
    .toLowerCase();
  return needle.split(/\s+/).every((token) => haystack.includes(token));
}

/** Apply the complete filter state to a scored, unfiltered collection. */
export function applyFilters(
  items: readonly ScoredScholarship[],
  filters: FilterState,
): ScoredScholarship[] {
  const filtered = items.filter((item) => {
    const { scholarship } = item;

    if (!matchesQuery(item, filters.query)) return false;

    if (
      filters.fields.length > 0 &&
      !scholarship.fieldOfStudy.some((field) => filters.fields.includes(field))
    ) {
      return false;
    }

    if (filters.educationLevels.length > 0 && !filters.educationLevels.includes(scholarship.educationLevel)) {
      return false;
    }

    if (filters.categories.length > 0 && !filters.categories.includes(scholarship.category)) {
      return false;
    }

    if (filters.minAmount > 0 && scholarship.amount < filters.minAmount) return false;

    if (
      filters.maxPercentRequirement !== null &&
      scholarship.minGpaOrPercent > filters.maxPercentRequirement
    ) {
      return false;
    }

    if (filters.deadlineStatus.length > 0 && !filters.deadlineStatus.includes(item.deadlineStatus)) {
      return false;
    }

    return true;
  });

  return sortItems(filtered, filters.sortBy);
}

/** Sort a scored collection according to the selected strategy. */
export function sortItems(
  items: readonly ScoredScholarship[],
  sortBy: FilterState['sortBy'],
): ScoredScholarship[] {
  const copy = [...items];
  switch (sortBy) {
    case 'match':
      copy.sort((a, b) => b.match.score - a.match.score || a.days - b.days);
      break;
    case 'deadline':
      copy.sort((a, b) => {
        // Closed deadlines sink to the bottom regardless of date.
        const aClosed = a.days < 0 ? 1 : 0;
        const bClosed = b.days < 0 ? 1 : 0;
        return aClosed - bClosed || a.days - b.days;
      });
      break;
    case 'amount-desc':
      copy.sort((a, b) => b.scholarship.amount - a.scholarship.amount);
      break;
    case 'amount-asc':
      copy.sort((a, b) => a.scholarship.amount - b.scholarship.amount);
      break;
    case 'title':
      copy.sort((a, b) => a.scholarship.title.localeCompare(b.scholarship.title));
      break;
  }
  return copy;
}

/** Count how many filters deviate from their default — drives the badge. */
export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.query.trim()) count += 1;
  count += filters.fields.length;
  count += filters.educationLevels.length;
  count += filters.categories.length;
  if (filters.minAmount > 0) count += 1;
  if (filters.maxPercentRequirement !== null) count += 1;
  count += filters.deadlineStatus.length;
  return count;
}

/** Top-N recommendations: highest match that has not yet closed. */
export function recommend(
  items: readonly ScoredScholarship[],
  limit = 5,
): ScoredScholarship[] {
  return items
    .filter((item) => item.days >= 0)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit);
}
