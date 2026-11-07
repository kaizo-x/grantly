import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ApplicationRecord,
  ApplicationStage,
  AssistantMessage,
  FilterState,
  SavedSearch,
  StoredDocument,
  StudentProfile,
} from '../types';
import { DEFAULT_PROFILE } from '../data/defaultProfile';
import { getScholarshipById } from '../data/scholarships';
import { DEFAULT_FILTERS } from '../utils/filter';
import { createId } from '../lib/id';
import { sanitizeText } from '../utils/sanitize';
import { APP_STORAGE_KEY, applyTheme, readInitialTheme, zustandStorage, type Theme } from '../lib/storage';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Keys on `FilterState` that hold arrays of selectable tokens. */
type ArrayFilterKey = 'fields' | 'educationLevels' | 'categories' | 'deadlineStatus';

/** Everything that survives a page refresh. */
interface AppData {
  profile: StudentProfile;
  theme: Theme;
  filters: FilterState;
  savedSearches: SavedSearch[];
  savedIds: string[];
  applications: Record<string, ApplicationRecord>;
  documents: StoredDocument[];
  assistantMessages: AssistantMessage[];
}

/** Everything the UI can invoke. */
interface AppActions {
  updateProfile: (patch: Partial<StudentProfile>) => void;
  resetProfile: () => void;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  setFilters: (patch: Partial<FilterState>) => void;
  toggleArrayFilter: <K extends ArrayFilterKey>(key: K, value: FilterState[K][number]) => void;
  resetFilters: () => void;

  saveCurrentSearch: (name: string) => void;
  applySavedSearch: (id: string) => void;
  deleteSavedSearch: (id: string) => void;

  toggleSaved: (scholarshipId: string) => void;
  isSaved: (scholarshipId: string) => boolean;

  trackApplication: (scholarshipId: string, requirementLabels: readonly string[]) => void;
  moveApplication: (scholarshipId: string, stage: ApplicationStage) => void;
  removeApplication: (scholarshipId: string) => void;
  toggleChecklistItem: (scholarshipId: string, item: string) => void;
  setApplicationNotes: (scholarshipId: string, notes: string) => void;
  toggleReminder: (scholarshipId: string) => void;

  addDocument: (document: Omit<StoredDocument, 'id' | 'uploadedAt'>) => void;
  removeDocument: (id: string) => void;

  pushAssistantMessage: (message: Omit<AssistantMessage, 'id' | 'createdAt'>) => void;
  resetAssistant: () => void;

  resetAll: () => void;
}

export type AppStore = AppData & AppActions;

/* -------------------------------------------------------------------------- */
/*  Seed data                                                                  */
/* -------------------------------------------------------------------------- */

/** Build a checklist map from a scholarship's required-documents list. */
function buildChecklist(labels: readonly string[], completed: readonly string[] = []): Record<string, boolean> {
  return labels.reduce<Record<string, boolean>>((accumulator, label) => {
    accumulator[label] = completed.includes(label);
    return accumulator;
  }, {});
}

/**
 * A populated starting board so the tracker is meaningful on first load.
 *
 * Requirement labels are read straight from the dataset rather than duplicated
 * here, so a seeded checklist can never drift from the real scheme.
 */
function seedApplications(): Record<string, ApplicationRecord> {
  const now = new Date().toISOString();
  const make = (
    scholarshipId: string,
    stage: ApplicationStage,
    /** How many of the scheme's required documents are already on file. */
    completedCount: number,
    submittedAt: string | null = null,
  ): ApplicationRecord => {
    const requirements = getScholarshipById(scholarshipId)?.documentsRequired ?? [];
    return {
      scholarshipId,
      stage,
      checklist: buildChecklist(requirements, requirements.slice(0, completedCount)),
      notes: '',
      updatedAt: now,
      submittedAt,
      reminderEnabled: stage === 'in-progress',
    };
  };

  return {
    'nsp-pm-usp-2026': make('nsp-pm-usp-2026', 'in-progress', 2),
    'aicte-pragati-girls': make('aicte-pragati-girls', 'submitted', 4, now),
    'reliance-foundation-ug': make('reliance-foundation-ug', 'awarded', 3, now),
    'inspire-she-dst': make('inspire-she-dst', 'saved', 0),
    'idfc-first-bank-mba': make('idfc-first-bank-mba', 'rejected', 1),
  };
}

/** A populated document locker so progress states are visible immediately. */
function seedDocuments(): StoredDocument[] {
  const now = Date.now();
  const at = (offsetHours: number): string => new Date(now - offsetHours * 3_600_000).toISOString();

  return [
    {
      id: createId('doc'),
      name: 'Class_12_Marksheet.pdf',
      category: 'transcript',
      sizeBytes: 486_912,
      mimeType: 'application/pdf',
      uploadedAt: at(240),
      status: 'verified',
    },
    {
      id: createId('doc'),
      name: 'Income_Certificate_Tehsildar.pdf',
      category: 'financial',
      sizeBytes: 215_040,
      mimeType: 'application/pdf',
      uploadedAt: at(180),
      status: 'verified',
    },
    {
      id: createId('doc'),
      name: 'Recommendation_Prof_Deshpande.pdf',
      category: 'recommendation',
      sizeBytes: 132_096,
      mimeType: 'application/pdf',
      uploadedAt: at(96),
      status: 'verified',
    },
    {
      id: createId('doc'),
      name: 'Statement_of_Purpose_Draft.docx',
      category: 'essay',
      sizeBytes: 38_912,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedAt: at(30),
      status: 'pending',
    },
    {
      id: createId('doc'),
      name: 'Aadhaar_Card_Scan.png',
      category: 'identification',
      sizeBytes: 1_248_576,
      mimeType: 'image/png',
      uploadedAt: at(12),
      status: 'verified',
    },
  ];
}

const INITIAL_ASSISTANT_MESSAGE: AssistantMessage = {
  id: 'assistant-welcome',
  role: 'assistant',
  content:
    'Hi! I\u2019m your GRANTLY essay coach. Share a scholarship prompt and a little about yourself, and I\u2019ll draft a structured outline you can build on. Try the quick-start prompts below.',
  createdAt: new Date().toISOString(),
};

/* -------------------------------------------------------------------------- */
/*  Store                                                                      */
/* -------------------------------------------------------------------------- */

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      /* ----------------------------- initial state ----------------------- */
      profile: DEFAULT_PROFILE,
      theme: readInitialTheme(),
      filters: DEFAULT_FILTERS,
      savedSearches: [],
      savedIds: ['nsp-pm-usp-2026', 'reliance-foundation-ug'],
      applications: seedApplications(),
      documents: seedDocuments(),
      assistantMessages: [INITIAL_ASSISTANT_MESSAGE],

      /* -------------------------------- profile -------------------------- */
      updateProfile: (patch) =>
        set((state) => ({
          profile: {
            ...state.profile,
            ...patch,
            // Free-text fields are sanitised at the boundary.
            ...(patch.fullName !== undefined ? { fullName: sanitizeText(patch.fullName) } : {}),
            ...(patch.email !== undefined ? { email: sanitizeText(patch.email) } : {}),
            ...(patch.institution !== undefined ? { institution: sanitizeText(patch.institution) } : {}),
            ...(patch.state !== undefined ? { state: sanitizeText(patch.state) } : {}),
            ...(patch.bio !== undefined ? { bio: sanitizeText(patch.bio) } : {}),
          },
        })),

      resetProfile: () => set({ profile: DEFAULT_PROFILE }),

      /* --------------------------------- theme --------------------------- */
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },

      /* -------------------------------- filters -------------------------- */
      setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),

      toggleArrayFilter: (key, value) =>
        set((state) => {
          const current = state.filters[key] as readonly string[];
          const next = current.includes(value)
            ? current.filter((entry) => entry !== value)
            : [...current, value];
          return { filters: { ...state.filters, [key]: next } as FilterState };
        }),

      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      /* ----------------------------- saved searches ---------------------- */
      saveCurrentSearch: (name) =>
        set((state) => ({
          savedSearches: [
            {
              id: createId('search'),
              name: sanitizeText(name).slice(0, 60) || 'Untitled search',
              filters: state.filters,
              createdAt: new Date().toISOString(),
            },
            ...state.savedSearches,
          ].slice(0, 12),
        })),

      applySavedSearch: (id) =>
        set((state) => {
          const match = state.savedSearches.find((search) => search.id === id);
          return match ? { filters: match.filters } : {};
        }),

      deleteSavedSearch: (id) =>
        set((state) => ({ savedSearches: state.savedSearches.filter((search) => search.id !== id) })),

      /* ---------------------------- saved scholarships ------------------- */
      toggleSaved: (scholarshipId) =>
        set((state) => ({
          savedIds: state.savedIds.includes(scholarshipId)
            ? state.savedIds.filter((id) => id !== scholarshipId)
            : [...state.savedIds, scholarshipId],
        })),

      isSaved: (scholarshipId) => get().savedIds.includes(scholarshipId),

      /* ------------------------------ applications ----------------------- */
      trackApplication: (scholarshipId, requirementLabels) =>
        set((state) => {
          if (state.applications[scholarshipId]) return state;
          const record: ApplicationRecord = {
            scholarshipId,
            stage: 'saved',
            checklist: buildChecklist(requirementLabels),
            notes: '',
            updatedAt: new Date().toISOString(),
            submittedAt: null,
            reminderEnabled: false,
          };
          return { applications: { ...state.applications, [scholarshipId]: record } };
        }),

      moveApplication: (scholarshipId, stage) =>
        set((state) => {
          const existing = state.applications[scholarshipId];
          if (!existing) return state;
          return {
            applications: {
              ...state.applications,
              [scholarshipId]: {
                ...existing,
                stage,
                submittedAt:
                  stage === 'submitted' ? (existing.submittedAt ?? new Date().toISOString()) : existing.submittedAt,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      removeApplication: (scholarshipId) =>
        set((state) => {
          const next = { ...state.applications };
          delete next[scholarshipId];
          return { applications: next };
        }),

      toggleChecklistItem: (scholarshipId, item) =>
        set((state) => {
          const existing = state.applications[scholarshipId];
          if (!existing) return state;
          return {
            applications: {
              ...state.applications,
              [scholarshipId]: {
                ...existing,
                checklist: { ...existing.checklist, [item]: !existing.checklist[item] },
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      setApplicationNotes: (scholarshipId, notes) =>
        set((state) => {
          const existing = state.applications[scholarshipId];
          if (!existing) return state;
          return {
            applications: {
              ...state.applications,
              [scholarshipId]: {
                ...existing,
                notes: sanitizeText(notes).slice(0, 2000),
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      toggleReminder: (scholarshipId) =>
        set((state) => {
          const existing = state.applications[scholarshipId];
          if (!existing) return state;
          return {
            applications: {
              ...state.applications,
              [scholarshipId]: {
                ...existing,
                reminderEnabled: !existing.reminderEnabled,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      /* -------------------------------- documents ------------------------ */
      addDocument: (document) =>
        set((state) => ({
          documents: [
            { ...document, id: createId('doc'), uploadedAt: new Date().toISOString() },
            ...state.documents,
          ],
        })),

      removeDocument: (id) => set((state) => ({ documents: state.documents.filter((doc) => doc.id !== id) })),

      /* -------------------------------- assistant ------------------------ */
      pushAssistantMessage: (message) =>
        set((state) => ({
          assistantMessages: [
            ...state.assistantMessages,
            { ...message, id: createId('msg'), createdAt: new Date().toISOString() },
          ].slice(-40),
        })),

      resetAssistant: () => set({ assistantMessages: [INITIAL_ASSISTANT_MESSAGE] }),

      /* ---------------------------------- reset -------------------------- */
      resetAll: () =>
        set({
          profile: DEFAULT_PROFILE,
          filters: DEFAULT_FILTERS,
          savedSearches: [],
          savedIds: [],
          applications: {},
          documents: [],
          assistantMessages: [INITIAL_ASSISTANT_MESSAGE],
        }),
    }),
    {
      name: APP_STORAGE_KEY,
      storage: zustandStorage,
      version: 2,
      // Persist data only — action functions are recreated on every load.
      partialize: (state): AppData => ({
        profile: state.profile,
        theme: state.theme,
        filters: state.filters,
        savedSearches: state.savedSearches,
        savedIds: state.savedIds,
        applications: state.applications,
        documents: state.documents,
        assistantMessages: state.assistantMessages,
      }),
      onRehydrateStorage: () => (state) => {
        // Keep <html> in sync with whatever theme was restored.
        if (state) applyTheme(state.theme);
      },
    },
  ),
);
