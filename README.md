# AI Triage Inbox

A single-page inbox application that uses a mock AI engine to triage, classify, and draft replies for customer support messages.

Built as a take-home assignment to demonstrate React architecture, AI integration patterns, and production-quality frontend engineering.

---

## Setup

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173` by default.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + Vite 8 | Fast HMR, React Compiler enabled |
| Language | TypeScript (strict) | Full type safety across store, AI layer, components |
| State | Zustand 5 | Minimal API, stable selector pattern, no boilerplate |
| Styling | Tailwind CSS v4 | Utility-first, responsive, no runtime cost |
| Validation | Zod v4 | Schema-validates every AI response before it touches the UI |
| Build | Vite + Rolldown | Sub-second builds |

---

## Features

| Feature | Description |
|---|---|
| **Inbox list** | 18 realistic messages spanning billing, claims, spam, legal, and more |
| **Filters** | Filter by status (New / In Progress / Done) and priority (P1 / P2 / P3) |
| **Search** | Client-side search on subject, sender name, and company (`useMemo`) |
| **Bulk actions** | Select multiple messages and mark them done in one click |
| **Keyboard nav** | `j/k` to move, `/` to focus search, `Enter` to open (desktop) |
| **Detail view** | Full message body, sender avatar, status/priority dropdowns, internal notes |
| **AI Assist** | Analyze any message: summary bullets, category, priority suggestion, confidence |
| **Streaming draft** | Draft reply streams word-by-word (3–5 words / 80ms) like a real LLM |
| **Stop button** | Halt streaming mid-way — partial draft stays visible |
| **Regenerate** | Force a fresh AI call; confirms first if the draft has been edited |
| **Copy draft** | One-click clipboard copy with 2-second confirmation flash |
| **Cache** | Re-opening an analyzed message shows the result instantly — no re-fetch |
| **Error handling** | ~12% of AI calls fail on purpose; retry button resets cleanly |
| **Debug mode** | Toggle `🐛 Debug` to see raw AI response, Zod validation status, latency, template index |
| **Responsive** | Single-panel view on mobile — inbox list and detail panel swap with a back button |

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `j` / `↓` | Move to next message |
| `k` / `↑` | Move to previous message |
| `Enter` | Open focused message |
| `/` | Focus search input |
| `Esc` | Clear search and blur |

---

## Project structure

```
src/
├── components/
│   ├── InboxList/
│   │   ├── InboxList.tsx      # List with filters, search, bulk select, keyboard nav
│   │   └── MessageRow.tsx     # React.memo row — badge, unread dot, relative time
│   └── DetailPanel/
│       ├── DetailPanel.tsx    # Message body, status/priority controls, notes
│       ├── AIPanel.tsx        # All four AI states — idle, loading, error, success
│       ├── DebugPanel.tsx     # Raw JSON, Zod result, latency stats
│       └── Skeleton.tsx       # Animated loading placeholder
├── hooks/
│   └── useAIAnalysis.ts       # AI fetch → stream → cache, AbortController lifecycle
├── lib/
│   ├── mockAI.ts              # Deterministic mock engine, Zod validation, 12% failure
│   └── utils.ts               # cn(), formatRelativeTime(), formatFullTime()
├── store/
│   └── useInboxStore.ts       # Zustand store — messages, AI state, notes, debug mode
├── types/
│   └── index.ts               # Message, AIResult, AIState, AIDebugInfo
└── data/
    └── messages.json          # 18 seed messages covering all edge cases
```

---

## Architecture notes

### AI as an unreliable dependency

`mockAI.ts` treats the AI layer as an external service that can be slow, fail, or return invalid data:

- **Deterministic** — `hashId(messageId)` always picks the same template, so bugs are reproducible
- **Latency simulation** — 200–1200ms delay, also seeded by message ID
- **12% failure rate** — seeded so the same message always fails or always passes
- **Zod validation** — every response is schema-checked before reaching the UI; `AIValidationError` vs `AIServiceError` are distinct

### Race condition safety in `useAIAnalysis`

Three guarantees:

1. **AbortController** — switched-away fetch is cancelled instantly; the response is silently dropped
2. **Interval cleanup** — `setInterval` for streaming is cleared on `messageId` change and unmount
3. **Stale guard** — `if (controller.signal.aborted) return` before any `setState` call

### Zustand stability trick

Selector functions that return object literals create a new reference every render, causing infinite re-render loops. All fallback values are module-level constants (`DEFAULT_AI_STATE`) so `Object.is` comparisons are stable.

---

## Tradeoffs

**What was cut deliberately:**

- **No backend** — all state is in-memory; a refresh resets everything. localStorage persistence would be the obvious next step.
- **Streaming is simulated** — `setInterval` word-reveal rather than a real `ReadableStream`. The interface is identical from the component's perspective — swapping in a real stream only requires changing `useAIAnalysis`.
- **No test coverage** — the architecture is testable (pure functions, typed store, isolated hooks) but tests were out of scope for the time budget.
- **Single category per message** — real messages often span multiple categories. A multi-label classifier and split-view reply would handle this better.

---

## What I'd add next

- **Real AI** — swap `analyzeMessage` for a Claude or OpenAI streaming endpoint; the hook interface stays the same
- **localStorage persistence** — notes, status changes, and AI cache survive a refresh
- **Bulk AI analysis** — "Analyze all P1 messages" button with a progress indicator
- **Keyboard shortcut `a`** — trigger AI analysis from the inbox list without opening the detail panel
- **Threading** — group messages by sender/subject into conversations
- **Vitest + Testing Library** — unit tests for `mockAI.ts`, `useAIAnalysis`, store selectors
- **Dark mode** — CSS variables are already structured for it; a `prefers-color-scheme` media query + toggle is straightforward

---

## Lighthouse (desktop, production build)

Run `npm run build && npm run preview` then open Chrome DevTools → Lighthouse.

---

## Total hours

See [TIMELOG.md](./TIMELOG.md) — approximately **11-12 hours** across 8 phases.
