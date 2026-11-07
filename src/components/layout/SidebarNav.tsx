import { NavLink } from 'react-router-dom';
import { Compass, Files, GraduationCap, LayoutDashboard, LayoutList, Sparkles, User } from 'lucide-react';
import type { ViewKey } from '../../types';
import { cn } from '../../utils/cn';
import { useAppStore } from '../../store/useAppStore';

interface NavItem {
  key: ViewKey;
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: readonly NavItem[] = [
  { key: 'dashboard', to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'discovery', to: '/discover', label: 'Discover', icon: Compass },
  { key: 'tracker', to: '/tracker', label: 'Tracker', icon: LayoutList },
  { key: 'documents', to: '/documents', label: 'Document Locker', icon: Files },
  { key: 'profile', to: '/profile', label: 'Profile Hub', icon: User },
];

export interface SidebarNavProps {
  /** Invoked after a link is activated (used to close the mobile drawer). */
  onNavigate?: () => void;
  className?: string;
}

/** Primary navigation. Rendered in the desktop rail and the mobile drawer. */
export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const savedIds = useAppStore((state) => state.savedIds);
  const applicationCount = useAppStore((state) => Object.keys(state.applications).length);
  const documentCount = useAppStore((state) => state.documents.length);

  const counts: Partial<Record<ViewKey, number>> = {
    tracker: applicationCount,
    documents: documentCount,
    discovery: savedIds.length,
  };

  return (
    <nav aria-label="Primary" className={cn('flex h-full flex-col gap-6', className)}>
      <div className="flex items-center gap-3 px-2">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-indigo-900 text-primary-foreground"
          aria-hidden="true"
        >
          <GraduationCap className="size-5.5" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight text-sidebar-foreground">GRANTLY</span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-sidebar-foreground/60">
            Scholarship Hub
          </span>
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const count = counts[item.key];
          return (
            <li key={item.key}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                    isActive
                      ? 'bg-sidebar-accent text-white shadow-sm'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn('size-4.5 shrink-0 transition-colors', isActive ? 'text-white' : 'text-sidebar-foreground/60 group-hover:text-white')}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {typeof count === 'number' && count > 0 ? (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                          isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-sidebar-foreground/80',
                        )}
                      >
                        {count}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3.5">
        <p className="flex items-center gap-2 text-xs font-semibold text-sidebar-foreground">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Essay Coach
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/70">
          Draft a structured outline from any scholarship prompt in seconds.
        </p>
      </div>
    </nav>
  );
}
