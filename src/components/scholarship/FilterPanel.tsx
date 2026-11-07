import { useState, type ReactNode } from 'react';
import { Bookmark, RotateCcw, Search, Trash2 } from 'lucide-react';
import type { DeadlineStatus, ScholarshipCategory } from '../../types';
import {
  EDUCATION_LEVELS,
  FIELDS_OF_STUDY,
  MAX_SCHOLARSHIP_AMOUNT,
  SCHOLARSHIP_CATEGORIES,
} from '../../data/scholarships';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';
import { countActiveFilters } from '../../utils/filter';
import { useAppStore } from '../../store/useAppStore';
import { toast } from '../../store/useToastStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

/** Upper bound of the "minimum award" slider, snapped up to a round number. */
const AMOUNT_SLIDER_MAX = Math.ceil(MAX_SCHOLARSHIP_AMOUNT / 10000) * 10000;

const DEADLINE_OPTIONS: ReadonlyArray<{ value: DeadlineStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'closing-soon', label: 'Closing soon' },
  { value: 'expired', label: 'Closed' },
];

const PERCENT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '', label: 'Any percentage requirement' },
  { value: '60', label: 'Up to 60%' },
  { value: '70', label: 'Up to 70%' },
  { value: '80', label: 'Up to 80%' },
  { value: '90', label: 'Up to 90%' },
];

interface ChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

/** Toggle chip used for every multi-select filter group. */
function Chip({ label, active, onToggle }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150',
        active
          ? 'border-primary/40 bg-primary/12 text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      {label}
    </button>
  );
}

interface FilterGroupProps {
  id: string;
  title: string;
  children: ReactNode;
}

function FilterGroup({ id, title, children }: FilterGroupProps) {
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-2">
      <h3 id={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/**
 * Full discovery filter surface for the Indian scheme catalogue: discipline,
 * education level, funding category, deadline status, annual-amount floor and
 * an academic-percentage ceiling — plus saved searches.
 */
export function FilterPanel() {
  const filters = useAppStore((state) => state.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  const toggleArrayFilter = useAppStore((state) => state.toggleArrayFilter);
  const resetFilters = useAppStore((state) => state.resetFilters);
  const savedSearches = useAppStore((state) => state.savedSearches);
  const saveCurrentSearch = useAppStore((state) => state.saveCurrentSearch);
  const applySavedSearch = useAppStore((state) => state.applySavedSearch);
  const deleteSavedSearch = useAppStore((state) => state.deleteSavedSearch);

  const [searchName, setSearchName] = useState('');
  const activeCount = countActiveFilters(filters);

  const handleSave = (): void => {
    const name = searchName.trim();
    if (!name) {
      toast.warning('Name your search', 'Give the search a short name before saving it.');
      return;
    }
    saveCurrentSearch(name);
    setSearchName('');
    toast.success('Search saved', `“${name}” is now in your saved searches.`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Filters</h2>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-semibold text-primary tabular-nums">
              {activeCount} active
            </span>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          disabled={activeCount === 0}
          leftIcon={<RotateCcw />}
        >
          Reset
        </Button>
      </div>

      <FilterGroup id="filter-field" title="Field of study">
        {FIELDS_OF_STUDY.map((field) => (
          <Chip
            key={field}
            label={field}
            active={filters.fields.includes(field)}
            onToggle={() => toggleArrayFilter('fields', field)}
          />
        ))}
      </FilterGroup>

      <FilterGroup id="filter-level" title="Education level">
        {EDUCATION_LEVELS.map((level) => (
          <Chip
            key={level}
            label={level}
            active={filters.educationLevels.includes(level)}
            onToggle={() => toggleArrayFilter('educationLevels', level)}
          />
        ))}
      </FilterGroup>

      {/* Funding source — a native select so the control is both queryable by a
          stable id and fully keyboard/screen-reader operable. */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="category-filter"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Funding source
        </Label>
        <Select
          id="category-filter"
          name="category"
          value={filters.categories[0] ?? ''}
          onChange={(event) =>
            setFilters({
              categories: event.target.value ? [event.target.value as ScholarshipCategory] : [],
            })
          }
        >
          <option value="">All funding sources</option>
          {SCHOLARSHIP_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </div>

      <FilterGroup id="filter-deadline" title="Deadline status">
        {DEADLINE_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={filters.deadlineStatus.includes(option.value)}
            onToggle={() => toggleArrayFilter('deadlineStatus', option.value)}
          />
        ))}
      </FilterGroup>

      {/* Annual-amount floor */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="filter-min-amount"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Minimum annual award
          </label>
          <output htmlFor="filter-min-amount" className="text-xs font-semibold tabular-nums text-primary">
            {filters.minAmount === 0 ? 'Any' : `${formatCurrency(filters.minAmount)}+`}
          </output>
        </div>
        <input
          id="filter-min-amount"
          name="minAmount"
          type="range"
          min={0}
          max={AMOUNT_SLIDER_MAX}
          step={5000}
          value={filters.minAmount}
          onChange={(event) => setFilters({ minAmount: Number(event.target.value) })}
          aria-valuetext={filters.minAmount === 0 ? 'Any award amount' : `${formatCurrency(filters.minAmount)} or more`}
          className={cn(
            'h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        />
      </div>

      {/* Academic-percentage ceiling */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="filter-percent" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Maximum percentage required
        </Label>
        <Select
          id="filter-percent"
          name="maxPercentRequirement"
          value={filters.maxPercentRequirement === null ? '' : String(filters.maxPercentRequirement)}
          onChange={(event) =>
            setFilters({ maxPercentRequirement: event.target.value === '' ? null : Number(event.target.value) })
          }
        >
          {PERCENT_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Saved searches */}
      <div className="flex flex-col gap-3 border-t border-border pt-5">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Search className="size-3.5" aria-hidden="true" />
          Saved searches
        </h3>

        <div className="flex gap-2">
          <Label htmlFor="saved-search-name" className="sr-only">
            Name this search
          </Label>
          <Input
            id="saved-search-name"
            name="savedSearchName"
            value={searchName}
            onChange={(event) => setSearchName(event.target.value.slice(0, 60))}
            placeholder="e.g. Government, no income limit"
            maxLength={60}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSave();
              }
            }}
          />
          <Button variant="outline" onClick={handleSave} leftIcon={<Bookmark />} aria-label="Save current search">
            Save
          </Button>
        </div>

        {savedSearches.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No saved searches yet. Tune the filters, then save the combination for one-click reuse.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {savedSearches.map((search) => (
              <li
                key={search.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5"
              >
                <button
                  type="button"
                  onClick={() => {
                    applySavedSearch(search.id);
                    toast.info('Search applied', search.name);
                  }}
                  className={cn(
                    'min-w-0 flex-1 truncate text-left text-xs font-medium text-foreground',
                    'hover:text-primary',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded',
                  )}
                >
                  {search.name}
                </button>
                <button
                  type="button"
                  onClick={() => deleteSavedSearch(search.id)}
                  aria-label={`Delete saved search ${search.name}`}
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground',
                    'transition-colors hover:bg-danger/10 hover:text-danger',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  )}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
