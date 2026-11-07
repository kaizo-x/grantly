import { useMemo, useRef, useState, type DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Clock,
  CreditCard,
  FilePen,
  FileText,
  FolderOpen,
  GraduationCap,
  HardDrive,
  Minus,
  Palette,
  PiggyBank,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import type { DocumentCategory, StoredDocument } from '../types';
import { useAppStore } from '../store/useAppStore';
import { toast } from '../store/useToastStore';
import { cn } from '../utils/cn';
import { formatBytes, formatDate } from '../utils/format';
import { sanitizeFileName, validateUpload } from '../utils/sanitize';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import { StatCard } from '../components/ui/StatCard';

/** Stable render order for the category groups. */
const CATEGORY_ORDER: readonly DocumentCategory[] = [
  'transcript',
  'financial',
  'essay',
  'recommendation',
  'identification',
  'portfolio',
  'other',
];

/** Presentation metadata for each locker category. */
const CATEGORY_META: Record<DocumentCategory, { label: string; description: string; icon: typeof FileText }> = {
  transcript: {
    label: 'Marksheets & Records',
    description: 'Board marksheets, degree transcripts and grade reports.',
    icon: GraduationCap,
  },
  financial: {
    label: 'Income & Financial Proof',
    description: 'Income certificates, ITRs, fee receipts and bank statements.',
    icon: PiggyBank,
  },
  essay: {
    label: 'Essays & Statements',
    description: 'Statements of purpose, personal statements and drafts.',
    icon: FilePen,
  },
  recommendation: {
    label: 'Recommendation Letters',
    description: 'Signed references from teachers, mentors and employers.',
    icon: Users,
  },
  identification: {
    label: 'Identification',
    description: 'Government ID, passport or residency documents.',
    icon: CreditCard,
  },
  portfolio: {
    label: 'Portfolios',
    description: 'Project write-ups, work samples and creative portfolios.',
    icon: Palette,
  },
  other: {
    label: 'Other',
    description: 'Anything that does not fit the categories above.',
    icon: FileText,
  },
};

/** Categories that most scholarship applications expect to see. */
const ESSENTIAL_CATEGORIES: readonly DocumentCategory[] = [
  'transcript',
  'financial',
  'essay',
  'recommendation',
  'identification',
];

/** Per-status presentation tokens. */
const STATUS_META: Record<
  StoredDocument['status'],
  { label: string; icon: typeof ShieldCheck; className: string }
> = {
  verified: { label: 'Verified', icon: ShieldCheck, className: 'text-success' },
  pending: { label: 'Pending review', icon: Clock, className: 'text-warning' },
  missing: { label: 'Missing', icon: FileText, className: 'text-danger' },
};

/** File-name keywords used to guess a category when none is chosen explicitly. */
const CATEGORY_KEYWORDS: ReadonlyArray<readonly [DocumentCategory, readonly string[]]> = [
  ['transcript', ['transcript', 'marksheet', 'marks-card', 'grades', 'academic-record', 'degree']],
  ['financial', ['income', 'certificate', 'itr', 'ration', 'bank', 'fee-receipt']],
  ['essay', ['essay', 'statement', 'sop', 'writing-sample']],
  ['recommendation', ['recommendation', 'reference', 'letter']],
  ['identification', ['aadhaar', 'aadhar', 'pan', 'passport', 'identification']],
  ['portfolio', ['portfolio', 'work-sample', 'project']],
];

function inferCategory(fileName: string): DocumentCategory {
  const haystack = fileName.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return category;
  }
  return 'other';
}

/**
 * Smart Document Locker.
 *
 * A drag-and-drop (plus click-to-browse) dropzone with strict size and MIME
 * validation. Only *metadata* is persisted — file contents are never read into
 * memory beyond the size check and never leave the device.
 */
export default function DocumentsPage() {
  const documents = useAppStore((state) => state.documents);
  const addDocument = useAppStore((state) => state.addDocument);
  const removeDocument = useAppStore((state) => state.removeDocument);

  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [dragging, setDragging] = useState(false);

  const groups = useMemo(
    () =>
      CATEGORY_ORDER.map((key) => ({
        key,
        docs: documents.filter((document) => document.category === key),
      })).filter((group) => group.docs.length > 0),
    [documents],
  );

  const totals = useMemo(
    () => ({
      size: documents.reduce((total, document) => total + document.sizeBytes, 0),
      verified: documents.filter((document) => document.status === 'verified').length,
      pending: documents.filter((document) => document.status === 'pending').length,
    }),
    [documents],
  );

  const handleFiles = (files: FileList | null): void => {
    if (!files || files.length === 0) return;

    let added = 0;
    const problems: string[] = [];

    Array.from(files).forEach((file) => {
      const validation = validateUpload({ name: file.name, size: file.size, type: file.type });
      if (!validation.valid) {
        problems.push(`${file.name} — ${validation.reason ?? 'unsupported file'}`);
        return;
      }

      const name = sanitizeFileName(file.name);
      addDocument({
        name,
        category: category === 'other' ? inferCategory(name) : category,
        sizeBytes: file.size,
        mimeType: file.type || 'application/octet-stream',
        status: 'pending',
      });
      added += 1;
    });

    if (added > 0) {
      toast.success(
        `${added} document${added === 1 ? '' : 's'} added`,
        'Stored locally on this device — nothing was uploaded.',
      );
    }
    if (problems.length > 0) {
      toast.error('Some files were rejected', problems[0]);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (!dragging) setDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleRemove = (document: StoredDocument): void => {
    removeDocument(document.id);
    toast.info('Document removed', `${document.name} was deleted from the locker.`);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Document locker</h1>
        <p className="text-sm text-muted-foreground">
          Keep transcripts, financial statements, essays and references organised and ready to submit.
        </p>
      </header>

      <section aria-label="Document storage summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Files stored"
          value={String(documents.length)}
          hint={`Across ${groups.length} categor${groups.length === 1 ? 'y' : 'ies'}`}
          icon={<FolderOpen />}
          tone="primary"
        />
        <StatCard
          label="Storage used"
          value={formatBytes(totals.size)}
          hint="Metadata only — files stay on device"
          icon={<HardDrive />}
          tone="info"
        />
        <StatCard
          label="Verified"
          value={String(totals.verified)}
          hint="Checked and ready to submit"
          icon={<ShieldCheck />}
          tone="success"
        />
        <StatCard
          label="Pending review"
          value={String(totals.pending)}
          hint="Recently added, not yet checked"
          icon={<Clock />}
          tone="warning"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="size-4.5 text-primary" aria-hidden="true" />
                Upload documents
              </CardTitle>
              <CardDescription>PDF, DOCX, PNG, JPG or TXT — up to 10 MB per file.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 sm:max-w-xs">
                <Label htmlFor="document-category">Categorise new uploads as</Label>
                <Select
                  id="document-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as DocumentCategory)}
                >
                  {CATEGORY_ORDER.map((key) => (
                    <option key={key} value={key}>
                      {CATEGORY_META[key].label}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave it on “Other” and GRANTLY will infer the category from the file name.
                </p>
              </div>

              <div
                onDragEnter={handleDragOver}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center',
                  'transition-colors duration-200',
                  dragging ? 'border-primary bg-primary/8' : 'border-border bg-muted/30',
                )}
              >
                <span
                  className="grid size-12 place-items-center rounded-full bg-card text-primary ring-1 ring-inset ring-border"
                  aria-hidden="true"
                >
                  <Upload className="size-5" />
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-foreground">
                    {dragging ? 'Release to add these files' : 'Drag and drop your files here'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Files are validated locally — unsupported types and anything over 10 MB is rejected.
                  </p>
                </div>
                <Button variant="outline" size="sm" leftIcon={<Plus />} onClick={() => inputRef.current?.click()}>
                  Choose files
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  tabIndex={-1}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                  className="sr-only"
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    // Reset so the same file can be selected again.
                    event.target.value = '';
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {groups.length === 0 ? (
            <EmptyState
              icon={<FolderOpen />}
              title="Your locker is empty"
              description="Add your board marksheet, income certificate or recommendation letters and everything will be sorted automatically."
            />
          ) : (
            groups.map((group) => {
              const meta = CATEGORY_META[group.key];
              const Icon = meta.icon;
              return (
                <Card key={group.key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="size-4.5 text-primary" aria-hidden="true" />
                      {meta.label}
                      <Badge variant="neutral">{group.docs.length}</Badge>
                    </CardTitle>
                    <CardDescription>{meta.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col divide-y divide-border">
                      <AnimatePresence initial={false}>
                        {group.docs.map((document) => {
                          const status = STATUS_META[document.status];
                          const StatusIcon = status.icon;
                          return (
                            <motion.li
                              key={document.id}
                              layout="position"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -12 }}
                              transition={{ duration: 0.18 }}
                              className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
                            >
                              <span
                                className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"
                                aria-hidden="true"
                              >
                                <FileText className="size-4" />
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-foreground">
                                  {document.name}
                                </span>
                                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                                  <span>{formatBytes(document.sizeBytes)}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>
                                    Added{' '}
                                    <time dateTime={document.uploadedAt}>
                                      {formatDate(document.uploadedAt)}
                                    </time>
                                  </span>
                                </span>
                              </span>

                              <span
                                className={cn(
                                  'inline-flex shrink-0 items-center gap-1 text-xs font-semibold',
                                  status.className,
                                )}
                              >
                                <StatusIcon className="size-3.5" aria-hidden="true" />
                                {status.label}
                              </span>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                                aria-label={`Remove ${document.name}`}
                                onClick={() => handleRemove(document)}
                              >
                                <Trash2 />
                              </Button>
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </ul>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <aside aria-label="Application readiness" className="flex flex-col gap-4 lg:sticky lg:top-20 lg:h-fit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4.5 text-success" aria-hidden="true" />
                Application readiness
              </CardTitle>
              <CardDescription>Essential documents most scholarships request.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {ESSENTIAL_CATEGORIES.map((key) => {
                const count = documents.filter((document) => document.category === key).length;
                const present = count > 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'grid size-7 shrink-0 place-items-center rounded-full',
                        present ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground',
                      )}
                      aria-hidden="true"
                    >
                      {present ? <Check className="size-3.5" strokeWidth={3} /> : <Minus className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-foreground">
                      {CATEGORY_META[key].label}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {present ? `${count} file${count === 1 ? '' : 's'}` : 'Still needed'}
                    </span>
                    <span className="sr-only">
                      {present ? 'on file' : 'not yet uploaded'}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
            <HardDrive className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              GRANTLY keeps document <strong className="font-semibold text-foreground">metadata</strong> in this
              browser&rsquo;s local storage. File contents never leave your device and are never uploaded anywhere.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
