import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookmarkCheck,
  CalendarClock,
  Compass,
  Files,
  LayoutList,
  PiggyBank,
  Trophy,
  UserRound,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useRecommendations, useScoredScholarships } from '../hooks/useScholarships';
import { getScholarshipById } from '../data/scholarships';
import { cn } from '../utils/cn';
import { formatAnnualAmount, formatCompactCurrency, formatDate, percent } from '../utils/format';
import { Avatar } from '../components/ui/Avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Progress } from '../components/ui/Progress';
import { StatCard } from '../components/ui/StatCard';
import { CountdownBadge } from '../components/scholarship/CountdownBadge';
import { LazyScholarshipModal } from '../components/scholarship/LazyScholarshipModal';
import { RecommendationCarousel } from '../components/scholarship/RecommendationCarousel';
import { STAGES } from '../components/tracker/stages';

/** Ranked list of the nearest deadlines, capped for the dashboard view. */
const CLOSING_SOON_LIMIT = 5;

/** Shared styling for the inline text links used across the page. */
const LINK_CLASSES = [
  'inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-primary',
  'underline-offset-4 hover:underline',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
].join(' ');

/**
 * Dashboard — a single-screen overview of the student's funding position:
 * headline KPIs, personalised recommendations, imminent deadlines and the
 * current application pipeline.
 */
export default function DashboardPage() {
  const profile = useAppStore((state) => state.profile);
  const savedIds = useAppStore((state) => state.savedIds);
  const applications = useAppStore((state) => state.applications);
  const documentCount = useAppStore((state) => state.documents.length);

  const scored = useScoredScholarships();
  const recommendations = useRecommendations(6);
  const [activeId, setActiveId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const records = Object.values(applications);
    const closingSoon = scored
      .filter((item) => item.days >= 0 && item.days <= 21)
      .sort((a, b) => a.days - b.days)
      .slice(0, CLOSING_SOON_LIMIT);

    const secured = records.reduce((total, record) => {
      if (record.stage !== 'awarded') return total;
      return total + (getScholarshipById(record.scholarshipId)?.amount ?? 0);
    }, 0);

    const shortlisted = [...new Set([...savedIds, ...records.map((record) => record.scholarshipId)])].reduce(
      (total, id) => total + (getScholarshipById(id)?.amount ?? 0),
      0,
    );

    const pipeline = STAGES.map((stage) => ({
      ...stage,
      count: records.filter((record) => record.stage === stage.key).length,
    }));

    const strongMatches = scored.filter((item) => item.match.score >= 80 && item.days >= 0).length;

    return { records, closingSoon, secured, shortlisted, pipeline, strongMatches };
  }, [applications, savedIds, scored]);

  const totalTracked = metrics.records.length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      {/* Welcome banner */}
      <section
        aria-labelledby="dashboard-welcome"
        className="rounded-2xl border border-border bg-gradient-to-br from-primary/12 via-card to-card p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center gap-5">
          <Avatar
            monogram={profile.fullName
              .split(' ')
              .map((part) => part.charAt(0))
              .slice(0, 2)
              .join('')
              .toUpperCase()}
            hue={243}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h1 id="dashboard-welcome" className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back, {profile.fullName.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {metrics.strongMatches} strong matches are open right now. You have {metrics.closingSoon.length}{' '}
              deadline{metrics.closingSoon.length === 1 ? '' : 's'} in the next three weeks.
            </p>
          </div>
          <Link
            to="/discover"
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground',
              'transition-colors hover:bg-primary/90',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            <Compass className="size-4" aria-hidden="true" />
            Find scholarships
          </Link>
        </div>
      </section>

      {/* KPI row */}
      <section aria-label="Funding overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Shortlisted"
          value={String(savedIds.length)}
          hint={`${formatCompactCurrency(metrics.shortlisted)} potential value`}
          icon={<BookmarkCheck />}
          tone="primary"
        />
        <StatCard
          label="Applications"
          value={String(totalTracked)}
          hint={`${metrics.pipeline.find((stage) => stage.key === 'in-progress')?.count ?? 0} in progress`}
          icon={<LayoutList />}
          tone="info"
        />
        <StatCard
          label="Closing soon"
          value={String(metrics.closingSoon.length)}
          hint="Within the next 21 days"
          icon={<CalendarClock />}
          tone="warning"
        />
        <StatCard
          label="Secured funding"
          value={formatCompactCurrency(metrics.secured)}
          hint={`${metrics.pipeline.find((stage) => stage.key === 'awarded')?.count ?? 0} awarded`}
          icon={<Trophy />}
          tone="success"
        />
      </section>

      {/* Recommendations */}
      <RecommendationCarousel items={recommendations} onOpen={setActiveId} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Closing soon */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4.5 text-warning" aria-hidden="true" />
              Deadlines on the horizon
            </CardTitle>
            <CardDescription>Sorted by the nearest closing date — act on these first.</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.closingSoon.length === 0 ? (
              <EmptyState
                icon={<CalendarClock />}
                title="No imminent deadlines"
                description="Nothing closes in the next three weeks. Explore new awards while you have the runway."
                action={
                  <Link to="/discover" className={LINK_CLASSES}>
                    Browse scholarships
                  </Link>
                }
              />
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {metrics.closingSoon.map((item) => (
                  <li key={item.scholarship.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(item.scholarship.id)}
                      className={cn(
                        'flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-1 py-3 text-left',
                        'transition-colors hover:text-primary',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {item.scholarship.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.scholarship.provider} ·{' '}
                          {formatAnnualAmount(item.scholarship.amount)}
                        </span>
                      </span>
                      <CountdownBadge days={item.days} deadline={item.scholarship.deadline} size="sm" />
                      <span className="hidden text-xs text-muted-foreground sm:block">
                        {formatDate(item.scholarship.deadline)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="size-4.5 text-primary" aria-hidden="true" />
              Application pipeline
            </CardTitle>
            <CardDescription>Where every application currently sits.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {totalTracked === 0 ? (
              <EmptyState
                icon={<LayoutList />}
                title="Nothing tracked yet"
                description="Start an application from any scholarship to see it move across the board."
              />
            ) : (
              metrics.pipeline.map((stage) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.key} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        <Icon
                          className={cn(
                            'size-4',
                            stage.tone === 'success' && 'text-success',
                            stage.tone === 'info' && 'text-info',
                            stage.tone === 'primary' && 'text-primary',
                            stage.tone === 'danger' && 'text-danger',
                            stage.tone === 'neutral' && 'text-muted-foreground',
                          )}
                          aria-hidden="true"
                        />
                        {stage.label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{stage.count}</span>
                    </div>
                    <Progress
                      value={percent(stage.count, totalTracked)}
                      tone={stage.tone === 'neutral' ? 'primary' : stage.tone}
                      label={`${stage.label}: ${stage.count} of ${totalTracked} applications`}
                    />
                  </div>
                );
              })
            )}

            <Link to="/tracker" className={cn(LINK_CLASSES, 'mt-1')}>
              Open the tracker board
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          to="/documents"
          icon={<Files />}
          title="Document Locker"
          description={`${documentCount} file${documentCount === 1 ? '' : 's'} stored — marksheets, income certificates and recommendations.`}
        />
        <QuickLink
          to="/profile"
          icon={<UserRound />}
          title="Profile Hub"
          description={`${profile.percentage}% · ${profile.fieldOfStudy} · ${profile.educationLevel}`}
        />
        <QuickLink
          to="/tracker"
          icon={<PiggyBank />}
          title="Track funding"
          description="Monitor every award you have secured and what is still outstanding."
        />
      </div>

      <LazyScholarshipModal scholarshipId={activeId} onClose={() => setActiveId(null)} />
    </div>
  );
}

interface QuickLinkProps {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
}

/** Compact navigation tile used in the dashboard footer row. */
function QuickLink({ to, icon, title, description }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors',
        'hover:border-primary/40 hover:bg-muted/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {title}
          <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{description}</span>
      </span>
    </Link>
  );
}
