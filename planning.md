I'll read through the assignment carefully and create a clear, actionable plan for you.

Here's a structured plan you can follow and confidently explain in an interview:

---

## 🗂️ AI Triage Inbox — Build Plan

### Tech Stack Decisions (keep it simple to explain)
- **React + Vite** — fast setup, no fluff
- **Zustand** — lightweight state management (easy to explain vs Redux)
- **TailwindCSS** — rapid styling, responsive out of the box
- **Zod** — schema validation for AI responses
- **No backend, no router library needed** — single page, two panels

---

### Phase 1 — Scaffold & Mock Data (2–3h)

**Goal:** App runs, data loads, nothing crashes.

1. `npm create vite@latest` with React + TypeScript
2. Create `src/data/messages.json` — write **15–20 realistic messages** covering:
   - Billing dispute
   - Endorsement request
   - Urgent / real emergency
   - Spam / prompt injection attempt (the `itm_088` style)
   - Multi-topic / ambiguous
   - Very short vs very long body
3. Define your TypeScript types (`Message`, `AIResult`, `Status`, `Priority`)
4. Set up Zustand store with:
   - `messages[]`
   - `selectedId`
   - `aiCache: Record<itemId, AIResult>`

**What you tell the interviewer:** *"I started with a realistic dataset that covers edge cases — spam, urgent, multi-topic — because the mock data drives the whole demo quality."*

---

### Phase 2 — Inbox List (2–3h)

**Goal:** Left panel, fully functional.

1. Render list: sender name, subject, time (relative e.g. "2h ago"), status badge, priority badge
2. **Filters:** status (New / In Progress / Done) + priority (P1/P2/P3) — simple controlled selects
3. **Search:** `useMemo` filter on subject + sender, client-side only
4. **Bulk select:** checkbox per row + "Mark Done" button in toolbar
5. **Keyboard nav (j/k/Enter):** `useEffect` with `keydown` listener on the list — moves `selectedId` up/down, Enter opens detail

**What you tell the interviewer:** *"Keyboard nav was the chosen interaction model — j/k to move, Enter to open, / to focus search. This is the fastest triage flow for power users."*

---

### Phase 3 — Detail View (1–2h)

**Goal:** Right panel with real states.

1. Show full message body, sender, received time, channel
2. Status dropdown + Priority dropdown (updates Zustand store immediately)
3. Notes textarea (stored in Zustand, per item)
4. **States to implement explicitly:**
   - Empty state: *"Select a message to get started"*
   - Loading state: skeleton placeholder while AI runs
   - Error state: retry button with clear message

---

### Phase 4 — Mock AI Engine (2–3h)

**Goal:** Deterministic, simulated, schema-validated.

Create `src/lib/mockAI.ts`:

```ts
// Deterministic: hash itemId to pick from preset outputs
// Simulate latency: random 200–1200ms
// Simulate failures: ~12% of calls throw an error
// Returns AIResult matching Zod schema
```

1. Write **5–6 preset AI response templates** (billing, endorsement, spam, urgent, general, claims)
2. Hash `itemId` to always pick the same template → **deterministic**
3. Wrap in `setTimeout` with random delay
4. 12% chance → throw `new Error("AI service unavailable")` 
5. Validate response with **Zod schema** before returning

**Zod schema:**
```ts
const AIResultSchema = z.object({
  summary_bullets: z.array(z.string()).min(2).max(4),
  category: z.enum(["Billing","Claims","Endorsement","General","Urgent","Spam"]),
  priority: z.enum(["P1","P2","P3"]),
  suggested_action: z.string(),
  draft_reply: z.string(),
  confidence: z.number().min(0).max(1)
})
```

**What you tell the interviewer:** *"I treat the AI like an unreliable external service — it can fail, return bad JSON, or be slow. Zod validates every response before it touches the UI."*

---

### Phase 5 — AI Assist Panel + Streaming Draft (3–4h)

**Goal:** The most impressive part of the demo.

**Panel layout:**
- Summary bullets (2–4 items)
- Category chip + Priority suggestion
- Suggested action (one line)
- Draft reply textarea (editable, streaming)

**Streaming simulation (the stretch requirement — do it, it's high-impact):**
```
chunkDraftReply(fullText) → emit 3–5 words every 80ms via setInterval
```

**Critical rules to implement:**
1. **AbortController pattern** — on item switch, cancel in-flight AI call
2. **Cache check first** — `aiCache[itemId]` exists? Show it instantly, no re-fetch
3. **"Regenerate" is explicit** — button with confirmation if user edited the draft
4. **Stop button** — halts streaming, partial draft stays visible
5. **Race condition guard** — check `isMounted` / compare `selectedId` before writing to state

**What you tell the interviewer:** *"The AI panel has three hard guarantees: it never overwrites user edits silently, it never leaks output across items, and results are cached so re-opening an item is instant."*

---

### Phase 6 — Debug Mode (1h)

**Goal:** Shows you treat AI as an unreliable dependency.

- Toggle in header or settings: `🐛 Debug Mode`
- When ON, show a panel below the AI results with:
  - Raw JSON response
  - Validation errors (if Zod rejected anything)
  - "Retry" button to force re-fetch (bypasses cache)

---

### Phase 7 — Polish + Lighthouse (1–2h)

**Goal:** Score ≥ 90 on Desktop Performance + Best Practices.

Quick wins:
- `React.memo` on the inbox list row component
- `useMemo` for filtered/searched messages
- Lazy load the detail panel with `React.lazy` + `Suspense`
- No unused dependencies
- Add `<title>`, proper heading hierarchy, ARIA labels on icon buttons

Take Lighthouse screenshots before and after — mention 2–3 specific things you changed.

---

### Phase 8 — README + TIMELOG (30min)

**README must include:**
- Setup: `npm install && npm run dev`
- Feature summary (one line each)
- Keyboard shortcuts reference
- Tradeoffs: what you cut, what you'd add
- Lighthouse screenshots + notes
- Total hours

**TIMELOG.md** — fill in as you go, one line per session.

---

## 📅 Suggested Schedule (targeting ~16h)

| Day | Focus | Hours |
|-----|-------|-------|
| 1 | Scaffold + Mock data + Types + Zustand | 3h |
| 2 | Inbox list + Filters + Search + Keyboard nav | 3h |
| 3 | Detail view + States + Mock AI engine + Zod | 3h |
| 4 | AI panel + Streaming draft + Abort/cache | 4h |
| 5 | Debug mode + Polish + Lighthouse + README | 3h |

---

## ⚠️ The 3 Things That Will Impress Most

1. **Race condition safety** — switching items fast and nothing bleeds across. Mention AbortController explicitly.
2. **Streaming draft with Stop button** — it's listed as a "stretch" but it's actually easy with `setInterval` and makes the demo look alive.
3. **Zod validation + Debug mode** — shows engineering maturity. The interviewer explicitly said *"treat AI like an unreliable dependency."*