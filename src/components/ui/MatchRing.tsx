import { cn } from '../../utils/cn';

export interface MatchRingProps {
  /** Integer percentage 0-100. */
  score: number;
  size?: number;
  /** Overrides the accessible description of the score. */
  label?: string;
  className?: string;
}

/** Colour ramp: emerald for strong matches through amber to slate. */
function toneForScore(score: number): { stroke: string; text: string; caption: string } {
  if (score >= 85) return { stroke: 'stroke-success', text: 'text-success', caption: 'Excellent match' };
  if (score >= 70) return { stroke: 'stroke-primary', text: 'text-primary', caption: 'Strong match' };
  if (score >= 50) return { stroke: 'stroke-warning', text: 'text-warning', caption: 'Partial match' };
  return { stroke: 'stroke-muted-foreground', text: 'text-muted-foreground', caption: 'Weak match' };
}

/**
 * Circular match-score indicator.
 *
 * Implemented as inline SVG (no chart library, no layout shift) and exposed to
 * assistive technology as a single labelled `meter`.
 */
export function MatchRing({ score, size = 56, label, className }: MatchRingProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const tone = toneForScore(clamped);
  const strokeWidth = size >= 56 ? 5 : 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Match score ${clamped} percent — ${tone.caption}`}
      className={cn('relative inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn(tone.stroke, 'transition-[stroke-dashoffset] duration-700 ease-out')}
        />
      </svg>
      <span
        className={cn('absolute text-xs font-bold tabular-nums', tone.text)}
        style={{ fontSize: size >= 56 ? '0.8125rem' : '0.6875rem' }}
      >
        {clamped}%
      </span>
    </div>
  );
}
