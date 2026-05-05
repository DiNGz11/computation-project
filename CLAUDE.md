# Computation Models Simulator

A client-side React webapp that lets Israeli high-school students build and test
DFA / NFA, PDA, and Turing Machine automata visually on a whiteboard.

## Audience & language
- Target users: Israeli high school students (NOT university level).
- ALL UI strings are in **Hebrew** — never write English in the UI.
- Layout is **RTL** (`<html dir="rtl">` is set in `index.html`). Test in RTL.
- **No formal math notation in the UI.** Avoid Σ, δ, Q-tuples, λ, ε in user-facing text.
  Say "מצב התחלתי" not "q₀". Say "אות" not "סמל אלפבית".
- The machine alphabet is **implicit** — every letter the user types in a
  transition automatically becomes part of the alphabet. There is no
  alphabet-definition step.

## Tech
- Vite + React + TypeScript
- React Flow (`@xyflow/react`) for the whiteboard canvas. Custom nodes/edges
  live in `src/components/nodes/` and `src/components/edges/`. Do NOT replace
  with custom SVG/canvas code.
- Zustand for state, persisted to `localStorage` via `zustand/middleware`
  (`src/store/machineStore.ts`)
- Tailwind CSS — use logical properties (`ms-`, `me-`, `border-s`, `border-e`)
  or the `rtl:` variants for direction-aware styles
- React Router for `/`, `/dfa`, `/pda`, `/tm`
- Persistence: `localStorage` only. **No backend, no accounts.**

## Project structure
```
src/
  App.tsx               root + router
  pages/                HomePage, DfaPage, PdaPage, TmPage
  components/           Whiteboard, Toolbar, AlertsPanel, *TestPanel, *TransitionModal
    nodes/StateNode.tsx
    edges/TransitionEdge.tsx
  store/machineStore.ts Zustand store, all 3 machines + actions
  logic/                pure simulator logic — dfa.ts, pda.ts, tm.ts
  types/machine.ts      shared types
  i18n/he.ts            ALL Hebrew strings (don't hardcode in components)
```

## Design rules
- Whiteboard must feel minimalist. Toolbar = top bar, sidebar = side panel
  (right side in LTR / left side in RTL — we use `border-s` so it Just Works).
- States = circles. Accepting = double circle. Start = SVG line+arrowhead
  pointing into the state from the logical-start side (right in RTL).
- The ALERTS panel is the single source of "machine problems" feedback;
  do NOT block user actions — only warn. (Determinism design Option 2 from the
  plan: free creation + live warnings.)
- All Hebrew strings live in `src/i18n/he.ts`. Don't hard-code Hebrew literals
  in components.
- State interactions (DFA page):
  - Single click = select → shows StateEditPanel in the sidebar.
  - Double-click = inline rename (input appears inside the circle; supports Hebrew).
  - Right-click = set as start state.
  - Hover the state → a `+` button appears below it; clicking it enters
    "pending transition" mode (banner shown, crosshair cursor); click any target
    state to create the transition, Escape/pane-click to cancel.
  - Click-drag from any handle to another state = create a transition (React Flow
    native interaction).
  - Double-click on empty canvas = create new state at cursor position.
- Transitions (DFA): label input only allows letters (Latin + Hebrew), digits,
  and commas (multi-letter transitions are comma-separated: `a,b,c`).
- Floating edges: TransitionEdge uses `useInternalNode` to compute the exact
  circle-perimeter intersection point so edges connect from all sides, not just
  fixed NSEW handle positions. Self-loops render as a bump above the circle.
- Drag a state to move it. The store auto-persists position to localStorage.
- StateEditPanel (`src/components/StateEditPanel.tsx`): rename, toggle accepting,
  set-as-start, and delete (with confirmation). Shown in sidebar when a state is
  selected; closed by clicking ×, clicking another state, or pressing Escape.

## Workflow
- After every code change, run `git add`, `git commit`, and `git push` before reporting the task done.

## Code style
- TypeScript strict mode on
- Functional components + hooks only; no class components
- Keep simulator logic (run, validate) in `src/logic/*.ts` —
  pure functions, no React imports there. This makes them testable.

## Out of scope (for now)
- Sharing / multiplayer / accounts
- Server-side anything (no API, no DB)
- University-level features (regex → DFA conversion, CFG → PDA conversion,
  complexity classes, minimization algorithms, etc.)
- Alphabet-definition UI (the alphabet is implicit, see above)
