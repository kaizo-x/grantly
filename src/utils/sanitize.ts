/**
 * Input sanitisation.
 *
 * Every free-text value that originates from the user (search queries, profile
 * fields, essay prompts, notes) passes through these helpers before it is
 * persisted or rendered. React already escapes text nodes, but sanitising at
 * the boundary defends against:
 *   1. `dangerouslySetInnerHTML` usage anywhere downstream,
 *   2. stored payloads that are later exported or shared,
 *   3. XSS vectors embedded in uploaded-file names.
 */
import DOMPurify from 'dompurify';

/** Strip every tag and entity from a string, returning plain text. */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
}

/** Sanitise while retaining a safe subset of inline markup (bold/italic/lists). */
export function sanitizeRichText(input: string): string {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'code'],
    ALLOWED_ATTR: [],
  });
}

/** Sanitise a user-supplied file name (never trust `File.name`). */
export function sanitizeFileName(name: string): string {
  return sanitizeText(name)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 200);
}

/** Constrain a numeric input to a finite value inside an inclusive range. */
export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Parse a user-typed number, falling back to a default when unparseable. */
export function parseNumberInput(value: string, fallback = 0): number {
  const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Validate an uploaded file against an allow-list before its metadata is
 * stored. Files are never executed or read into memory beyond a size check, so
 * the locker carries zero execution risk.
 */
export interface FileValidationResult {
  valid: boolean;
  reason?: string;
}

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES: readonly string[] = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'text/plain',
];

export function validateUpload(file: { name: string; size: number; type: string }): FileValidationResult {
  if (!file.name) return { valid: false, reason: 'The file has no name.' };
  if (file.size <= 0) return { valid: false, reason: 'The file is empty.' };
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { valid: false, reason: 'Files must be 10 MB or smaller.' };
  }
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, reason: 'Unsupported file type. Use PDF, DOCX, PNG, JPG or TXT.' };
  }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'txt'];
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, reason: 'Unsupported file extension.' };
  }
  return { valid: true };
}
