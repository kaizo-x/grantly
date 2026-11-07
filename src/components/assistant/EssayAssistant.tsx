import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, RotateCcw, Send, Sparkles, User, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAssistantStore } from '../../store/useAssistantStore';
import { useAppStore } from '../../store/useAppStore';
import { buildEssayOutline, formatOutline } from '../../utils/assistant';
import { sanitizeText } from '../../utils/sanitize';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useScrollLock } from '../../hooks/useScrollLock';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

/** One-tap starting points for students who do not know where to begin. */
const QUICK_PROMPTS: readonly string[] = [
  'Outline a personal statement about how my family\u2019s financial situation shaped my goals.',
  'Draft an outline for a statement of purpose for an M.Tech in Computer Science.',
  'Outline an essay on why I should receive a need-based scholarship.',
  'Structure a 500-word essay about a community initiative that shaped my goals.',
];

/** How long the mock "thinking" pause lasts, in milliseconds. */
const THINKING_MS = 650;

/**
 * Essay Coach — a slide-over assistant that turns a scholarship prompt into a
 * structured, five-section outline.
 *
 * The generator is local and deterministic; no student data leaves the device.
 */
export function EssayAssistant() {
  const open = useAssistantStore((state) => state.open);
  const draft = useAssistantStore((state) => state.draft);
  const setDraft = useAssistantStore((state) => state.setDraft);
  const closeAssistant = useAssistantStore((state) => state.closeAssistant);

  const messages = useAppStore((state) => state.assistantMessages);
  const pushAssistantMessage = useAppStore((state) => state.pushAssistantMessage);
  const resetAssistant = useAppStore((state) => state.resetAssistant);
  const profile = useAppStore((state) => state.profile);

  const [thinking, setThinking] = useState(false);
  const panelRef = useFocusTrap<HTMLDivElement>(open);
  const logRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  useScrollLock(open);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') closeAssistant();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeAssistant]);

  // Clear any pending mock-response timer on unmount.
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  // Keep the transcript pinned to the newest message.
  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, thinking, open]);

  const generate = (prompt: string): void => {
    const clean = sanitizeText(prompt).slice(0, 1000);
    if (!clean) return;

    pushAssistantMessage({ role: 'user', content: clean });
    setDraft('');
    setThinking(true);

    timerRef.current = window.setTimeout(() => {
      const outline = buildEssayOutline(clean, profile);
      pushAssistantMessage({ role: 'assistant', content: formatOutline(outline) });
      setThinking(false);
      timerRef.current = null;
    }, THINKING_MS);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    generate(draft);
  };

  const handleDraftKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      generate(draft);
    }
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div key="essay-assistant" className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={closeAssistant}
            aria-hidden="true"
          />

          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="essay-assistant-title"
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="absolute right-0 top-0 flex h-full w-[min(28rem,100vw)] flex-col border-l border-border bg-card shadow-2xl"
          >
            {/* `div`, not `header`: inside a dialog a `header` would surface a
                second `banner` landmark alongside the app's top bar. */}
            <div className="flex items-start gap-3 border-b border-border p-4">
              <span
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"
                aria-hidden="true"
              >
                <Sparkles className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="essay-assistant-title" className="text-base font-semibold tracking-tight text-foreground">
                  Essay Coach
                </h2>
                <p className="text-xs text-muted-foreground">
                  Turns any prompt into a structured outline you can build on.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAssistant}
                aria-label="Close essay coach"
                className={cn(
                  'grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground',
                  'transition-colors hover:bg-muted hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div
              ref={logRef}
              role="log"
              aria-live="polite"
              aria-label="Essay coach conversation"
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn('flex gap-2.5', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                >
                  <span
                    className={cn(
                      'grid size-7 shrink-0 place-items-center rounded-full',
                      message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-primary/12 text-primary',
                    )}
                    aria-hidden="true"
                  >
                    {message.role === 'user' ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                  </span>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                      message.role === 'user'
                        ? 'border-primary/25 bg-primary/8 text-foreground'
                        : 'border-border bg-muted/50 text-foreground',
                    )}
                  >
                    <span className="sr-only">{message.role === 'user' ? 'You said: ' : 'Essay coach said: '}</span>
                    {message.content}
                  </div>
                </div>
              ))}

              {thinking ? (
                <p role="status" className="flex items-center gap-2 pl-9 text-xs text-muted-foreground">
                  <span className="flex gap-1" aria-hidden="true">
                    <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
                  </span>
                  Drafting your outline…
                </p>
              ) : null}
            </div>

            <div className="border-t border-border p-4">
              <div className="flex flex-wrap gap-1.5" aria-label="Quick start prompts">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => generate(prompt)}
                    className={cn(
                      'rounded-full border border-border bg-card px-2.5 py-1 text-left text-[11px] font-medium text-muted-foreground',
                      'transition-colors hover:border-primary/40 hover:bg-primary/8 hover:text-primary',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    )}
                  >
                    {prompt.length > 46 ? `${prompt.slice(0, 43)}…` : prompt}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
                <label htmlFor="essay-prompt-input" className="sr-only">
                  Scholarship essay prompt
                </label>
                <Textarea
                  id="essay-prompt-input"
                  rows={3}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleDraftKeyDown}
                  maxLength={1000}
                  placeholder="Paste the scholarship prompt, or describe what you need to write…"
                />
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetAssistant();
                      setDraft('');
                    }}
                    leftIcon={<RotateCcw />}
                  >
                    Reset
                  </Button>
                  <Button type="submit" loading={thinking} disabled={!draft.trim()} leftIcon={<Send />}>
                    Draft outline
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Runs entirely on your device — nothing is uploaded. Press Ctrl/⌘ + Enter to generate.
                </p>
              </form>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
