/**
 * Client-side session & credential registry.
 *
 * GRANTLY is a front-end demonstration and ships no server, so onboarding is
 * modelled entirely on device. This module owns the two things that flow
 * persists:
 *
 *   1. `grantly_user_session` — the signed-in user, read by the root session
 *      check that decides between the Auth Gateway and the dashboard shell.
 *   2. `user_<email>` — the credential record written by the registration form
 *      and validated by the login form.
 *
 * Every read/write goes through the guarded storage adapter so private-mode or
 * quota failures cannot blank the gateway, and every read is shape-checked so a
 * hand-edited or stale payload can never reach the render tree as `undefined`.
 *
 * Note: this is a local demo registry, not an authentication system — it has no
 * backend to hash against and stores nothing beyond the browser's own storage.
 */
import type { EducationLevel } from '../types';
import { EDUCATION_LEVELS } from '../data/scholarships';
import { readRaw, removeRaw, writeRaw } from './storage';

/** Raw key holding the signed-in user; read by the root session check. */
export const SESSION_STORAGE_KEY = 'grantly_user_session';

/** The signed-in user. `isDemo` marks the one-click judge profile. */
export interface GrantlyUser {
  readonly name: string;
  readonly email: string;
  readonly educationLevel: EducationLevel;
  readonly annualFamilyIncome: number;
  readonly isDemo: boolean;
}

/** The credential record written by the registration form. */
export interface StoredCredentials {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly educationLevel: EducationLevel;
  readonly annualFamilyIncome: number;
}

/**
 * The pre-populated persona behind "Evaluate Demo Profile".
 *
 * Mirrors `DEFAULT_PROFILE`, so one click lands a judge on a dashboard whose
 * match scores, tracker board and document locker are all already populated.
 */
export const DEMO_USER: GrantlyUser = {
  name: 'Ananya Sharma',
  email: 'ananya.sharma@example.edu.in',
  educationLevel: 'Undergraduate',
  annualFamilyIncome: 420_000,
  isDemo: true,
};

/* -------------------------------------------------------------------------- */
/*  Storage primitives                                                         */
/* -------------------------------------------------------------------------- */

/** Storage key under which a given email's credentials live. */
export function credentialsKey(email: string): string {
  return `user_${email.trim().toLowerCase()}`;
}

/** Narrow an unknown value to a supported education level. */
export function isEducationLevel(value: unknown): value is EducationLevel {
  return EDUCATION_LEVELS.includes(value as EducationLevel);
}

function readJson<T>(key: string): T | null {
  const raw = readRaw(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    writeRaw(key, JSON.stringify(value));
  } catch {
    /* Non-fatal: the in-memory session state still drives the current render. */
  }
}

/* -------------------------------------------------------------------------- */
/*  Session                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Read and normalise the persisted session.
 *
 * Returns `null` for anything that is not a recognisable user object, which is
 * what sends a first-time visitor — and a judge arriving on a clean profile —
 * straight to the Auth Gateway.
 */
export function readSession(): GrantlyUser | null {
  const session = readJson<Partial<GrantlyUser>>(SESSION_STORAGE_KEY);
  if (!session || typeof session.name !== 'string' || typeof session.email !== 'string') {
    return null;
  }
  return {
    name: session.name,
    email: session.email,
    educationLevel: isEducationLevel(session.educationLevel) ? session.educationLevel : 'Undergraduate',
    annualFamilyIncome:
      typeof session.annualFamilyIncome === 'number' && Number.isFinite(session.annualFamilyIncome)
        ? session.annualFamilyIncome
        : 0,
    isDemo: session.isDemo === true,
  };
}

/** Persist the signed-in user under the exact key the root check reads. */
export function writeSession(user: GrantlyUser): void {
  writeJson(SESSION_STORAGE_KEY, user);
}

/** Drop the session — returning the app to the Auth Gateway. */
export function clearSession(): void {
  removeRaw(SESSION_STORAGE_KEY);
}

/* -------------------------------------------------------------------------- */
/*  Credentials                                                                */
/* -------------------------------------------------------------------------- */

export function readCredentials(email: string): StoredCredentials | null {
  const record = readJson<StoredCredentials>(credentialsKey(email));
  if (!record || typeof record.password !== 'string' || typeof record.email !== 'string') {
    return null;
  }
  return record;
}

export function saveCredentials(credentials: StoredCredentials): void {
  writeJson(credentialsKey(credentials.email), credentials);
}

/**
 * Verify an email/password pair against the local registry.
 *
 * Returns the session-shaped user on success and `null` on any mismatch, so the
 * caller never has to reason about partially-populated records.
 */
export function authenticate(email: string, password: string): GrantlyUser | null {
  const record = readCredentials(email);
  if (!record || record.password !== password) return null;
  return {
    name: record.name,
    email: record.email,
    educationLevel: isEducationLevel(record.educationLevel) ? record.educationLevel : 'Undergraduate',
    annualFamilyIncome:
      typeof record.annualFamilyIncome === 'number' && Number.isFinite(record.annualFamilyIncome)
        ? record.annualFamilyIncome
        : 0,
    isDemo: false,
  };
}
