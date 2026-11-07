import { useState } from 'react';
import { BookmarkCheck, BookmarkPlus, Plus } from 'lucide-react';
import { useScoredScholarship } from '../../hooks/useScholarships';
import { useAppStore } from '../../store/useAppStore';
import { useAssistantStore } from '../../store/useAssistantStore';
import { toast } from '../../store/useToastStore';
import type { ScoredScholarship } from '../../utils/filter';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ScholarshipDetail } from './ScholarshipDetail';

export interface ScholarshipDetailModalProps {
  /** The scholarship to display, or `null` to close the dialog. */
  scholarshipId: string | null;
  onClose: () => void;
}

/**
 * Modal host for the scholarship detail surface.
 *
 * The last rendered item is retained so that Framer Motion can play the exit
 * transition after the parent clears `scholarshipId`.
 */
export function ScholarshipDetailModal({ scholarshipId, onClose }: ScholarshipDetailModalProps) {
  const item = useScoredScholarship(scholarshipId);
  const [renderItem, setRenderItem] = useState<ScoredScholarship | null>(null);

  // Retain the most recent item so Framer Motion can play the exit transition
  // after the parent clears `scholarshipId`. Adjusting state during render —
  // rather than in an effect — avoids a needless extra commit.
  if (item && item !== renderItem) setRenderItem(item);

  const profile = useAppStore((state) => state.profile);
  const savedIds = useAppStore((state) => state.savedIds);
  const applications = useAppStore((state) => state.applications);
  const toggleSaved = useAppStore((state) => state.toggleSaved);
  const trackApplication = useAppStore((state) => state.trackApplication);
  const toggleChecklistItem = useAppStore((state) => state.toggleChecklistItem);
  const openAssistant = useAssistantStore((state) => state.openAssistant);

  const scholarship = renderItem?.scholarship;
  const record = scholarship ? applications[scholarship.id] : undefined;
  const saved = scholarship ? savedIds.includes(scholarship.id) : false;
  const tracked = Boolean(record);

  const handleToggleSaved = (): void => {
    if (!scholarship) return;
    toggleSaved(scholarship.id);
    toast.success(saved ? 'Removed from shortlist' : 'Saved to shortlist', scholarship.title);
  };

  const handleTrack = (): void => {
    if (!scholarship) return;
    trackApplication(scholarship.id, scholarship.documentsRequired);
    toast.success('Application started', `${scholarship.title} now appears on your tracker board.`);
  };

  return (
    <Modal
      open={Boolean(scholarshipId && renderItem)}
      onClose={onClose}
      size="xl"
      title={scholarship?.title ?? 'Scholarship details'}
      description={scholarship ? `${scholarship.provider} · award cycle details and eligibility` : undefined}
      footer={
        scholarship ? (
          <>
            {tracked ? <Badge variant="info">Tracking this application</Badge> : null}
            <Button
              variant="outline"
              onClick={handleToggleSaved}
              aria-pressed={saved}
              leftIcon={saved ? <BookmarkCheck /> : <BookmarkPlus />}
            >
              {saved ? 'Saved' : 'Save'}
            </Button>
            {!tracked ? (
              <Button
                onClick={handleTrack}
                leftIcon={<Plus />}
                disabled={(renderItem?.days ?? 0) < 0}
              >
                Start tracking
              </Button>
            ) : (
              <Button variant="secondary" onClick={onClose}>
                Done
              </Button>
            )}
          </>
        ) : null
      }
    >
      {renderItem ? (
        <ScholarshipDetail
          item={renderItem}
          profile={profile}
          saved={saved}
          tracked={tracked}
          checklist={record?.checklist ?? {}}
          onToggleSaved={handleToggleSaved}
          onTrack={handleTrack}
          onToggleChecklistItem={(requirement) => {
            if (scholarship) toggleChecklistItem(scholarship.id, requirement);
          }}
          onOpenAssistant={openAssistant}
        />
      ) : null}
    </Modal>
  );
}
