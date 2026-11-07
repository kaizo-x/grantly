import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CircleCheckBig,
  Compass,
  Files,
  GraduationCap,
  LayoutList,
  Lock,
  LogIn,
  Mail,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import type { EducationLevel } from '../../types';
import { EDUCATION_LEVELS } from '../../data/scholarships';
import {
  DEMO_USER,
  authenticate,
  saveCredentials,
  writeSession,
  type GrantlyUser,
} from '../../lib/session';
import { formatCurrency } from '../../utils/format';
import { parseNumberInput, sanitizeText } from '../../utils/sanitize';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { ThemeToggle } from '../layout/ThemeToggle';

/* -------------------------------------------------------------------------- */
/*  Static content                                                             */
/* -------------------------------------------------------------------------- */

type GatewayView = 'welcome' | 'login' | 'register';

/** The three surfaces of the gateway, in the order they are reachable. */
const VIEW_TITLES: Record<GatewayView, string> = {
  welcome: 'Welcome · GRANTLY',
  login: 'Log in · GRANTLY',
  register: 'Create account · GRANTLY',
};

/** Deliberately permissive: the gateway validates shape, not deliverability. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MIN_PASSWORD_LENGTH = 6;

/** Cap every free-text field so a pasted payload cannot bloat storage. */
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 120;

const FEATURES = [
  {
    icon: Compass,
    title: 'Smart match engine',
    detail: 'Weighted scoring against income ceilings, aggregate percentage and discipline.',
  },
  {
    icon: Calculator,
    title: 'Financial impact model',
    detail: 'See how much of your annual cost of attendance each award actually covers.',
  },
  {
    icon: LayoutList,
    title: 'Application tracker',
    detail: 'A five-stage board with requirement checklists and deadline reminders.',
  },
  {
    icon: Files,
    title: 'Document locker',
    detail: 'Keep marksheets, income certificates and essays ready for every portal.',
  },
] as const;

/* -------------------------------------------------------------------------- */
/*  Form contracts                                                             */
/* -------------------------------------------------------------------------- */

interface RegisterFields {
  fullName: string;
  email: string;
  password: string;
  educationLevel: EducationLevel;
  annualFamilyIncome: string;
}

interface LoginFields {
  email: string;
  password: string;
}

type FieldKey = 'fullName' | 'email' | 'password' | 'annualFamilyIncome';

type FieldErrors = Partial<Record<FieldKey, string>>;

/** Maps a validation key to the input that should receive focus on failure. */
const FIELD_IDS: Record<FieldKey, string> = {
  fullName: 'register-name',
  email: 'register-email',
  password: 'register-password',
  annualFamilyIncome: 'register-income',
};

const EMPTY_REGISTER_FIELDS: RegisterFields = {
  fullName: '',
  email: '',
  password: '',
  educationLevel: 'Undergraduate',
  annualFamilyIncome: '',
};

/* -------------------------------------------------------------------------- */
/*  Small presentational pieces                                                */
/* -------------------------------------------------------------------------- */

const LINK_CLASSES = cn(
  'rounded font-medium text-primary underline-offset-4 hover:underline',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
);

/** Shared shell for the login and registration cards. */
function GatewayCard({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">{children}</div>
    </div>
  );
}

function BackToWelcome({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className={cn(
        'mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground',
        'transition-colors hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to welcome
    </button>
  );
}

/** Inline, screen-reader-linked field error. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-xs font-medium text-danger">
      <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

/** Standalone, non-field status banner. */
function Banner({ id, tone, children }: { id?: string; tone: 'success' | 'danger'; children: ReactNode }) {
  const Icon = tone === 'success' ? CircleCheckBig : AlertTriangle;
  return (
    <p
      id={id}
      role={tone === 'success' ? 'status' : 'alert'}
      className={cn(
        'mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm',
        tone === 'success'
          ? 'border-success/40 bg-success/10 text-success'
          : 'border-danger/40 bg-danger/10 text-danger',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*  Gateway                                                                    */
/* -------------------------------------------------------------------------- */

export interface AuthGatewayProps {
  /** Invoked once a session has been established and persisted. */
  onAuthenticated: (user: GrantlyUser) => void;
  /**
   * Renders the gateway without document-level chrome.
   *
   * Used when the gateway is embedded inside a dialog over the live dashboard:
   * omitting its own `<header>`/`<footer>`/`<main>` avoids duplicate banner,
   * contentinfo and main landmarks in the same document.
   */
  embedded?: boolean;
}

/**
 * The Welcome Gateway — the sign-in, registration and judge-demo surface.
 *
 * Three views share one local `view` state: `welcome` (branding + entry points),
 * `login` and `register`. Registration never signs the student in; it writes the
 * credential record and hands them back to the login view, so the
 * register-then-login sequence is always exercised. The one-click demo button
 * writes the pre-populated judge session and enters the dashboard immediately.
 */
export function AuthGateway({ onAuthenticated, embedded = false }: AuthGatewayProps) {
  const [view, setView] = useState<GatewayView>('welcome');
  const [notice, setNotice] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [registerFields, setRegisterFields] = useState<RegisterFields>(EMPTY_REGISTER_FIELDS);
  const [registerErrors, setRegisterErrors] = useState<FieldErrors>({});
  const [loginFields, setLoginFields] = useState<LoginFields>({ email: '', password: '' });

  /**
   * Keep the document title in step (only when the gateway owns the document),
   * and land focus on each new view's heading.
   */
  useEffect(() => {
    if (!embedded) document.title = VIEW_TITLES[view];
    document.getElementById('gateway-heading')?.focus({ preventScroll: true });
  }, [view, embedded]);

  const goTo = useCallback((next: GatewayView) => {
    setView(next);
    setLoginError(null);
    if (next !== 'login') setNotice(null);
  }, []);

  /** One click from welcome to a fully populated dashboard, for judges. */
  const handleDemo = useCallback(() => {
    writeSession(DEMO_USER);
    onAuthenticated(DEMO_USER);
  }, [onAuthenticated]);

  const patchRegister = useCallback((patch: Partial<RegisterFields>) => {
    setRegisterFields((current) => ({ ...current, ...patch }));
    // Any edit invalidates the previous validation pass.
    setRegisterErrors({});
  }, []);

  const incomePreview = useMemo(
    () => Math.max(0, Math.round(parseNumberInput(registerFields.annualFamilyIncome, 0))),
    [registerFields.annualFamilyIncome],
  );

  const handleRegisterSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // Every free-text value is sanitised before it reaches storage.
      const fullName = sanitizeText(registerFields.fullName).slice(0, MAX_NAME_LENGTH);
      const email = sanitizeText(registerFields.email).slice(0, MAX_EMAIL_LENGTH).toLowerCase();
      const annualFamilyIncome = Math.max(0, Math.round(parseNumberInput(registerFields.annualFamilyIncome, 0)));

      const errors: FieldErrors = {};
      if (fullName.length < 2) errors.fullName = 'Enter your full name.';
      if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';
      if (registerFields.password.length < MIN_PASSWORD_LENGTH) {
        errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
      }
      if (annualFamilyIncome <= 0) {
        errors.annualFamilyIncome = 'Enter your annual family income in rupees.';
      }

      if (Object.keys(errors).length > 0) {
        setRegisterErrors(errors);
        const firstInvalid = (Object.keys(errors) as FieldKey[])[0];
        document.getElementById(FIELD_IDS[firstInvalid])?.focus();
        return;
      }

      saveCredentials({
        name: fullName,
        email,
        password: registerFields.password,
        educationLevel: registerFields.educationLevel,
        annualFamilyIncome,
      });

      // Registration never signs the student in — hand them to the login view.
      setRegisterFields(EMPTY_REGISTER_FIELDS);
      setRegisterErrors({});
      setLoginFields({ email, password: '' });
      setLoginError(null);
      setNotice('Account created successfully! Please log in with your registered credentials.');
      setView('login');
    },
    [registerFields],
  );

  const handleLoginSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const email = sanitizeText(loginFields.email).slice(0, MAX_EMAIL_LENGTH).toLowerCase();
      if (!EMAIL_PATTERN.test(email) || loginFields.password.length === 0) {
        setLoginError('Enter the email address and password you registered with.');
        return;
      }

      const user = authenticate(email, loginFields.password);
      if (!user) {
        setLoginError(
          'No account matches those credentials. Check your email and password, or register a new student account.',
        );
        return;
      }

      setLoginError(null);
      setNotice(null);
      writeSession(user);
      onAuthenticated(user);
    },
    [loginFields, onAuthenticated],
  );

  // Inside a dialog the gateway must not introduce a second `<h1>`, `<main>`,
  // `<header>` or `<footer>`; when embedded it renders as plain nested content.
  const Heading = embedded ? 'h2' : 'h1';
  const Viewport = embedded ? 'div' : 'main';

  return (
    <div className={cn('flex flex-col bg-background', !embedded && 'min-h-dvh')}>
      {embedded ? null : (
        <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-indigo-900 text-primary-foreground"
              aria-hidden="true"
            >
              <GraduationCap className="size-5.5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-foreground">GRANTLY</span>
              <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Scholarship Hub
              </span>
            </span>
          </div>
          <ThemeToggle />
        </header>
      )}

      <Viewport
        id={embedded ? undefined : 'main-content'}
        tabIndex={embedded ? undefined : -1}
        className={cn(
          'flex flex-1 flex-col',
          embedded ? 'px-0 py-1' : 'justify-center px-4 py-8 sm:px-6 lg:px-8',
        )}
      >
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="mx-auto w-full max-w-6xl"
        >
          {view === 'welcome' ? (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,25rem)] lg:items-center lg:gap-14">
              <section className="flex flex-col gap-6">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                  Built for The Outpost · Frontend Arena
                </span>

                <Heading
                  id="gateway-heading"
                  tabIndex={-1}
                  className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.6rem] lg:leading-tight"
                >
                  GRANTLY — Rethinking Educational Financial Assistance in India
                </Heading>

                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                  GRANTLY scores every verified Indian scholarship against your academic profile and family-income
                  ceiling, models what each award is worth against your cost of attendance, and tracks every
                  application from shortlist to award.
                </p>

                <ul className="grid gap-3 sm:grid-cols-2">
                  {FEATURES.map(({ icon: Icon, title, detail }) => (
                    <li
                      key={title}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5"
                    >
                      <span
                        className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
                        aria-hidden="true"
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">{title}</span>
                        <span className="text-xs leading-relaxed text-muted-foreground">{detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                aria-labelledby="gateway-actions"
                className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5"
              >
                <div className="flex flex-col gap-1">
                  <h2 id="gateway-actions" className="text-lg font-semibold tracking-tight text-foreground">
                    Get started
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Sign in to your account, or explore a fully populated demo dashboard.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button size="lg" leftIcon={<LogIn />} onClick={() => goTo('login')} className="w-full">
                    Login to Account
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    leftIcon={<UserPlus />}
                    onClick={() => goTo('register')}
                    className="w-full"
                  >
                    Register New Student
                  </Button>
                </div>

                <div className="flex items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Judge shortcut
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <div className="flex flex-col gap-2">
                  <Button size="lg" variant="success" onClick={handleDemo} className="w-full">
                    <span aria-hidden="true">⚡</span>
                    Evaluate Demo Profile (Ananya Sharma)
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Opens a populated dashboard instantly — no signup required.
                  </p>
                </div>
              </section>
            </div>
          ) : null}

          {view === 'login' ? (
            <GatewayCard>
              <BackToWelcome onBack={() => goTo('welcome')} />

              <Heading id="gateway-heading" tabIndex={-1} className="text-xl font-semibold tracking-tight text-foreground">
                Log in to GRANTLY
              </Heading>
              <p className="mt-1 text-sm text-muted-foreground">
                Use the credentials you registered on this device.
              </p>

              {notice ? <Banner tone="success">{notice}</Banner> : null}
              {loginError ? (
                <Banner id="login-error" tone="danger">
                  {loginError}
                </Banner>
              ) : null}

              <form onSubmit={handleLoginSubmit} noValidate className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="login-email" required>
                    Email Address
                  </Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={loginFields.email}
                    placeholder="you@example.edu.in"
                    leadingIcon={<Mail />}
                    aria-invalid={Boolean(loginError)}
                    aria-describedby={loginError ? 'login-error' : undefined}
                    onChange={(event) => {
                      const email = event.target.value.slice(0, MAX_EMAIL_LENGTH);
                      setLoginFields((current) => ({ ...current, email }));
                      setLoginError(null);
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="login-password" required>
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={loginFields.password}
                    placeholder="Your password"
                    leadingIcon={<Lock />}
                    aria-invalid={Boolean(loginError)}
                    aria-describedby={loginError ? 'login-error' : undefined}
                    onChange={(event) => {
                      setLoginFields((current) => ({ ...current, password: event.target.value }));
                      setLoginError(null);
                    }}
                  />
                </div>

                <Button type="submit" size="lg" leftIcon={<LogIn />} className="mt-1 w-full">
                  Log in
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                New to GRANTLY?{' '}
                <button type="button" onClick={() => goTo('register')} className={LINK_CLASSES}>
                  Register a new student account
                </button>
              </p>
            </GatewayCard>
          ) : null}

          {view === 'register' ? (
            <GatewayCard>
              <BackToWelcome onBack={() => goTo('welcome')} />

              <Heading id="gateway-heading" tabIndex={-1} className="text-xl font-semibold tracking-tight text-foreground">
                Register a new student
              </Heading>
              <p className="mt-1 text-sm text-muted-foreground">
                Your details stay on this device and pre-fill the scholarship eligibility engine.
              </p>

              {Object.keys(registerErrors).length > 0 ? (
                <Banner tone="danger">Please correct the highlighted fields below.</Banner>
              ) : null}

              <form onSubmit={handleRegisterSubmit} noValidate className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="register-name" required>
                    Full Name
                  </Label>
                  <Input
                    id="register-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={registerFields.fullName}
                    placeholder="Ananya Sharma"
                    aria-invalid={Boolean(registerErrors.fullName)}
                    aria-describedby={registerErrors.fullName ? 'register-name-error' : undefined}
                    onChange={(event) => patchRegister({ fullName: event.target.value.slice(0, MAX_NAME_LENGTH) })}
                  />
                  <FieldError id="register-name-error" message={registerErrors.fullName} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="register-email" required>
                    Email Address
                  </Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={registerFields.email}
                    placeholder="you@example.edu.in"
                    leadingIcon={<Mail />}
                    aria-invalid={Boolean(registerErrors.email)}
                    aria-describedby={registerErrors.email ? 'register-email-error' : undefined}
                    onChange={(event) =>
                      patchRegister({ email: event.target.value.slice(0, MAX_EMAIL_LENGTH) })
                    }
                  />
                  <FieldError id="register-email-error" message={registerErrors.email} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="register-password" required>
                    Password
                  </Label>
                  <Input
                    id="register-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={registerFields.password}
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    leadingIcon={<Lock />}
                    aria-invalid={Boolean(registerErrors.password)}
                    aria-describedby={registerErrors.password ? 'register-password-error' : undefined}
                    onChange={(event) => patchRegister({ password: event.target.value })}
                  />
                  <FieldError id="register-password-error" message={registerErrors.password} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="register-level" required>
                    Education Level
                  </Label>
                  <Select
                    id="register-level"
                    name="educationLevel"
                    required
                    value={registerFields.educationLevel}
                    onChange={(event) =>
                      patchRegister({ educationLevel: event.target.value as EducationLevel })
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
                  <Label htmlFor="register-income" required>
                    Annual Family Income (₹)
                  </Label>
                  <Input
                    id="register-income"
                    name="annualFamilyIncome"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={10000}
                    required
                    value={registerFields.annualFamilyIncome}
                    placeholder="450000"
                    aria-invalid={Boolean(registerErrors.annualFamilyIncome)}
                    aria-describedby={
                      registerErrors.annualFamilyIncome ? 'register-income-error' : 'register-income-hint'
                    }
                    onChange={(event) => patchRegister({ annualFamilyIncome: event.target.value.slice(0, 12) })}
                  />
                  <FieldError id="register-income-error" message={registerErrors.annualFamilyIncome} />
                  <p id="register-income-hint" className="text-xs text-muted-foreground">
                    {incomePreview > 0
                      ? `That is ${formatCurrency(incomePreview)} per year — it sets your need-based eligibility ceiling.`
                      : 'Used to match income-bounded schemes such as PM-USP and AICTE Pragati.'}
                  </p>
                </div>

                <Button type="submit" size="lg" leftIcon={<UserPlus />} className="mt-1 w-full">
                  Create account
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Already registered?{' '}
                <button type="button" onClick={() => goTo('login')} className={LINK_CLASSES}>
                  Log in instead
                </button>
              </p>
            </GatewayCard>
          ) : null}
        </motion.div>
      </Viewport>

      {embedded ? null : (
        <footer className="px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            GRANTLY — a demonstration scholarship discovery platform for Indian higher education. Data is illustrative.
          </p>
        </footer>
      )}
    </div>
  );
}
