import { create } from 'zustand';
import type { Message, AIResult, AIState, Status, Priority } from '../types';
import rawMessages from '../data/messages.json';

const messages = rawMessages as Message[];

interface InboxState {
  // Data
  messages: Message[];
  selectedId: string | null;

  // AI cache: keyed by message id
  aiCache: Record<string, AIResult>;

  // Per-message AI state (live loading/streaming state)
  aiState: Record<string, AIState>;

  // Per-message user notes (overrides the initial notes field)
  notes: Record<string, string>;

  // Debug mode toggle
  debugMode: boolean;

  // Actions
  selectMessage: (id: string | null) => void;
  updateStatus: (id: string, status: Status) => void;
  updatePriority: (id: string, priority: Priority) => void;
  updateNotes: (id: string, notes: string) => void;
  markDone: (ids: string[]) => void;

  // AI actions
  setAIState: (id: string, state: Partial<AIState>) => void;
  setAICache: (id: string, result: AIResult) => void;
  clearAICache: (id: string) => void;
  setStreamedDraft: (id: string, text: string) => void;
  setUserEditedDraft: (id: string, edited: boolean) => void;

  toggleDebugMode: () => void;
}

const defaultAIState = (): AIState => ({
  result: null,
  status: 'idle',
  error: null,
  streamedDraft: '',
  isStreaming: false,
  userEditedDraft: false,
  debugInfo: null,
});

export const useInboxStore = create<InboxState>((set, get) => ({
  messages,
  selectedId: null,
  aiCache: {},
  aiState: {},
  notes: Object.fromEntries(messages.map((m) => [m.id, m.notes])),
  debugMode: false,

  selectMessage: (id) => set({ selectedId: id }),

  updateStatus: (id, status) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, status } : m)),
    })),

  updatePriority: (id, priority) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, priority } : m
      ),
    })),

  updateNotes: (id, notes) =>
    set((state) => ({
      notes: { ...state.notes, [id]: notes },
    })),

  markDone: (ids) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        ids.includes(m.id) ? { ...m, status: 'done' } : m
      ),
    })),

  setAIState: (id, partial) =>
    set((state) => ({
      aiState: {
        ...state.aiState,
        [id]: { ...defaultAIState(), ...state.aiState[id], ...partial },
      },
    })),

  setAICache: (id, result) =>
    set((state) => ({
      aiCache: { ...state.aiCache, [id]: result },
    })),

  clearAICache: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.aiCache;
      return {
        aiCache: rest,
        aiState: {
          ...state.aiState,
          [id]: defaultAIState(),
        },
      };
    }),

  setStreamedDraft: (id, text) =>
    set((state) => ({
      aiState: {
        ...state.aiState,
        [id]: { ...defaultAIState(), ...state.aiState[id], streamedDraft: text },
      },
    })),

  setUserEditedDraft: (id, edited) =>
    set((state) => ({
      aiState: {
        ...state.aiState,
        [id]: {
          ...defaultAIState(),
          ...state.aiState[id],
          userEditedDraft: edited,
        },
      },
    })),

  toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),

  // Expose defaultAIState factory for consumers
  ...{ _defaultAIState: defaultAIState },
}));

// Stable fallback — module-level constant so Zustand's Object.is check never
// sees a new reference when the AI state for a message hasn't been set yet.
export const DEFAULT_AI_STATE: AIState = {
  result: null,
  status: 'idle',
  error: null,
  streamedDraft: '',
  isStreaming: false,
  userEditedDraft: false,
  debugInfo: null,
};

// Selector helpers (use these in components to avoid re-renders)
export const selectMessages = (s: InboxState) => s.messages;
export const selectSelectedId = (s: InboxState) => s.selectedId;
export const selectSelectedMessage = (s: InboxState) =>
  s.messages.find((m) => m.id === s.selectedId) ?? null;
export const selectAIState = (id: string) => (s: InboxState) =>
  s.aiState[id] ?? DEFAULT_AI_STATE;
export const selectAICache = (id: string) => (s: InboxState) =>
  s.aiCache[id] ?? null;
export const selectNotes = (id: string) => (s: InboxState) =>
  s.notes[id] ?? '';
export const selectDebugMode = (s: InboxState) => s.debugMode;
