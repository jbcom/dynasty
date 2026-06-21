# Continuous Work Directive — Dynasty (maga-money-moves)

**Status:** ACTIVE
**Owner:** jbogaty (autonomous loop)
**Mandate (2026-06-21):** POLISH & FEATURES — AUTONOMOUS LOOP. Foundations done:
found-your-own / diegetic birth / orthogonal identity (PR #31), 1000-year dynasty breadth
+ GenAI toolkit + millennium run (PRs #34/#35). User directive (`/loop`): "add features
and improvements, polish the UI and UX, expand and compress directives — do this
AUTONOMOUSLY, make decisions, mutate your own loop prompt as you discover new content to
go in the direction of." So: self-pace; pick the highest-value improvement each cycle;
own the full PR loop; keep the directive a living plan (expand when discovery reveals
work, compress when items resolve). Work SERIALLY, no agent swarm
([[agent-swarm-discipline]]). Every change stays 0-leak + 0-harness-findings + green CI.
EXPANSION milestone (EX-1→EX-6) RELEASED — see git history / directive-archive.md.

## What CONTINUOUS means
1. Never stop for status reports the user didn't ask for. 2. Never stop for scope
caution. 3. Never stop to summarize. 4. Never stop on context pressure. 5. Never stop
because a task feels big. 6. Only stop on: explicit user halt, red CI blocking, or a
genuine scope-flip design question (ask, then continue).

## Operating loop
while queue has [ ] items: enumerate use-cases → docs/tests/code → verify (typecheck +
biome check + full suite + harness audit at 0 findings, screenshot/live-verify UI) →
commit (Conventional Commit, one per item) → dispatch reviewers → mark [x] → next.

## Forbidden phrases / behaviors
"deferred" | "v2+" | "out of scope" | "future work" | "follow-up" | "TODO" | "FIXME" |
"stub" | "placeholder" | "mock for now" | "pause point" | "next session" | "stopping
point" | "clean handoff". No Math.random/Date.now in src/sim (purity). No commit to main.
Squash-merge only. Stubs/`as any`/`it.todo` are bugs. Run `pnpm format` + `biome check`
(not just `pnpm lint`) before push — CI gates on format + import-sort.

---

## Milestone — POLISH & FEATURES (batch-20260621-polish, autonomous loop)

GOAL: continuously raise the quality of the shipped game — UI/UX polish, UX affordances,
and well-scoped feature additions — one PR per improvement, each green + 0-leak. The
queue is a LIVING discovery list: I add items as I find them (playing the game, reading
the code, screenshotting), and compress (mark [x] / remove) as they ship. Each loop cycle
picks the current highest-value [ ] item.

### Queue (living — expand on discovery, compress on completion)
- [x] **PL-1 Title wordmark divider overlap — FIXED** (commit e78db40). h1 descender bled
  into the ornamental rule (tight line-height clipped the line-box); added
  `padding-bottom:0.18em`. Verified via visual test + live screenshot.
- [x] **PL-2 Meter-change delta feedback — DONE** (commit e80d5ba). Gauges flash a +N/−N
  badge (gold-up/crit-down) on value change, money-formatted, sub-unit-0 suppressed,
  reduced-motion safe. Verified live (5 badges on a choice).

### PL-3 DIEGETIC ONBOARDING (USER REDIRECT 2026-06-21) — supersedes the upfront inputs
User: "landing page should be New Game / Load Game / Settings. Epoch-0 should be for
diegetically emerging — pick your location, then suggest a surname through dialogue +
choices from era/culture-appropriate suggestions OR enter your own via a non-disruptive
input modal that doesn't jank immersion. Bind the seed phrase to an adjective-adjective-
noun word-pool set and put those words INTO the first three choices via slots, so picking
choices diegetically picks the seed without the player realizing. Never SHOW the seed —
bury it in choices."

Re-enumeration (the upfront title-screen inputs were the collapsed use-case):
- USE 1 — Landing: New Game / Load Game / Settings ONLY. Strip the surname + seed fields.
- USE 2 — Seed authorship: the seed is COMPOSED from the player's first ~3 choices, each
  choice carrying one word from an adj/adj/noun pool (via the slot system). The composed
  phrase IS the seed. Hidden entirely.
- USE 3 — Place discovery: keep the existing emergence sensory-cue beat (already picks place
  diegetically) — but it must run on a seed that's being authored AS those first choices are
  made.
- USE 4 — Surname bestowal: after place is known, offer era/culture-appropriate surname
  SUGGESTIONS as choices + an "enter your own" modal (non-disruptive overlay, not a route
  change). Replaces the upfront surname input.

KEY ARCHITECTURAL QUESTION (answer in the spec before coding): today `dealComposition(seed)`
deals place/era/archetype UP FRONT from a seed entered on the title screen. The redirect
inverts this — the seed is authored by the first choices, and place is chosen by the
emergence cue. So the founding seam must change: New Game starts with NO seed; the first
3 emergence choices compose the seed (adj/adj/noun); place comes from the emergence-cue
choice; surname from the bestowal beat/modal. The composition is finalized only after
these beats, then the deterministic run proceeds (save = the authored seed + composition +
history, replay still bit-identical). Sub-tasks:
- [ ] **PL-3a** Spec the inverted founding flow in docs (use-cases above + the seam change +
  how replay/determinism is preserved when the seed is authored mid-Epoch-0).
- [ ] **PL-3b** Landing page: strip surname + seed inputs → New Game / Load Game / Settings.
- [ ] **PL-3c** Seed word-pool (adj/adj/noun) + slot wiring so the first 3 emergence choices
  each contribute a word; the composed phrase becomes the run seed (never displayed).
- [ ] **PL-3d** Surname bestowal beat: era/culture-appropriate suggestion choices + a
  non-disruptive "name your own" input modal overlay.
- [ ] **PL-3e** Verify: full diegetic onboarding live (no upfront inputs), determinism holds
  (same choices → same seed → same run), 0 leaks, gate green.

## Architectural notes carried forward
- Identity = PLACE × CULTURE × ERA × ARCHETYPE; names from the live family tree via
  `runTerms`; NO literal presets (the harness validator enforces 0 preset-person leaks).
- Eras: `eras/<place>/<period>/events.json`, glob-loaded; `_shared/` for place-agnostic.
- Archetypes (6): events declare `archetypes:[...]`; empty = agnostic. Branch = a
  flag-gated world-state woven into one timeline per scope (not bespoke files).
- `foundByComposition` is the single pure founding seam; `dealComposition` deals the
  diegetic birth's origin from the seed. Save = seed + composition + history; replay
  bit-identical. `buildExpandContext` is the procgen seam — wire there, don't duplicate.
- The CP-R7 harness (`src/sim/harness.ts`) + `artifacts/timeline-audit.json` are the
  acceptance gate for all breadth. Canonical architecture: `docs/STATE.md`.
