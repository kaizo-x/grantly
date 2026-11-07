import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { panelId, tabId } from '../../utils/aria';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Small trailing count or badge. */
  count?: number;
}

export interface TabsProps {
  /** Stable prefix used to link tabs with their panels. */
  idBase: string;
  items: readonly TabItem[];
  value: string;
  onValueChange: (id: string) => void;
  /** Accessible name for the tablist, e.g. "Dashboard sections". */
  ariaLabel: string;
  className?: string;
}

/**
 * WAI-ARIA tablist with roving tabindex and full keyboard support
 * (Arrow keys, Home, End).
 */
export function Tabs({ idBase, items, value, onValueChange, ariaLabel, className }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const focusTabAt = (index: number): void => {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const currentIndex = items.findIndex((item) => item.id === value);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    onValueChange(items[nextIndex].id);
    focusTabAt(nextIndex);
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-border bg-muted/50 p-1',
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            id={tabId(idBase, item.id)}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={panelId(idBase, item.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              selected
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.icon}
            {item.label}
            {typeof item.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  selected ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
