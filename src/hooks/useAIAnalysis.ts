import { useRef, useEffect, useCallback } from 'react';
import { useInboxStore, selectAICache } from '../store/useInboxStore';
import { analyzeMessage, AIServiceError, AIValidationError } from '../lib/mockAI';

/**
 * Wires the mock AI engine + streaming to the Zustand store for one message.
 *
 * Guarantees:
 * 1. Cache hit  → instant result + full draft, no re-fetch, no re-stream.
 * 2. Fresh fetch → streams draft word-by-word (3–5 words / 80 ms).
 * 3. AbortController cancels in-flight fetch on messageId change / unmount.
 * 4. setInterval is cleared on messageId change / unmount / stop / regenerate.
 * 5. Stale responses from a previous messageId are dropped before touching state.
 */
export function useAIAnalysis(messageId: string) {
  const controllerRef    = useRef<AbortController | null>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cachedResult = useInboxStore(selectAICache(messageId));
  const setAIState   = useInboxStore((s) => s.setAIState);
  const setAICache   = useInboxStore((s) => s.setAICache);

  // ── Cleanup on messageId change or unmount ──────────────────────────────
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
      clearStream();
    };
  }, [messageId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Internal helpers ────────────────────────────────────────────────────

  function clearStream() {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  }

  const startStreaming = useCallback(
    (id: string, fullText: string) => {
      clearStream();

      const words = fullText.split(/\s+/);
      let pos = 0;

      setAIState(id, { isStreaming: true, streamedDraft: '' });

      streamIntervalRef.current = setInterval(() => {
        const chunkSize = 3 + Math.floor(Math.random() * 3); // 3, 4, or 5 words
        pos = Math.min(pos + chunkSize, words.length);

        setAIState(id, { streamedDraft: words.slice(0, pos).join(' ') });

        if (pos >= words.length) {
          clearStream();
          setAIState(id, { isStreaming: false, streamedDraft: fullText });
        }
      }, 80);
    },
    [setAIState],
  );

  // ── Public API ──────────────────────────────────────────────────────────

  /** Stop streaming mid-way — partial draft stays visible. */
  const stopStreaming = useCallback(() => {
    clearStream();
    setAIState(messageId, { isStreaming: false });
  }, [messageId, setAIState]);

  /**
   * Fetch (or re-fetch) AI analysis.
   * @param forceRefresh  true → bypass cache (used by Regenerate).
   */
  const analyze = useCallback(
    async (forceRefresh = false) => {
      // ── Cache hit: show full result instantly, no streaming ──
      if (!forceRefresh && cachedResult) {
        setAIState(messageId, {
          status: 'success',
          result: cachedResult,
          streamedDraft: cachedResult.draft_reply,
          isStreaming: false,
        });
        return;
      }

      // ── Fresh fetch ──
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      clearStream();
      setAIState(messageId, {
        status: 'loading',
        error: null,
        result: null,
        streamedDraft: '',
        isStreaming: false,
      });

      try {
        const { result, debug } = await analyzeMessage(messageId, controller.signal);
        if (controller.signal.aborted) return; // raced — discard

        setAICache(messageId, result);
        setAIState(messageId, { status: 'success', result, debugInfo: debug });
        startStreaming(messageId, result.draft_reply);
      } catch (err) {
        if (controller.signal.aborted) return;

        const msg =
          err instanceof AIServiceError || err instanceof AIValidationError
            ? err.message
            : 'An unexpected error occurred.';

        const debugInfo =
          err instanceof AIServiceError ? (err.debug as import('../types').AIDebugInfo) : null;

        setAIState(messageId, { status: 'error', error: msg, debugInfo });
      }
    },
    [messageId, cachedResult, setAIState, setAICache, startStreaming],
  );

  /**
   * Regenerate: force-refresh, with confirmation if user edited the draft.
   */
  const regenerate = useCallback(() => {
    const currentAI = useInboxStore.getState().aiState[messageId];
    if (currentAI?.userEditedDraft) {
      if (!window.confirm('Discard your edits and regenerate the draft?')) return;
    }
    clearStream();
    setAIState(messageId, { userEditedDraft: false, streamedDraft: '' });
    analyze(true);
  }, [messageId, analyze, setAIState]);

  return { analyze, stopStreaming, regenerate };
}
