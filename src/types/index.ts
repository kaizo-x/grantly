/**
 * GRANTLY — Domain type definitions.
 *
 * All application data contracts live here so that the data layer, the state
 * store and the presentation layer share a single, strictly-typed source of
 * truth. The model is grounded in the Indian higher-education and financial
 * assistance ecosystem: amounts are expressed in Indian Rupees (₹), academic
 * standing is a percentage rather than a 4.0 GPA, and eligibility is judged
 * against annual family income ceilings.
 *
 * `strict` TypeScript is enabled project-wide: there are no `any` types
 * anywhere in this codebase.
 */

/* -------------------------------------------------------------------------- */
/*  Enumerated unions                                                          */
/* -------------------------------------------------------------------------- */

/** Indian higher-education stage a scholarship targets. */
export type EducationLevel = 'Diploma' | 'Undergraduate' | 'Postgraduate' | 'PhD';

/** Funding source behind an Indian scholarship scheme. */
export type ScholarshipCategory = 'Government' | 'Corporate' | 'Merit-Based' | 'Need-Based';

/** Broad discipline a scholarship is restricted to. */
export type FieldOfStudy =
  | 'Engineering'
  | 'Medicine'
  | 'Science'
  | 'Commerce'
  | 'Arts'
  | 'Technology'
  | 'Architecture'
  | 'Pharmacy'
  | 'Computer Science'
  | 'IT'
  | 'Data Science'
  | 'Natural Sciences'
  | 'Basic Sciences'
  | 'Physics'
  | 'Chemistry'
  | 'Mathematics'
  | 'Management'
  | 'MBA'
  | 'PGDM';

/** Column identifiers for the application Kanban board. */
export type ApplicationStage =
  | 'saved'
  | 'in-progress'
  | 'submitted'
  | 'awarded'
  | 'rejected';

/** Category a stored document belongs to inside the Document Locker. */
export type DocumentCategory =
  | 'transcript'
  | 'financial'
  | 'essay'
  | 'recommendation'
  | 'identification'
  | 'portfolio'
  | 'other';

/** Visual urgency bucket derived from a scholarship's deadline. */
export type UrgencyLevel =
  | 'expired'
  | 'critical'
  | 'warning'
  | 'upcoming'
  | 'comfortable';

/** Deadline grouping used by the discovery filters. */
export type DeadlineStatus = 'open' | 'closing-soon' | 'expired';

/** Sort strategies offered on the discovery surface. */
export type SortKey =
  | 'match'
  | 'deadline'
  | 'amount-desc'
  | 'amount-asc'
  | 'title';

/** Active application section within the shell. */
export type ViewKey = 'dashboard' | 'discovery' | 'tracker' | 'documents' | 'profile';

/* -------------------------------------------------------------------------- */
/*  Scholarship                                                                */
/* -------------------------------------------------------------------------- */

/** A verified Indian scholarship scheme. */
export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  category: ScholarshipCategory;
  /** Annual amount in Indian Rupees (₹). */
  amount: number;
  /** ISO-8601 application deadline. */
  deadline: string;
  fieldOfStudy: string[];
  educationLevel: EducationLevel;
  /** Percentage threshold (e.g. 80 for 80%). */
  minGpaOrPercent: number;
  /** Annual family income ceiling in Indian Rupees (₹). */
  maxFamilyIncome: number;
  description: string;
  eligibility: string[];
  documentsRequired: string[];
  officialUrl: string;
}

/* -------------------------------------------------------------------------- */
/*  Student profile                                                            */
/* -------------------------------------------------------------------------- */

/** The student's academic, demographic and financial profile. */
export interface StudentProfile {
  fullName: string;
  email: string;
  /** ISO date of birth; `''` when the student has not provided one. */
  dateOfBirth: string;
  /** Indian state / union territory of residence. */
  state: string;
  /** Aggregate academic percentage (Class 12 or current degree), 0-100. */
  percentage: number;
  educationLevel: EducationLevel;
  fieldOfStudy: FieldOfStudy;
  institution: string;
  graduationYear: number;
  /** Whether the student wishes to be considered for need-based aid. */
  financialNeed: boolean;
  /** Annual family income in Indian Rupees (₹). */
  annualFamilyIncome: number;
  /** Annual cost-of-attendance components, in Indian Rupees (₹). */
  tuition: number;
  housing: number;
  books: number;
  personal: number;
  fees: number;
  /** Aid the student has already secured from other sources, in ₹. */
  otherAid: number;
  bio: string;
}

/* -------------------------------------------------------------------------- */
/*  Documents                                                                  */
/* -------------------------------------------------------------------------- */

/** Metadata for a document held in the Smart Document Locker. */
export interface StoredDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  sizeBytes: number;
  mimeType: string;
  /** ISO timestamp of the upload. */
  uploadedAt: string;
  status: 'verified' | 'pending' | 'missing';
}

/* -------------------------------------------------------------------------- */
/*  Applications                                                               */
/* -------------------------------------------------------------------------- */

/** A tracked application plus its per-requirement checklist state. */
export interface ApplicationRecord {
  scholarshipId: string;
  stage: ApplicationStage;
  /** Map of checklist-item label to completion flag. */
  checklist: Record<string, boolean>;
  notes: string;
  /** ISO timestamp of the last mutation. */
  updatedAt: string;
  /** ISO timestamp set when the application enters the `submitted` column. */
  submittedAt: string | null;
  reminderEnabled: boolean;
}

/** A named, re-runnable discovery query. */
export interface SavedSearch {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*  Filtering & matching                                                       */
/* -------------------------------------------------------------------------- */

/** The complete discovery filter/sort state. */
export interface FilterState {
  query: string;
  fields: string[];
  educationLevels: EducationLevel[];
  categories: ScholarshipCategory[];
  /** Minimum annual amount the student will accept. `0` disables the filter. */
  minAmount: number;
  /** Hide schemes whose percentage requirement exceeds this value. `null` = off. */
  maxPercentRequirement: number | null;
  deadlineStatus: DeadlineStatus[];
  sortBy: SortKey;
}

/** A single weighted criterion outcome contributing to a match score. */
export interface MatchReason {
  readonly label: string;
  readonly detail: string;
  readonly met: boolean;
  readonly weight: number;
}

/** A rendered eligibility-matrix row with a resolved pass/fail state. */
export interface EligibilityCheck {
  readonly label: string;
  readonly requirement: string;
  readonly met: boolean;
}

/** The result of scoring a scholarship against the student profile. */
export interface MatchResult {
  /** Integer percentage in the range 0-100. */
  readonly score: number;
  readonly reasons: readonly MatchReason[];
  readonly eligibility: readonly EligibilityCheck[];
}

/* -------------------------------------------------------------------------- */
/*  UI helpers                                                                 */
/* -------------------------------------------------------------------------- */

/** A transient toast notification. */
export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'info' | 'warning';
}

/** A single line in the AI assistant transcript. */
export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
