import { lazy, Suspense, useState } from 'react';

const ScholarshipDetailModal = lazy(() =>
  import('./ScholarshipDetailModal').then((module) => ({ default: module.ScholarshipDetailModal })),
);

export interface ScholarshipDetailModalProps {
  scholarshipId: string | null;
  onClose: () => void;
}

/**
 * Code-split host for the scholarship detail dialog.
 *
 * The chunk (and its charting dependency) is only fetched the first time a
 * student opens a scholarship, keeping the initial bundle small. The component
 * stays mounted afterwards so exit animations and repeat opens are instant.
 */
export function LazyScholarshipModal({ scholarshipId, onClose }: ScholarshipDetailModalProps) {
  const [hasMounted, setHasMounted] = useState(false);

  // Defer fetching the dialog's chunk until it is first opened. Adjusting state
  // during render instead of in an effect avoids an extra commit pass.
  if (scholarshipId && !hasMounted) setHasMounted(true);

  if (!hasMounted) return null;

  return (
    <Suspense fallback={null}>
      <ScholarshipDetailModal scholarshipId={scholarshipId} onClose={onClose} />
    </Suspense>
  );
}
