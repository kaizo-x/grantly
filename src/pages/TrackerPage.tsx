import { memo, useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Compass,
  ExternalLink,
  FilePen,
  LayoutList,
  Send,
  Trash2,
  Trophy,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ApplicationRecord, ApplicationStage } from '../types';
import type { ScoredScholarship } from '../utils/filter';
import { useAppStore } from '../store/useAppStore';
import { useScoredScholarships } from '../hooks/useScholarships';
import { getScholarshipById } from '../data/scholarships';
import { toast } from '../store/useToastStore';
import { cn } from '../utils/cn';
import {
  daysUntil,
  formatAnnualAmount,
  formatCompactCurrency,
  formatRelativeDays,
  hueFor,
  monogramFor,
  percent,
} from '../utils/format';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Label } from '../components/ui/Label';
import { Progress } from '../components/ui/Progress';
import { Select } from '../components/ui/Select';
import { StatCard } from '../components/ui/StatCard';
import { Switch } from '../components/ui/Switch';
import { Textarea } from '../components/ui/Textarea';
import { CountdownBadge } from '../components/scholarship/CountdownBadge';
import { LazyScholarshipModal } from '../components/scholarship/LazyScholarshipModal';
import { RequirementChecklist } from '../components/scholarship/RequirementChecklist';
import { STAGES, stageMeta } from '../components/tracker/stages';

/** Styling for the primary call-to-action rendered as a router link. */
const CTA_CLASSES = [
  'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground',
  'transition-colors hover:bg-primary/90',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
].join(' ');

/**
 * Application Tracker — a five-column Kanban board over the persisted
 * application records.
 *
 * Each card exposes its own requirement checklist (with live toggles and a
 * completion bar), a deadline countdown, stage controls, private notes and a
 * deadline reminder. Every mutation is written straight to the persisted store,
 * so the board survives a refresh.
 */
export default function TrackerPage() {
  const applications = useAppStore((state) => state.applications);
  const moveApplication = useAppStore((state) => state.moveApplication);
  const removeApplication = useAppStore((state) => state.removeApplication);
  const toggleChecklistItem = useAppStore((state) => state.toggleChecklistItem);
  const toggleReminder = useAppStore((state) => state.toggleReminder);
  const setApplicationNotes = useAppStore((state) => state.setApplicationNotes);

  const scored = useScoredScholarships();
  const [activeId, setActiveId] = useState<string | null>(null);

  const scoredById = useMemo(
    () => new Map(scored.map((item) => [item.scholarship.id, item])),
    [scored],
  );

  const records = useMemo(() => Object.values(applications), [applications]);

  /** Board-level KPIs, derived in a single pass over the records. */
  const metrics = useMemo(() => {
    const awarded = records.filter((record) => record.stage === 'awarded');
    const secured = awarded.reduce(
      (total, record) => total + (getScholarshipById(record.scholarshipId)?.amount ?? 0),
      0,
    );
    const completions = records.map((record) => {
      const labels = Object.keys(record.checklist);
      if (labels.length === 0) return 0;
      return (labels.filter((label) => record.checklist[label]).length / labels.length) * 100;
    });

    return {
      total: records.length,
      inProgress: records.filter((record) => record.stage === 'in-progress').length,
      submitted: records.filter((record) => record.stage === 'submitted').length,
      awarded: awarded.length,
      secured,
      averageCompletion:
        completions.length === 0
          ? 0
          : Math.round(completions.reduce((total, value) => total + value, 0) / completions.length),
    };
  }, [records]);

  const columns = useMemo(
    () => STAGES.map((stage) => ({ ...stage, items: records.filter((record) => record.stage === stage.key) })),
    [records],
  );

  const handleMove = useCallback(
    (scholarshipId: string, stage: ApplicationStage): void => {
      const name = getScholarshipById(scholarshipId)?.title ?? 'Application';
      moveApplication(scholarshipId, stage);
      toast.info('Application moved', `${name} → ${stageMeta(stage).label}`);
    },
    [moveApplication],
  );

  const handleRemove = useCallback(
    (scholarshipId: string): void => {
      const name = getScholarshipById(scholarshipId)?.title ?? 'Application';
      removeApplication(scholarshipId);
      toast.info('Application removed', `${name} is no longer tracked.`);
    },
    [removeApplication],
  );

  const handleCloseModal = useCallback(() => setActiveId(null), []);

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Application tracker</h1>
          <p className="text-sm text-muted-foreground">
            Move every application across the pipeline, tick off requirements and keep an eye on closing dates.
          </p>
        </div>
        <Link to="/discover" className={CTA_CLASSES}>
          <Compass className="size-4" aria-hidden="true" />
          Find scholarships
        </Link>
      </header>

      <section aria-label="Application metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tracked applications"
          value={String(metrics.total)}
          hint={`${metrics.inProgress} currently in progress`}
          icon={<LayoutList />}
          tone="primary"
        />
        <StatCard
          label="Requirements complete"
          value={`${metrics.averageCompletion}%`}
          hint="Average across every application"
          icon={<FilePen />}
          tone="info"
        />
        <StatCard
          label="Awaiting decision"
          value={String(metrics.submitted)}
          hint="Submitted and under review"
          icon={<Send />}
          tone="warning"
        />
        <StatCard
          label="Secured funding"
          value={formatCompactCurrency(metrics.secured)}
          hint={`${metrics.awarded} award${metrics.awarded === 1 ? '' : 's'} won`}
          icon={<Trophy />}
          tone="success"
        />
      </section>

      {metrics.total === 0 ? (
        <EmptyState
          icon={<LayoutList />}
          title="Your board is empty"
          description="Save or start tracking a scholarship and it will appear here, ready to move through the pipeline."
          action={
            <Link to="/discover" className={CTA_CLASSES}>
              <Compass className="size-4" aria-hidden="true" />
              Browse scholarships
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {columns.map((column) => {
            const Icon = column.icon;
            return (
              <section
                key={column.key}
                aria-labelledby={`tracker-stage-${column.key}`}
                className="flex min-h-[180px] flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3"
              >
                <header className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2
                      id={`tracker-stage-${column.key}`}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground"
                    >
                      <Icon
                        className={cn(
                          'size-4',
                          column.tone === 'success' && 'text-success',
                          column.tone === 'info' && 'text-info',
                          column.tone === 'primary' && 'text-primary',
                          column.tone === 'danger' && 'text-danger',
                          column.tone === 'neutral' && 'text-muted-foreground',
                        )}
                        aria-hidden="true"
                      />
                      {column.label}
                    </h2>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground ring-1 ring-inset ring-border">
                      {column.items.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{column.description}</p>
                </header>

                {column.items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border bg-card/50 px-3 py-6 text-center text-[11px] text-muted-foreground">
                    Nothing here yet
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    <AnimatePresence initial={false}>
                      {column.items.map((record) => (
                        <TrackerCard
                          key={record.scholarshipId}
                          record={record}
                          item={scoredById.get(record.scholarshipId)}
                          onOpen={setActiveId}
                          onMove={handleMove}
                          onRemove={handleRemove}
                          onToggleItem={toggleChecklistItem}
                          onToggleReminder={toggleReminder}
                          onSaveNotes={setApplicationNotes}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <LazyScholarshipModal scholarshipId={activeId} onClose={handleCloseModal} />
    </div>
  );
}

interface TrackerCardProps {
  record: ApplicationRecord;
  /** The scored scholarship, or `undefined` if it is no longer in the dataset. */
  item: ScoredScholarship | undefined;
  /** Every callback receives the scholarship id so the parent can keep them stable. */
  onOpen: (scholarshipId: string) => void;
  onMove: (scholarshipId: string, stage: ApplicationStage) => void;
  onRemove: (scholarshipId: string) => void;
  onToggleItem: (scholarshipId: string, label: string) => void;
  onToggleReminder: (scholarshipId: string) => void;
  onSaveNotes: (scholarshipId: string, notes: string) => void;
}

/** A single draggable-equivalent application card inside a Kanban column. */
function TrackerCardComponent({
  record,
  item,
  onOpen,
  onMove,
  onRemove,
  onToggleItem,
  onToggleReminder,
  onSaveNotes,
}: TrackerCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const scholarshipId = record.scholarshipId;
  const scholarship = item?.scholarship;
  const name = scholarship?.title ?? 'Scholarship unavailable';

  // Requirements are read back from the record so the checklist always mirrors
  // exactly what was captured when the application was first tracked.
  const requirements = Object.keys(record.checklist);
  const doneCount = requirements.filter((label) => record.checklist[label]).length;

  const stageIndex = STAGES.findIndex((stage) => stage.key === record.stage);
  const previousStage = stageIndex > 0 ? STAGES[stageIndex - 1] : undefined;
  const nextStage = stageIndex < STAGES.length - 1 ? STAGES[stageIndex + 1] : undefined;

  const stageSelectId = `tracker-stage-select-${record.scholarshipId}`;
  const notesId = `tracker-notes-${record.scholarshipId}`;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col rounded-xl border border-border bg-card p-3.5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <Avatar
          monogram={scholarship ? monogramFor(scholarship.provider) : '—'}
          hue={scholarship ? hueFor(scholarship.id) : 243}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {scholarship?.provider ?? 'Provider unavailable'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          aria-expanded={detailsOpen}
          aria-label={detailsOpen ? `Hide details for ${name}` : `Show details for ${name}`}
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground',
            'transition-colors hover:bg-muted hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <ChevronDown
            className={cn('size-4 transition-transform', detailsOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        {item ? <CountdownBadge days={item.days} deadline={item.scholarship.deadline} size="sm" /> : null}
        {scholarship ? (
          <span className="text-xs font-medium text-muted-foreground">
            {formatAnnualAmount(scholarship.amount)}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <Progress
          value={percent(doneCount, requirements.length)}
          tone={doneCount === requirements.length && requirements.length > 0 ? 'success' : 'primary'}
          label={`${name}: ${doneCount} of ${requirements.length} requirements complete`}
        />
        <p className="text-[11px] text-muted-foreground">
          {doneCount}/{requirements.length} requirements · updated{' '}
          {formatRelativeDays(daysUntil(record.updatedAt))}
        </p>
      </div>

      <AnimatePresence initial={false}>
        {detailsOpen ? (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3.5 flex flex-col gap-4 border-t border-border pt-3.5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={stageSelectId}>Application stage</Label>
                <Select
                  id={stageSelectId}
                  value={record.stage}
                  onChange={(event) => onMove(scholarshipId, event.target.value as ApplicationStage)}
                >
                  {STAGES.map((stage) => (
                    <option key={stage.key} value={stage.key}>
                      {stage.label}
                    </option>
                  ))}
                </Select>
              </div>

              {requirements.length > 0 ? (
                <RequirementChecklist
                  requirements={requirements}
                  completed={record.checklist}
                  onToggle={(label) => onToggleItem(scholarshipId, label)}
                  idPrefix={`tracker-req-${record.scholarshipId}`}
                />
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <span id={`${notesId}-reminder-label`} className="text-sm font-medium text-foreground">
                  Deadline reminder
                </span>
                <Switch
                  checked={record.reminderEnabled}
                  onCheckedChange={() => onToggleReminder(scholarshipId)}
                  aria-labelledby={`${notesId}-reminder-label`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={notesId}>Private notes</Label>
                <Textarea
                  id={notesId}
                  rows={3}
                  maxLength={2000}
                  defaultValue={record.notes}
                  onBlur={(event) => onSaveNotes(scholarshipId, event.target.value)}
                  placeholder="Contacts, portal passwords reminders, submission confirmations…"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" leftIcon={<ExternalLink />} onClick={() => onOpen(scholarshipId)}>
                  Open details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:bg-danger/10 hover:text-danger"
                  leftIcon={<Trash2 />}
                  onClick={() => onRemove(scholarshipId)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {stageIndex >= 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {nextStage ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onMove(scholarshipId, nextStage.key)}
              aria-label={`Move ${name} to ${nextStage.label}`}
            >
              {nextStage.label}
            </Button>
          ) : null}
          {previousStage ? (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => onMove(scholarshipId, previousStage.key)}
              aria-label={`Move ${name} back to ${previousStage.label}`}
            >
              {previousStage.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </motion.li>
  );
}

/**
 * Memoised: mutating one application (ticking a requirement, editing notes)
 * therefore re-renders only that card, not every card on the board.
 */
const TrackerCard = memo(TrackerCardComponent);
