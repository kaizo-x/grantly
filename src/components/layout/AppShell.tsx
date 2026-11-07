import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, Files, GraduationCap, LayoutDashboard, LayoutList, User, X } from 'lucide-react';
import type { GrantlyUser } from '../../lib/session';
import { cn } from '../../utils/cn';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useScrollLock } from '../../hooks/useScrollLock';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';

const MOBILE_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/tracker', label: 'Tracker', icon: LayoutList },
  { to: '/documents', label: 'Document Locker', icon: Files },
  { to: '/profile', label: 'Profile Hub', icon: User },
] as const;

export interface AppShellProps {
  /** The signed-in user, surfaced in the sidebar identity block. */
  user: GrantlyUser;
  /** Clears the session key and returns the app to the demo profile. */
  onLogout: () => void;
  /** Opens the authentication dialog over the live dashboard. */
  onOpenAuth: () => void;
  /** Whether the authentication dialog is currently open. */
  authOpen: boolean;
}

/**
 * Root layout: a persistent sapphire rail on desktop, a focus-trapped drawer on
 * mobile, plus the sticky top bar and the main content landmark.
 */
export function AppShell({ user, onLogout, onOpenAuth, authOpen }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useFocusTrap<HTMLDivElement>(drawerOpen);
  useScrollLock(drawerOpen);

  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#main-content"
        className={cn(
          'sr-only-focusable',
          'rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        Skip to main content
      </a>

      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <SidebarNav user={user} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-slate-950/60"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              ref={drawerRef}
              id="mobile-navigation"
              aria-label="Primary navigation"
              aria-modal="true"
              role="dialog"
              tabIndex={-1}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="relative flex h-full w-[min(19rem,85vw)] flex-col bg-sidebar p-4 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className={cn(
                  'absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-sidebar-foreground/80',
                  'transition-colors hover:bg-sidebar-accent hover:text-white',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                )}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
              <div className="mt-10 flex-1 overflow-y-auto">
                <SidebarNav user={user} onNavigate={() => setDrawerOpen(false)} />
              </div>
            </motion.aside>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          navOpen={drawerOpen}
          onToggleNav={() => setDrawerOpen((open) => !open)}
          isDemo={user.isDemo}
          onLogout={onLogout}
          onOpenAuth={onOpenAuth}
          authOpen={authOpen}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-6 focus-visible:outline-none sm:px-6 lg:px-8"
        >
          <Outlet />
        </main>

        <footer className="border-t border-border px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <GraduationCap className="size-4" aria-hidden="true" />
              GRANTLY — a demonstration scholarship discovery platform. Data is illustrative.
            </p>
            <nav aria-label="Mobile shortcuts" className="flex flex-wrap gap-3 lg:hidden">
              {MOBILE_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'text-xs font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
