import { Bookmark, FilePen, Send, Trophy, XCircle } from 'lucide-react';
import type { ApplicationStage } from '../../types';

export interface StageMeta {
  readonly key: ApplicationStage;
  readonly label: string;
  readonly description: string;
  readonly icon: typeof Bookmark;
  /** Tone token shared with the Badge/Progress primitives. */
  readonly tone: 'neutral' | 'primary' | 'info' | 'success' | 'danger';
}

/**
 * Ordered Kanban columns. The array order defines the board layout and the
 * "advance to next stage" behaviour used by the tracker cards.
 */
export const STAGES: readonly StageMeta[] = [
  {
    key: 'saved',
    label: 'Saved',
    description: 'Shortlisted, not started',
    icon: Bookmark,
    tone: 'neutral',
  },
  {
    key: 'in-progress',
    label: 'In Progress',
    description: 'Working on requirements',
    icon: FilePen,
    tone: 'primary',
  },
  {
    key: 'submitted',
    label: 'Submitted',
    description: 'Awaiting a decision',
    icon: Send,
    tone: 'info',
  },
  {
    key: 'awarded',
    label: 'Awarded',
    description: 'Funding secured',
    icon: Trophy,
    tone: 'success',
  },
  {
    key: 'rejected',
    label: 'Not Awarded',
    description: 'Closed without an award',
    icon: XCircle,
    tone: 'danger',
  },
];

/** Look up the metadata for a stage key. */
export function stageMeta(stage: ApplicationStage): StageMeta {
  return STAGES.find((entry) => entry.key === stage) ?? STAGES[0];
}
