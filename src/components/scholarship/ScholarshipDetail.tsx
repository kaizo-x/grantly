import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  BadgeCheck,
  CalendarClock,
  ExternalLink,
  FileText,
  GraduationCap,
  IndianRupee,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { ScoredScholarship } from '../../utils/filter';
import type { StudentProfile } from '../../types';
import { cn } from '../../utils/cn';
import { panelId, tabId } from '../../utils/aria';
import { formatAnnualAmount, formatCurrency, formatDate, percent } from '../../utils/format';
import { CATEGORY_TONE, URGENCY_META, getUrgency } from '../../utils/match';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MatchRing } from '../ui/MatchRing';
import { Tabs, type TabItem } from '../ui/Tabs';
import { CountdownBadge } from './CountdownBadge';
import { EligibilityMatrix } from './EligibilityMatrix';
import { FinancialImpactCalculator } from './FinancialImpactCalculator';
import { RequirementChecklist } from './RequirementChecklist';

const TABS_ID_BASE = 'scholarship-detail';
type DetailTab = 'overview' | 'eligibility' | 'calculator';

/** Sentinel income ceiling used by pure-merit schemes with no income limit. */
const NO_INCOME_LIMIT = 9_900_000;

export interface ScholarshipDetailProps {
  item: ScoredScholarship;
  profile: StudentProfile;
  saved: boolean;
  tracked: boolean;
  checklist: Record<string, boolean>;
  onToggleSaved: () => void;
  onTrack: () => void;
  onToggleChecklistItem: (requirement: string) => void;
  onOpenAssistant: (prompt: string) => void;
}

/**
 * Full scholarship detail, decomposed into Overview / Eligibility / Calculator
 * tabs over the Indian scheme record.
 */
export function ScholarshipDetail({
  item,
  profile,
  saved,
  tracked,
  checklist,
  onToggleSaved,
  onTrack,
  onToggleChecklistItem,
  onOpenAssistant,
}: ScholarshipDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const { scholarship, match, days } = item;
  const urgency = URGENCY_META[getUrgency(days)];

  const tabs: readonly TabItem[] = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: <FileText className="size-4" aria-hidden="true" /> },
      {
        id: 'eligibility',
        label: 'Eligibility',
        icon: <BadgeCheck className="size-4" aria-hidden="true" />,
        count: match.eligibility.filter((check) => check.met).length,
      },
      {
        id: 'calculator',
        label: 'Calculator',
        icon: <TrendingUp className="size-4" aria-hidden="true" />,
      },
    ],
    [match.eligibility],
  );

  /** A ready-made Essay Coach prompt derived from the scheme and the profile. */
  const essayPrompt =
    `Outline a statement for the ${scholarship.title}, written by a ${profile.educationLevel} ` +
    `${profile.fieldOfStudy} student in ${profile.state || 'India'}.`;

  const keyFacts = [
    { label: 'Annual award', value: formatAnnualAmount(scholarship.amount), icon: Award },
    { label: 'Deadline', value: formatDate(scholarship.deadline), icon: CalendarClock },
    { label: 'Education level', value: scholarship.educationLevel, icon: GraduationCap },
    {
      label: 'Family income ceiling',
      value:
        scholarship.maxFamilyIncome >= NO_INCOME_LIMIT
          ? 'No income limit'
          : formatCurrency(scholarship.maxFamilyIncome),
      icon: IndianRupee,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Provider + headline */}
      <div className="flex flex-wrap items-start gap-4">
        <Avatar monogram={scholarship.provider.slice(0, 2).toUpperCase()} hue={217} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {scholarship.provider}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold leading-snug text-foreground">{scholarship.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CountdownBadge days={days} deadline={scholarship.deadline} />
            <Badge variant={CATEGORY_TONE[scholarship.category]}>{scholarship.category}</Badge>
            <Badge variant="outline">{scholarship.educationLevel}</Badge>
          </div>
        </div>
        <MatchRing score={match.score} size={64} className="order-first ml-auto sm:order-none" />
      </div>

      <Tabs
        idBase={TABS_ID_BASE}
        items={tabs}
        value={activeTab}
        onValueChange={(id) => setActiveTab(id as DetailTab)}
        ariaLabel="Scholarship details"
      />

      <motion.div
        key={activeTab}
        id={panelId(TABS_ID_BASE, activeTab)}
        role="tabpanel"
        aria-labelledby={tabId(TABS_ID_BASE, activeTab)}
        tabIndex={0}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="focus-visible:outline-none"
      >
        {activeTab === 'overview' ? (
          <div className="flex flex-col gap-5">
            <div className={cn('rounded-lg px-3.5 py-2.5 text-xs ring-1 ring-inset', urgency.badge)}>
              <span className="font-semibold">
                {days >= 0
                  ? `${days} day${days === 1 ? '' : 's'} left to apply`
                  : 'The application window for this cycle has closed'}
              </span>
              <span className="ml-1">
                · final deadline{' '}
                <time dateTime={scholarship.deadline}>{formatDate(scholarship.deadline)}</time>
              </span>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{scholarship.description}</p>

            <dl className="grid grid-cols-2 gap-3">
              {keyFacts.map((fact) => {
                const Icon = fact.icon;
                return (
                  <div key={fact.label} className="rounded-lg border border-border bg-muted/40 p-3">
                    <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      <Icon className="size-3.5" aria-hidden="true" />
                      {fact.label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">{fact.value}</dd>
                  </div>
                );
              })}
            </dl>

            <div className="flex flex-wrap gap-1.5">
              {scholarship.fieldOfStudy.map((field) => (
                <Badge key={field} variant="outline">
                  {field}
                </Badge>
              ))}
            </div>

            <section aria-labelledby="eligibility-criteria-heading" className="flex flex-col gap-2">
              <h4 id="eligibility-criteria-heading" className="text-sm font-semibold text-foreground">
                Eligibility criteria
              </h4>
              <ul className="flex flex-col gap-1.5">
                {scholarship.eligibility.map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden="true" />
                    {rule}
                  </li>
                ))}
              </ul>
            </section>

            <section
              aria-labelledby="essay-prompt-heading"
              className="rounded-xl border border-primary/25 bg-primary/5 p-4"
            >
              <h4
                id="essay-prompt-heading"
                className="flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                Essay prompt
              </h4>
              <blockquote className="mt-2 border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed text-muted-foreground">
                {essayPrompt}
              </blockquote>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                leftIcon={<Sparkles />}
                onClick={() => onOpenAssistant(essayPrompt)}
              >
                Draft an outline with the Essay Coach
              </Button>
            </section>

            <section aria-labelledby="required-docs-heading" className="flex flex-col gap-3">
              <h4 id="required-docs-heading" className="text-sm font-semibold text-foreground">
                Required documents
              </h4>
              {tracked ? (
                <RequirementChecklist
                  requirements={scholarship.documentsRequired}
                  completed={checklist}
                  onToggle={onToggleChecklistItem}
                  idPrefix={`detail-${scholarship.id}`}
                />
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {scholarship.documentsRequired.map((document) => (
                    <li key={document} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden="true" />
                      {document}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={scholarship.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground',
                  'transition-colors hover:bg-primary/90',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                Visit official portal
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </div>
          </div>
        ) : null}

        {activeTab === 'eligibility' ? (
          <div className="flex flex-col gap-6">
            <EligibilityMatrix checks={match.eligibility} />

            <section aria-labelledby="match-breakdown-heading" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h4 id="match-breakdown-heading" className="text-sm font-semibold text-foreground">
                  Why this score?
                </h4>
                <span className="text-xs text-muted-foreground">
                  {match.score}% weighted match against your profile
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {match.reasons.map((reason) => (
                  <li
                    key={reason.label}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <Badge variant={reason.met ? 'success' : 'neutral'} className="shrink-0">
                      {reason.met ? 'Met' : 'Missed'}
                    </Badge>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{reason.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{reason.detail}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                      {reason.met ? `+${reason.weight}` : `+0`} pts
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="profile-snapshot-heading" className="flex flex-col gap-2">
              <h4 id="profile-snapshot-heading" className="text-sm font-semibold text-foreground">
                Your profile snapshot
              </h4>
              <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {[
                  { label: 'Percentage', value: `${profile.percentage}%` },
                  { label: 'Education level', value: profile.educationLevel },
                  { label: 'Field', value: profile.fieldOfStudy },
                  { label: 'Financial need', value: profile.financialNeed ? 'Yes' : 'No' },
                  { label: 'Family income', value: formatCurrency(profile.annualFamilyIncome) },
                  { label: 'Deadline window', value: `${Math.max(0, days)} days left` },
                ].map((entry) => (
                  <li key={entry.label} className="rounded-lg border border-border bg-muted/30 p-2.5">
                    <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                      {entry.label}
                    </span>
                    <span className="mt-0.5 block font-medium text-foreground">{entry.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {activeTab === 'calculator' ? (
          <FinancialImpactCalculator scholarship={scholarship} profile={profile} />
        ) : null}
      </motion.div>

      {/* Actions are surfaced inline as well as in the modal footer for reach. */}
      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        <Button variant={saved ? 'secondary' : 'outline'} onClick={onToggleSaved} aria-pressed={saved}>
          {saved ? 'Saved to shortlist' : 'Save to shortlist'}
        </Button>
        {!tracked ? (
          <Button
            variant="primary"
            onClick={onTrack}
            disabled={days < 0}
            aria-describedby={days < 0 ? 'tracking-disabled-note' : undefined}
          >
            Start tracking application
          </Button>
        ) : null}
        {days < 0 && !tracked ? (
          <p id="tracking-disabled-note" className="self-center text-xs text-muted-foreground">
            This cycle has closed — tracking is unavailable.
          </p>
        ) : null}
      </div>

      <p className="sr-only">
        Match score {match.score} percent. {percent(match.score, 100)} of weighted criteria met.
      </p>
    </div>
  );
}
