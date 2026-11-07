import { cn } from '../../utils/cn';

export interface AvatarProps {
  /** One or two characters rendered as the monogram. */
  monogram: string;
  /** 0-360 hue used to tint the background deterministically. */
  hue?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-base',
} as const;

/**
 * Decorative monogram avatar.
 *
 * Rendered from text rather than a network image so it can never contribute to
 * layout shift or a slow LCP. Marked `aria-hidden` because the provider name is
 * always present in adjacent text.
 */
export function Avatar({ monogram, hue = 243, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl font-semibold tracking-wide',
        'ring-1 ring-inset ring-black/5 dark:ring-white/10',
        SIZE_CLASSES[size],
        className,
      )}
      style={{
        backgroundColor: `hsl(${hue} 70% 94%)`,
        color: `hsl(${hue} 65% 32%)`,
      }}
    >
      {monogram}
    </span>
  );
}
