import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  GraduationCap,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  UserRound,
  Wallet,
} from 'lucide-react';
import type { EducationLevel, FieldOfStudy } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useScoredScholarships } from '../hooks/useScholarships';
import { EDUCATION_LEVELS, FIELDS_OF_STUDY, INDIAN_STATES } from '../data/scholarships';
import { toast } from '../store/useToastStore';
import { cn } from '../utils/cn';
import { formatCompactCurrency, percent } from '../utils/format';
import { clampNumber, parseNumberInput } from '../utils/sanitize';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Modal } from '../components/ui/Modal';
import { Progress } from '../components/ui/Progress';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { Textarea } from '../components/ui/Textarea';
import { ThemeToggle } from '../components/layout/ThemeToggle';

/** Profile fields that count towards the completeness meter. */
const COMPLETENESS_FIELDS = ['fullName', 'email', 'institution', 'state', 'dateOfBirth', 'bio'] as const;

/** Current calendar year, resolved once at module load for the graduation bounds. */
const CURRENT_YEAR = new Date().getFullYear();

/* -------------------------------------------------------------------------- */
/*  Field primitives                                                          */
/* -------------------------------------------------------------------------- */

interface TextFieldProps {
  id: string;
  label: string;
  /** The committed value held in the store. */
  value: string;
  onCommit: (value: string) => void;
  type?: 'text' | 'email' | 'date';
  placeholder?: string;
  hint?: string;
  maxLength?: number;
  autoComplete?: string;
  multiline?: boolean;
  rows?: number;
}

/**
 * Text control that edits a local draft and commits on blur.
 *
 * Binding straight to the store would be wrong here: the store sanitises and
 * trims every value, which would eat the space between "Ava" and "Mensah" as
 * the student types it.
 */
function TextField({
  id,
  label,
  value,
  onCommit,
  type = 'text',
  placeholder,
  hint,
  maxLength,
  autoComplete,
  multiline = false,
  rows = 4,
}: TextFieldProps) {
  // `null` mirrors the committed store value; anything else is the in-flight
  // local draft, which lets the student type the spaces and punctuation the
  // store's sanitiser would otherwise trim away mid-keystroke.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? value;

  const commit = (): void => {
    if (draft !== null) onCommit(draft);
    setDraft(null);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', multiline && 'sm:col-span-2')}>
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          rows={rows}
          value={text}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={text}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            // Commit explicitly instead of relying on implicit form submission.
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
      )}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}

/** Numeric control that clamps to a valid range and commits as you type. */
function NumberField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  hint,
}: NumberFieldProps) {
  // Same draft strategy as `TextField`: `null` mirrors the committed number,
  // any other value preserves partially-typed input such as "1200.".
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? String(value);

  const clamp = (raw: string): number => clampNumber(parseNumberInput(raw, min), min, max);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={text}
        min={min}
        max={max === Number.MAX_SAFE_INTEGER ? undefined : max}
        step={step}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(clamp(event.target.value));
        }}
        onBlur={() => setDraft(null)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Profile Hub.
 *
 * Every edit feeds the match engine immediately, so the live snapshot in the
 * sidebar shows exactly how the student's eligibility is affected.
 */
export default function ProfilePage() {
  const profile = useAppStore((state) => state.profile);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const resetProfile = useAppStore((state) => state.resetProfile);
  const resetAll = useAppStore((state) => state.resetAll);

  const scored = useScoredScholarships();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  /** Live eligibility snapshot, recomputed on every profile mutation. */
  const snapshot = useMemo(() => {
    const open = scored.filter((item) => item.days >= 0);
    const strong = open.filter((item) => item.match.score >= 80).length;
    const eligible = open.filter((item) => item.match.eligibility.every((check) => check.met)).length;
    const average =
      open.length === 0
        ? 0
        : Math.round(open.reduce((total, item) => total + item.match.score, 0) / open.length);
    return { open: open.length, strong, eligible, average };
  }, [scored]);

  const completeness = useMemo(() => {
    const filled = COMPLETENESS_FIELDS.filter((field) => profile[field].trim().length > 0).length;
    return percent(filled, COMPLETENESS_FIELDS.length);
  }, [profile]);

  const totalCost = profile.tuition + profile.housing + profile.books + profile.personal + profile.fees;
  const netCost = Math.max(0, totalCost - profile.otherAid);

  const initials = profile.fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleResetProfile = (): void => {
    resetProfile();
    toast.info('Profile reset', 'Your details were restored to the demo defaults.');
  };

  const handleResetAll = (): void => {
    resetAll();
    setConfirmResetOpen(false);
    toast.success('Everything cleared', 'Saved scholarships, applications and documents were removed.');
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile hub</h1>
        <p className="text-sm text-muted-foreground">
          Everything you enter is scored against the catalogue in real time — watch your matches shift as you update it.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form
          noValidate
          onSubmit={(event) => event.preventDefault()}
          className="flex min-w-0 flex-col gap-6"
          aria-label="Student profile"
        >
          {/* Personal details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-4.5 text-primary" aria-hidden="true" />
                Personal details
              </CardTitle>
              <CardDescription>Who you are and where you are based.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="profile-full-name"
                label="Full name"
                value={profile.fullName}
                onCommit={(value) => updateProfile({ fullName: value })}
                maxLength={80}
                autoComplete="name"
                placeholder="Ananya Sharma"
              />
              <TextField
                id="profile-email"
                label="Email address"
                type="email"
                value={profile.email}
                onCommit={(value) => updateProfile({ email: value })}
                maxLength={120}
                autoComplete="email"
                placeholder="you@student.in"
              />
              <TextField
                id="profile-dob"
                label="Date of birth"
                type="date"
                value={profile.dateOfBirth}
                onCommit={(value) => updateProfile({ dateOfBirth: value })}
                hint="Some awards are restricted by age."
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-state">State or union territory</Label>
                <Select
                  id="profile-state"
                  value={profile.state}
                  onChange={(event) => updateProfile({ state: event.target.value })}
                >
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Academic profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="size-4.5 text-primary" aria-hidden="true" />
                Academic profile
              </CardTitle>
              <CardDescription>Education level, discipline and academic standing.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="profile-institution"
                label="Institution"
                value={profile.institution}
                onCommit={(value) => updateProfile({ institution: value })}
                maxLength={120}
                autoComplete="organization"
                placeholder="VJTI, Mumbai"
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-level">Education level</Label>
                <Select
                  id="profile-level"
                  value={profile.educationLevel}
                  onChange={(event) =>
                    updateProfile({ educationLevel: event.target.value as EducationLevel })
                  }
                >
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="profile-field">Field of study</Label>
                <Select
                  id="profile-field"
                  value={profile.fieldOfStudy}
                  onChange={(event) =>
                    updateProfile({ fieldOfStudy: event.target.value as FieldOfStudy })
                  }
                >
                  {FIELDS_OF_STUDY.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </Select>
              </div>
              <NumberField
                id="profile-percentage"
                label="Aggregate percentage (%)"
                value={profile.percentage}
                onChange={(value) => updateProfile({ percentage: value })}
                min={0}
                max={100}
                step={0.1}
                hint="Your Class 12 or current degree aggregate — drives the academic weight of every match."
              />
              <NumberField
                id="profile-graduation"
                label="Expected graduation year"
                value={profile.graduationYear}
                onChange={(value) => updateProfile({ graduationYear: value })}
                min={CURRENT_YEAR}
                max={CURRENT_YEAR + 12}
                step={1}
              />
            </CardContent>
          </Card>

          {/* Financial profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-4.5 text-success" aria-hidden="true" />
                Financial profile
              </CardTitle>
              <CardDescription>Used for need-based awards and the impact calculator.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3.5">
                <div className="min-w-0">
                  <p id="financial-need-label" className="text-sm font-medium text-foreground">
                    Consider me for need-based aid
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enables scholarships that require demonstrated financial need.
                  </p>
                </div>
                <Switch
                  checked={profile.financialNeed}
                  onCheckedChange={(checked) => updateProfile({ financialNeed: checked })}
                  aria-labelledby="financial-need-label"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  id="profile-income"
                  label="Annual family income (₹)"
                  value={profile.annualFamilyIncome}
                  onChange={(value) => updateProfile({ annualFamilyIncome: value })}
                  min={0}
                  max={5_000_000}
                  step={10000}
                  hint="Compared against each scheme's income ceiling."
                />
                <NumberField
                  id="profile-other-aid"
                  label="Aid already secured (₹)"
                  value={profile.otherAid}
                  onChange={(value) => updateProfile({ otherAid: value })}
                  min={0}
                  max={1_000_000}
                  step={1000}
                  hint="Grants, bursaries or fee waivers from other sources."
                />
              </div>
            </CardContent>
          </Card>

          {/* Cost of attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-4.5 text-info" aria-hidden="true" />
                Cost of attendance
              </CardTitle>
              <CardDescription>
                Powers the financial impact calculator — what a scholarship would actually cover.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <NumberField
                  id="profile-tuition"
                  label="Tuition fee (₹)"
                  value={profile.tuition}
                  onChange={(value) => updateProfile({ tuition: value })}
                  min={0}
                  max={500_000}
                  step={1000}
                />
                <NumberField
                  id="profile-housing"
                  label="Hostel & mess (₹)"
                  value={profile.housing}
                  onChange={(value) => updateProfile({ housing: value })}
                  min={0}
                  max={300_000}
                  step={1000}
                />
                <NumberField
                  id="profile-books"
                  label="Books & supplies (₹)"
                  value={profile.books}
                  onChange={(value) => updateProfile({ books: value })}
                  min={0}
                  max={50_000}
                  step={500}
                />
                <NumberField
                  id="profile-personal"
                  label="Personal & travel (₹)"
                  value={profile.personal}
                  onChange={(value) => updateProfile({ personal: value })}
                  min={0}
                  max={150_000}
                  step={500}
                />
                <NumberField
                  id="profile-fees"
                  label="Exam & other fees (₹)"
                  value={profile.fees}
                  onChange={(value) => updateProfile({ fees: value })}
                  min={0}
                  max={100_000}
                  step={500}
                />
              </div>

              <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <dt className="text-muted-foreground">Total cost of attendance</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {formatCompactCurrency(totalCost)}
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="text-muted-foreground">After other aid</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {formatCompactCurrency(netCost)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4.5 text-primary" aria-hidden="true" />
                About you
              </CardTitle>
              <CardDescription>Feeds the essay coach and personalises your recommendations.</CardDescription>
            </CardHeader>
            <CardContent>
              <TextField
                id="profile-bio"
                label="Short bio"
                value={profile.bio}
                onCommit={(value) => updateProfile({ bio: value })}
                maxLength={400}
                multiline
                rows={4}
                placeholder="What are you studying, and what do you want to do with it?"
                hint={`${profile.bio.length}/400 characters`}
              />
            </CardContent>
          </Card>
        </form>

        {/* Live sidebar */}
        <aside aria-label="Profile summary" className="flex flex-col gap-4 lg:sticky lg:top-20 lg:h-fit">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-5 text-center">
              <Avatar monogram={initials} hue={243} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">
                  {profile.fullName || 'Unnamed student'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.institution || 'Institution not set'}
                </p>
              </div>
              <div className="w-full">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Profile completeness</span>
                  <span className="tabular-nums text-muted-foreground">{completeness}%</span>
                </div>
                <Progress
                  value={completeness}
                  tone={completeness === 100 ? 'success' : 'primary'}
                  label={`Profile completeness: ${completeness}%`}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4.5 text-primary" aria-hidden="true" />
                Live match snapshot
              </CardTitle>
              <CardDescription>Recalculated as you type.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary"
                  aria-hidden="true"
                >
                  <Trophy className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tabular-nums text-foreground">{snapshot.strong}</p>
                  <p className="text-xs text-muted-foreground">Strong matches open now</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/12 text-success"
                  aria-hidden="true"
                >
                  <Target className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tabular-nums text-foreground">{snapshot.eligible}</p>
                  <p className="text-xs text-muted-foreground">Fully eligible applications</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg bg-info/12 text-info"
                  aria-hidden="true"
                >
                  <GraduationCap className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tabular-nums text-foreground">{snapshot.average}%</p>
                  <p className="text-xs text-muted-foreground">
                    Average match across {snapshot.open} open awards
                  </p>
                </div>
              </div>
              <p role="status" aria-live="polite" className="sr-only">
                {snapshot.strong} strong matches and {snapshot.eligible} fully eligible scholarships.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences &amp; data</CardTitle>
              <CardDescription>Theme and local data controls.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ThemeToggle variant="pill" className="w-full justify-center" />
              <Button
                variant="outline"
                className="w-full"
                leftIcon={<RefreshCw />}
                onClick={handleResetProfile}
              >
                Reset profile details
              </Button>
              <Button
                variant="ghost"
                className="w-full text-danger hover:bg-danger/10 hover:text-danger"
                leftIcon={<Trash2 />}
                onClick={() => setConfirmResetOpen(true)}
              >
                Clear all saved data
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Everything lives in this browser&rsquo;s local storage. Clearing data removes saved scholarships,
                tracked applications and uploaded document metadata.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Modal
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        title="Clear all saved data?"
        description="This permanently removes your saved scholarships, application board, document metadata and assistant history."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" leftIcon={<Trash2 />} onClick={handleResetAll}>
              Clear everything
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. Your profile details will also return to the demo defaults.
          </p>
        </div>
      </Modal>
    </div>
  );
}
