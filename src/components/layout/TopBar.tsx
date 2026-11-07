import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Clock, LogOut, Menu, Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppStore } from '../../store/useAppStore';
import { useScoredScholarships } from '../../hooks/useScholarships';
import { useDismissable } from '../../hooks/useDismissable';
import { formatCountdown, formatDate } from '../../utils/format';
import { ThemeToggle } from './ThemeToggle';
import { Avatar } from '../ui/Avatar';

export interface TopBarProps {
  navOpen: boolean;
  onToggleNav: () => void;
  /** Clears the session and returns the visitor to the Auth Gateway. */
  onLogout: () => void;
}

/**
 * Sticky application header: global search, notification centre, theme control
 * and the profile / sign-out affordances.
 */
export function TopBar({ navOpen, onToggleNav, onLogout }: TopBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profile = useAppStore((state) => state.profile);
  const setFilters = useAppStore((state) => state.setFilters);
  const scored = useScoredScholarships();

  const notifications = useMemo(
    () =>
      scored
        .filter((item) => item.days >= 0 && item.days <= 21)
        .sort((a, b) => a.days - b.days)
        .slice(0, 5),
    [scored],
  );

  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const popoverRef = useDismissable<HTMLDivElement>(notificationsOpen, closeNotifications);

  const initials = profile.fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSearch = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      setFilters({ query });
      navigate('/discover');
    },
    [navigate, query, setFilters],
  );

  const handleToggleNotifications = useCallback(() => setNotificationsOpen((open) => !open), []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onToggleNav}
          aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={navOpen}
          aria-controls="mobile-navigation"
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground lg:hidden',
            'transition-colors hover:bg-muted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          {navOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>

        <form role="search" onSubmit={handleSearch} className="min-w-0 flex-1">
          <label htmlFor="global-search" className="sr-only">
            Search scholarships
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="global-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search scholarships, providers or fields…"
              autoComplete="off"
              maxLength={120}
              className={cn(
                'h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground',
                'placeholder:text-muted-foreground/70 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            />
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={handleToggleNotifications}
              aria-label={`Notifications: ${notifications.length} upcoming deadline${notifications.length === 1 ? '' : 's'}`}
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
              className={cn(
                'relative grid size-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground',
                'transition-colors hover:bg-muted hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              <Bell className="size-4.5" aria-hidden="true" />
              {notifications.length > 0 ? (
                <span
                  className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-warning px-1 text-[10px] font-bold text-warning-foreground"
                  aria-hidden="true"
                >
                  {notifications.length}
                </span>
              ) : null}
            </button>

            <AnimatePresence>
              {notificationsOpen ? (
                <motion.div
                  role="dialog"
                  aria-label="Upcoming deadlines"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-12 z-40 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">Upcoming deadlines</p>
                    <p className="text-xs text-muted-foreground">Closing within the next 3 weeks</p>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                      You are all caught up.
                    </p>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto">
                      {notifications.map((item) => (
                        <li key={item.scholarship.id} className="border-b border-border last:border-0">
                          <Link
                            to="/discover"
                            onClick={closeNotifications}
                            className={cn(
                              'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                            )}
                          >
                            <Clock className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-foreground">
                                {item.scholarship.title}
                              </span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {formatCountdown(item.days)} · {formatDate(item.scholarship.deadline)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <ThemeToggle className="hidden sm:grid" />

          <Link
            to="/profile"
            aria-label={`Open profile hub for ${profile.fullName}`}
            className={cn(
              'flex items-center gap-2.5 rounded-lg border border-border bg-card p-1 pr-3',
              'transition-colors hover:bg-muted',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            <Avatar monogram={initials} hue={243} size="sm" />
            <span className="hidden min-w-0 flex-col leading-tight md:flex">
              <span className="max-w-32 truncate text-xs font-semibold text-foreground">
                {profile.fullName}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {profile.percentage}% · {profile.educationLevel}
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className={cn(
              'flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground',
              'transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            )}
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Log out</span>
            <span className="sr-only sm:hidden">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
