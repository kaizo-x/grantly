import { Moon, Sun } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAppStore } from '../../store/useAppStore';

export interface ThemeToggleProps {
  className?: string;
  /** Renders a labelled pill instead of a compact icon button. */
  variant?: 'icon' | 'pill';
}

/** Light/dark theme switch. Persisted and applied before first paint. */
export function ThemeToggle({ className, variant = 'icon' }: ThemeToggleProps) {
  const theme = useAppStore((state) => state.theme);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  const isDark = theme === 'dark';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={isDark}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium',
          'transition-colors hover:bg-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className,
        )}
      >
        {isDark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
        {isDark ? 'Light mode' : 'Dark mode'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'grid size-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground',
        'transition-colors hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      {isDark ? <Sun className="size-4.5" aria-hidden="true" /> : <Moon className="size-4.5" aria-hidden="true" />}
    </button>
  );
}
