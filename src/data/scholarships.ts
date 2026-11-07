/**
 * GRANTLY verified Indian scholarship dataset.
 *
 * Every entry below models a real scheme run by the Ministry of Education, a
 * national regulator or an Indian corporate CSR foundation. Amounts are the
 * published *annual* award in Indian Rupees (₹), academic standing is an
 * aggregate percentage (not a 4.0 GPA) and eligibility is bounded by an annual
 * family-income ceiling expressed in rupees — mirroring how the National
 * Scholarship Portal (NSP) actually adjudicates applications.
 */
import type { EducationLevel, FieldOfStudy, Scholarship, ScholarshipCategory } from '../types';

/* -------------------------------------------------------------------------- */
/*  Selectable vocabularies                                                    */
/* -------------------------------------------------------------------------- */

/** Education levels a scheme can target, in ascending academic order. */
export const EDUCATION_LEVELS: readonly EducationLevel[] = [
  'Diploma',
  'Undergraduate',
  'Postgraduate',
  'PhD',
];

/** Funding sources behind Indian scholarship schemes. */
export const SCHOLARSHIP_CATEGORIES: readonly ScholarshipCategory[] = [
  'Government',
  'Corporate',
  'Merit-Based',
  'Need-Based',
];

/** Disciplines used by the profile hub and the discovery filters. */
export const FIELDS_OF_STUDY: readonly FieldOfStudy[] = [
  'Engineering',
  'Medicine',
  'Science',
  'Commerce',
  'Arts',
  'Technology',
  'Architecture',
  'Pharmacy',
  'Computer Science',
  'IT',
  'Data Science',
  'Natural Sciences',
  'Basic Sciences',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Management',
  'MBA',
  'PGDM',
];

/** Indian states and union territories, used by the profile hub. */
export const INDIAN_STATES: readonly string[] = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

/* -------------------------------------------------------------------------- */
/*  Dataset                                                                    */
/* -------------------------------------------------------------------------- */

export const INDIAN_SCHOLARSHIPS_DATA: Scholarship[] = [
  {
    id: 'nsp-pm-usp-2026',
    title: 'PM-USP Central Sector Scheme of Scholarship (CSSS)',
    provider: 'Ministry of Education, Govt. of India',
    category: 'Government',
    amount: 12000,
    deadline: '2026-11-30',
    fieldOfStudy: ['Engineering', 'Medicine', 'Science', 'Commerce', 'Arts'],
    educationLevel: 'Undergraduate',
    minGpaOrPercent: 80,
    maxFamilyIncome: 450000,
    description:
      'Financial assistance for meritorious students from economically weaker sections to pursue higher education in recognized Indian institutions.',
    eligibility: [
      'Above 80th percentile in Class 12 Board Examination',
      'Annual family income less than ₹4.5 Lakhs',
      'Enrolled in regular full-time degree courses',
    ],
    documentsRequired: [
      'Class 12 Board Marksheet',
      'Aadhaar Card',
      'Competent Authority Income Certificate',
      'Bank Passbook (Aadhaar Seeded)',
    ],
    officialUrl: 'https://scholarships.gov.in',
  },
  {
    id: 'aicte-pragati-girls',
    title: 'AICTE Pragati Scholarship for Girl Students',
    provider: 'All India Council for Technical Education (AICTE)',
    category: 'Government',
    amount: 50000,
    deadline: '2026-12-15',
    fieldOfStudy: ['Engineering', 'Technology', 'Architecture', 'Pharmacy'],
    educationLevel: 'Undergraduate',
    minGpaOrPercent: 60,
    maxFamilyIncome: 800000,
    description:
      'Empowering female students pursuing technical degree and diploma courses in AICTE-approved institutions across India.',
    eligibility: [
      'Female student admitted to 1st year B.E./B.Tech/Diploma',
      'Maximum 2 girls per family eligible',
      'Annual family income less than ₹8 Lakhs',
    ],
    documentsRequired: [
      'SSC & HSC Marksheets',
      'College Admission Letter',
      "Parents' Income Certificate",
      'Aadhaar Card',
    ],
    officialUrl: 'https://www.aicte-india.org',
  },
  {
    id: 'reliance-foundation-ug',
    title: 'Reliance Foundation Undergraduate Scholarship',
    provider: 'Reliance Foundation',
    category: 'Corporate',
    amount: 200000,
    deadline: '2026-10-31',
    fieldOfStudy: ['Engineering', 'Computer Science', 'IT', 'Data Science', 'Natural Sciences'],
    educationLevel: 'Undergraduate',
    minGpaOrPercent: 60,
    maxFamilyIncome: 1500000,
    description:
      'Nurturing promising undergraduates with financial support, leadership development, and alumni network access.',
    eligibility: [
      'Indian citizen residing in India',
      'Enrolled in 1st year full-time undergraduate degree program',
      'Passed Class 12 with minimum 60% aggregate',
    ],
    documentsRequired: [
      'Class 10 & 12 Board Certificates',
      'Income Proof / Ration Card',
      'Bonafide Student Certificate from College',
    ],
    officialUrl: 'https://www.scholarships.reliancefoundation.org',
  },
  {
    id: 'inspire-she-dst',
    title: 'INSPIRE Scholarship for Higher Education (SHE)',
    provider: 'Department of Science & Technology (DST), Govt. of India',
    category: 'Merit-Based',
    amount: 80000,
    deadline: '2026-12-31',
    fieldOfStudy: ['Basic Sciences', 'Natural Sciences', 'Physics', 'Chemistry', 'Mathematics'],
    educationLevel: 'Undergraduate',
    minGpaOrPercent: 90,
    maxFamilyIncome: 9900000,
    description:
      'Encouraging meritorious students to pursue research and studies in Natural and Basic Sciences.',
    eligibility: [
      'Top 1% rank in Class 12 Board Exams',
      'Enrolled in B.Sc. / B.S. / Integrated M.Sc. in basic sciences',
      'Top rank holders in JEE Advanced / NEET / KVPY',
    ],
    documentsRequired: [
      'Class 12 Marksheet',
      'Endorsement Certificate signed by Head of Institution',
      'Aadhaar Card',
    ],
    officialUrl: 'https://online-inspire.gov.in',
  },
  {
    id: 'idfc-first-bank-mba',
    title: 'IDFC FIRST Bank Education Scholarship',
    provider: 'IDFC FIRST Bank CSR',
    category: 'Corporate',
    amount: 100000,
    deadline: '2026-11-15',
    fieldOfStudy: ['Management', 'MBA', 'PGDM'],
    educationLevel: 'Postgraduate',
    minGpaOrPercent: 60,
    maxFamilyIncome: 600000,
    description:
      'Financial assistance for meritorious students from financially challenged backgrounds enrolled in MBA programs.',
    eligibility: [
      'Enrolled in 1st year of 2-year full-time MBA/PGDM program',
      'Admitted to eligible partner MBA colleges in India',
      'Annual family income less than ₹6 Lakhs',
    ],
    documentsRequired: [
      'Graduation Marksheet',
      'CAT / CET / CMAT Scorecard',
      'College Admission Fee Receipt',
      'Parent Income Certificate / ITR',
    ],
    officialUrl: 'https://www.idfcfirstbank.com',
  },
];

/** Look up a scholarship by id. */
export function getScholarshipById(id: string): Scholarship | undefined {
  return INDIAN_SCHOLARSHIPS_DATA.find((scholarship) => scholarship.id === id);
}

/** The largest published annual award, used to bound the amount filter. */
export const MAX_SCHOLARSHIP_AMOUNT: number = INDIAN_SCHOLARSHIPS_DATA.reduce(
  (max, scholarship) => Math.max(max, scholarship.amount),
  0,
);
