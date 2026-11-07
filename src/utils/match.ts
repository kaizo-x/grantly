/**
 * The GRANTLY match-score engine.
 *
 * Every scholarship is scored against the student's profile across five
 * weighted criteria totalling 100 points. The engine is deliberately
 * transparent: in addition to a percentage it returns the individual reasons so
 * the UI can explain *why* a scheme matched (or did not).
 *
 * The criteria mirror how Indian scholarship portals actually screen
 * applications: aggregate percentage, education level, discipline, annual
 * family-income ceiling and the application deadline.
 */
import type {
  DeadlineStatus,
  EligibilityCheck,
  MatchReason,
  MatchResult,
  Scholarship,
  ScholarshipCategory,
  StudentProfile,
  UrgencyLevel,
} from '../types';
import { daysUntil, formatCurrency, formatDate } from './format';

/** Weight allocation — must sum to 100. */
const WEIGHTS = {
  academic: 25,
  level: 20,
  field: 20,
  income: 20,
  deadline: 15,
} as const;

/** Badge tone for each funding source, used by the card and detail surfaces. */
export const CATEGORY_TONE: Record<
  ScholarshipCategory,
  'primary' | 'info' | 'success' | 'warning'
> = {
  Government: 'primary',
  Corporate: 'info',
  'Merit-Based': 'success',
  'Need-Based': 'warning',
};

/** Compute the weighted match between a scholarship and a profile. */
export function computeMatch(scholarship: Scholarship, profile: StudentProfile): MatchResult {
  const reasons: MatchReason[] = [];

  /* --- Aggregate percentage -------------------------------------------- */
  const academicMet =
    scholarship.minGpaOrPercent === 0 || profile.percentage >= scholarship.minGpaOrPercent;
  reasons.push({
    label: 'Academic percentage',
    detail:
      scholarship.minGpaOrPercent === 0
        ? 'No minimum percentage required'
        : `Requires ${scholarship.minGpaOrPercent}% — you have ${profile.percentage}%`,
    met: academicMet,
    weight: WEIGHTS.academic,
  });

  /* --- Education level -------------------------------------------------- */
  const levelMet = scholarship.educationLevel === profile.educationLevel;
  reasons.push({
    label: 'Education level',
    detail: levelMet
      ? `${scholarship.educationLevel} is accepted`
      : `Open to ${scholarship.educationLevel} students`,
    met: levelMet,
    weight: WEIGHTS.level,
  });

  /* --- Field of study --------------------------------------------------- */
  const fieldMet = scholarship.fieldOfStudy.includes(profile.fieldOfStudy);
  reasons.push({
    label: 'Field of study',
    detail: fieldMet
      ? `${profile.fieldOfStudy} is eligible`
      : `Restricted to ${scholarship.fieldOfStudy.join(', ')}`,
    met: fieldMet,
    weight: WEIGHTS.field,
  });

  /* --- Annual family income --------------------------------------------- */
  const incomeMet = profile.annualFamilyIncome <= scholarship.maxFamilyIncome;
  reasons.push({
    label: 'Family income',
    detail: incomeMet
      ? `Within the ${formatCurrency(scholarship.maxFamilyIncome)} ceiling`
      : `Requires income at or below ${formatCurrency(scholarship.maxFamilyIncome)}`,
    met: incomeMet,
    weight: WEIGHTS.income,
  });

  /* --- Deadline --------------------------------------------------------- */
  const days = daysUntil(scholarship.deadline);
  const deadlineMet = days >= 0;
  reasons.push({
    label: 'Deadline',
    detail: deadlineMet
      ? `${days} day${days === 1 ? '' : 's'} remaining`
      : 'Application window closed',
    met: deadlineMet,
    weight: WEIGHTS.deadline,
  });

  const earned = reasons.reduce((total, reason) => (reason.met ? total + reason.weight : total), 0);

  return {
    score: Math.round(earned),
    reasons,
    eligibility: buildEligibilityMatrix(scholarship, profile),
  };
}

/**
 * Build the resolved eligibility matrix shown in the detail modal.
 *
 * Rows are derived from the scholarship record — never duplicated in the
 * dataset — and each row carries the resolved pass/fail state for the current
 * student profile.
 */
export function buildEligibilityMatrix(
  scholarship: Scholarship,
  profile: StudentProfile,
): EligibilityCheck[] {
  const days = daysUntil(scholarship.deadline);

  return [
    {
      label: 'Minimum percentage',
      requirement:
        scholarship.minGpaOrPercent === 0
          ? 'No minimum percentage'
          : `${scholarship.minGpaOrPercent}% aggregate`,
      met: scholarship.minGpaOrPercent === 0 || profile.percentage >= scholarship.minGpaOrPercent,
    },
    {
      label: 'Education level',
      requirement: scholarship.educationLevel,
      met: scholarship.educationLevel === profile.educationLevel,
    },
    {
      label: 'Field of study',
      requirement: scholarship.fieldOfStudy.join(', '),
      met: scholarship.fieldOfStudy.includes(profile.fieldOfStudy),
    },
    {
      label: 'Annual family income',
      requirement: `At or below ${formatCurrency(scholarship.maxFamilyIncome)}`,
      met: profile.annualFamilyIncome <= scholarship.maxFamilyIncome,
    },
    {
      label: 'Application deadline',
      requirement: formatDate(scholarship.deadline),
      met: days >= 0,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*  Deadline urgency                                                           */
/* -------------------------------------------------------------------------- */

/** Bucket a day-delta into a visual urgency level. */
export function getUrgency(days: number): UrgencyLevel {
  if (Number.isNaN(days) || days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 21) return 'warning';
  if (days <= 60) return 'upcoming';
  return 'comfortable';
}

/** Bucket a day-delta into a discovery-filter deadline status. */
export function getDeadlineStatus(days: number): DeadlineStatus {
  if (Number.isNaN(days) || days < 0) return 'expired';
  if (days <= 21) return 'closing-soon';
  return 'open';
}

/** Presentation tokens for each urgency level (Tailwind classes + copy). */
export const URGENCY_META: Record<
  UrgencyLevel,
  { label: string; badge: string; dot: string; text: string }
> = {
  expired: {
    label: 'Closed',
    badge: 'bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300',
    dot: 'bg-slate-400',
    text: 'text-slate-500 dark:text-slate-400',
  },
  critical: {
    label: 'Closing soon',
    badge: 'bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  warning: {
    label: 'Approaching',
    badge: 'bg-orange-500/15 text-orange-700 ring-orange-500/30 dark:text-orange-300',
    dot: 'bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
  },
  upcoming: {
    label: 'Open',
    badge: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  comfortable: {
    label: 'Plenty of time',
    badge: 'bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300',
    dot: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
  },
};
