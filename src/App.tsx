import { lazy, Suspense, useCallback, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AlertTriangle, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EssayAssistant } from './components/assistant/EssayAssistant';
import { Button } from './components/ui/Button';
import { Toaster } from './components/ui/Toaster';
import { Skeleton, SkeletonGrid } from './components/ui/Skeleton';
import { useAssistantStore } from './store/useAssistantStore';
import { cn } from './utils/cn';
import NotFoundPage from './pages/NotFoundPage';

/* -------------------------------------------------------------------------- */
/*  Code-split views                                                           */
/* -------------------------------------------------------------------------- */

// Each view is fetched on demand so the initial bundle only ships the shell.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DiscoveryPage = lazy(() => import('./pages/DiscoveryPage'));
const TrackerPage = lazy(() => import('./pages/TrackerPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

/** Route path → human label, used for the document title and live announcement. */
const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/discover': 'Discover scholarships',
  '/tracker': 'Application tracker',
  '/documents': 'Document locker',
  '/profile': 'Profile hub',
};

/* -------------------------------------------------------------------------- */
/*  Route-level chrome                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Suspense fallback shaped like the real content column so the layout does not
 * shift when a lazily-loaded view resolves.
 */
function RouteFallback() {
  return (
    <div role="status" aria-live="polite" className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <span className="sr-only">Loading view…</span>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <SkeletonGrid count={6} />
    </div>
  );
}

/** Guard a view behind an error boundary and a suspense boundary. */
function View({ name, children }: { name: string; children: ReactNode }) {
  return (
    <ErrorBoundary sectionName={name}>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

/**
 * Keeps the document title, scroll position and focus in sync with the active
 * route — the standard single-page-app accessibility expectations.
 */
function RouteChangeManager() {
  const { pathname } = useLocation();
  const label = ROUTE_LABELS[pathname] ?? 'Page not found';

  useEffect(() => {
    document.title = `${label} · GRANTLY`;

    // Reset reading position, then hand focus to the main landmark so keyboard
    // and screen-reader users start at the top of the new view.
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [label]);

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {label} loaded
    </p>
  );
}

/**
 * Floating entry point to the Essay Coach. Hidden while the coach is open so it
 * never competes with the drawer's own close affordance.
 */
function AssistantLauncher() {
  const open = useAssistantStore((state) => state.open);
  const openAssistant = useAssistantStore((state) => state.openAssistant);

  const handleOpen = useCallback(() => openAssistant(), [openAssistant]);

  if (open) return null;

  return (
    <button
      type="button"
      onClick={handleOpen}
      aria-label="Open the Essay Coach assistant"
      className={cn(
        'fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full',
        'bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25',
        'transition-transform hover:-translate-y-0.5 hover:bg-primary/90',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <Sparkles className="size-4.5" aria-hidden="true" />
      <span className="hidden sm:inline">Essay Coach</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Root                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Last-resort fallback for the root boundary. It renders outside the router and
 * the design-system shell, so it relies on tokens and plain elements only —
 * guaranteeing a usable, non-blank screen even if the shell itself fails.
 */
function RootFallback(reset: () => void): ReactNode {
  return (
    <div
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 py-16 text-center"
    >
      <span
        className="grid size-14 place-items-center rounded-2xl bg-danger/12 text-danger"
        aria-hidden="true"
      >
        <AlertTriangle className="size-7" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          GRANTLY hit an unexpected error
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          The interface could not be rendered. Your saved profile, applications and documents are
          stored on this device and remain safe.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" leftIcon={<RotateCcw />} onClick={reset}>
          Try again
        </Button>
        <Button leftIcon={<RefreshCw />} onClick={() => window.location.reload()}>
          Reload GRANTLY
        </Button>
      </div>
    </div>
  );
}

/**
 * GRANTLY application root: routing, layout shell, global overlays and the
 * single toast portal. The whole tree sits behind a root error boundary so no
 * runtime failure can ever leave the user staring at a blank document.
 */
export default function App() {
  return (
    <ErrorBoundary sectionName="GRANTLY" fallback={RootFallback}>
      <BrowserRouter>
        <RouteChangeManager />

        <Routes>
          <Route element={<AppShell />}>
            <Route
              index
              element={
                <View name="Dashboard">
                  <DashboardPage />
                </View>
              }
            />
            <Route
              path="discover"
              element={
                <View name="Discover scholarships">
                  <DiscoveryPage />
                </View>
              }
            />
            <Route
              path="tracker"
              element={
                <View name="Application tracker">
                  <TrackerPage />
                </View>
              }
            />
            <Route
              path="documents"
              element={
                <View name="Document locker">
                  <DocumentsPage />
                </View>
              }
            />
            <Route
              path="profile"
              element={
                <View name="Profile hub">
                  <ProfilePage />
                </View>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>

        <AssistantLauncher />
        <EssayAssistant />
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
