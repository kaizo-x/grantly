/**
 * Essay Coach — deterministic outline generation.
 *
 * This is an interactive *mock*: no network request is made and no model is
 * called. The generator is a pure function so it is trivially testable and can
 * never block the main thread or leak the student's data off-device.
 */
import type { StudentProfile } from '../types';
import { sanitizeText } from './sanitize';

export interface OutlineSection {
  readonly heading: string;
  readonly purpose: string;
  readonly beats: readonly string[];
}

export interface EssayOutline {
  readonly title: string;
  readonly prompt: string;
  readonly sections: readonly OutlineSection[];
  readonly closingTip: string;
}

/** Themes the generator looks for in the prompt so the guidance stays on-topic. */
const THEME_HINTS: ReadonlyArray<{ match: RegExp; value: string }> = [
  { match: /communit|service|volunteer/i, value: 'community impact' },
  { match: /research|science|lab|discover/i, value: 'research curiosity' },
  { match: /leader|team|captain|mentor/i, value: 'leadership' },
  { match: /need|financial|afford|cost|fund|income/i, value: 'financial need' },
  { match: /first-generation|rural|village|family|resilien/i, value: 'resilience and identity' },
  { match: /teach|educat|school|student/i, value: 'shaping learners' },
  { match: /build|startup|business|venture|found/i, value: 'entrepreneurial drive' },
  { match: /health|patient|clinic|medicine/i, value: 'patient-centred care' },
];

/** Trim a prompt down to a short, display-safe title. */
function deriveTitle(prompt: string): string {
  const cleaned = sanitizeText(prompt).replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Scholarship essay outline';
  const firstSentence = cleaned.split(/[.?!]/)[0] ?? cleaned;
  const trimmed = firstSentence.length > 72 ? `${firstSentence.slice(0, 69)}…` : firstSentence;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Detect the dominant themes present in the prompt. */
function detectThemes(prompt: string): string[] {
  const found = THEME_HINTS.filter((hint) => hint.match.test(prompt)).map((hint) => hint.value);
  return found.length > 0 ? found.slice(0, 3) : ['personal growth'];
}

/**
 * Build a structured, five-part outline for the supplied prompt and profile.
 */
export function buildEssayOutline(prompt: string, profile: StudentProfile, wordLimit = 600): EssayOutline {
  const safePrompt = sanitizeText(prompt);
  const themes = detectThemes(safePrompt);
  const primaryTheme = themes[0];
  const perSection = Math.max(80, Math.round(wordLimit / 5));

  const sections: OutlineSection[] = [
    {
      heading: '1. The hook — open in the middle of the story',
      purpose: `Earn the reader's attention in two sentences and establish the ${primaryTheme} thread.`,
      beats: [
        'Open on a concrete moment, image or line of dialogue — no throat-clearing.',
        'Name the stakes: what changed, and why did it matter to you?',
        `Signpost the through-line the essay will follow: ${themes.join(' → ')}.`,
      ],
    },
    {
      heading: '2. Context — who you are and where you are from',
      purpose: `Ground the reader in your world as a ${profile.educationLevel} student in ${profile.fieldOfStudy}.`,
      beats: [
        `Introduce your setting: ${profile.institution || 'your institution'}, ${profile.state || 'your region'}.`,
        'Show, rather than claim, the constraints or opportunities that shaped your choices.',
        profile.financialNeed
          ? 'Frame the financial reality factually — reviewers respond to clarity, not pity.'
          : 'Frame the opportunity gap you noticed and chose to act on.',
      ],
    },
    {
      heading: '3. Evidence — what you have already done',
      purpose: 'Prove the traits you claim with two or three specific, verifiable examples.',
      beats: [
        'Use the STAR shape: Situation, Task, Action, Result — for each example.',
        `Tie every example back to ${primaryTheme}.`,
        'Quantify where you can (hours, people reached, percentage improved).',
        'Pick depth over breadth: two vivid stories beat five vague mentions.',
      ],
    },
    {
      heading: '4. The ask — why this award, why now',
      purpose: 'Connect your trajectory to the funder\'s stated mission.',
      beats: [
        'State plainly what the funding unlocks for you next year.',
        'Mirror the vocabulary used in the scholarship description without parroting it.',
        'Address any review criteria the prompt lists (need, merit, service, leadership).',
      ],
    },
    {
      heading: '5. The close — forward-looking and specific',
      purpose: 'Leave the reviewer with a concrete picture of your next chapter.',
      beats: [
        'Describe the person you are becoming, not the person you already are.',
        'Circle back to the opening image for a satisfying close.',
        'Finish on a short, declarative sentence — no new information.',
      ],
    },
  ];

  return {
    title: deriveTitle(safePrompt),
    prompt: safePrompt,
    sections,
    closingTip: `Aim for roughly ${perSection} words per section (about ${wordLimit} words total), then read it aloud once and cut every sentence that does not earn its place.`,
  };
}

/** Flatten an outline into the plain-text form pushed into the transcript. */
export function formatOutline(outline: EssayOutline): string {
  const lines: string[] = [outline.title, '', "Here's a structure you can build on:", ''];

  outline.sections.forEach((section) => {
    lines.push(section.heading);
    lines.push(`Why it works: ${section.purpose}`);
    section.beats.forEach((beat) => lines.push(`• ${beat}`));
    lines.push('');
  });

  lines.push(`Tip: ${outline.closingTip}`);
  return lines.join('\n');
}
