import type { StudentProfile } from '../types';

/**
 * Seed profile used on first run and by the "Reset profile" action.
 *
 * The persona is an Indian undergraduate so that the seeded student produces a
 * legible spread of outcomes against the verified dataset: strong matches
 * (PM-USP CSSS, AICTE Pragati), a near-miss on aggregate marks (INSPIRE SHE
 * requires the top 1%) and a deliberate education-level mismatch (the IDFC
 * FIRST MBA award). That spread makes the match engine immediately readable.
 */
export const DEFAULT_PROFILE: StudentProfile = {
  fullName: 'Ananya Sharma',
  email: 'ananya.sharma@student.in',
  dateOfBirth: '2005-05-14',
  state: 'Maharashtra',
  percentage: 87,
  educationLevel: 'Undergraduate',
  fieldOfStudy: 'Engineering',
  institution: 'VJTI, Mumbai',
  graduationYear: 2027,
  financialNeed: true,
  annualFamilyIncome: 420000,
  tuition: 85000,
  housing: 60000,
  books: 8000,
  personal: 24000,
  fees: 12000,
  otherAid: 20000,
  bio: 'Second-year engineering student from Mumbai focused on accessible computing and public-interest technology.',
};
