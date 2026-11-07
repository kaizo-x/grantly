import { create } from 'zustand';
import { sanitizeText } from '../utils/sanitize';

/** Longest prompt the coach accepts, in characters. */
const MAX_PROMPT_LENGTH = 1000;

/**
 * Ephemeral UI state for the Essay Coach drawer.
 *
 * Deliberately kept out of the persisted app store: the drawer's open state and
 * in-progress prompt are session-scoped, while the transcript itself lives in
 * the persisted store so a student's drafts survive a refresh. Holding the
 * composer text here — rather than in component state — lets the drawer adopt a
 * scholarship prompt without any synchronising effect.
 */
interface AssistantStore {
  open: boolean;
  /** Current text of the prompt composer. */
  draft: string;
  /**
   * Open the coach. Supplying a scholarship prompt pre-fills the composer;
   * opening without one preserves whatever the student was last typing.
   */
  openAssistant: (seedPrompt?: string) => void;
  closeAssistant: () => void;
  setDraft: (draft: string) => void;
}

export const useAssistantStore = create<AssistantStore>((set) => ({
  open: false,
  draft: '',
  openAssistant: (seedPrompt) =>
    set((state) => ({
      open: true,
      draft: seedPrompt ? sanitizeText(seedPrompt).slice(0, MAX_PROMPT_LENGTH) : state.draft,
    })),
  closeAssistant: () => set({ open: false }),
  setDraft: (draft) => set({ draft: draft.slice(0, MAX_PROMPT_LENGTH) }),
}));
