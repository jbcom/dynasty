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
- [x] **PL-3a DONE** — spec at docs/superpowers/specs/2026-06-21-diegetic-onboarding.md
  (resolved the ordering: the first 3 beats are place-AGNOSTIC consciousness fragments per
  the user's clarification, so they author the seed before a place exists; determinism +
  save format unchanged).
- [x] **PL-3b DONE** — TitleScreen stripped to New Game / Load / Settings; dead input CSS
  removed; tests updated to the no-inputs contract.
- [x] **PL-3c DONE** — src/data/seed-words.json + src/sim/seedComposer.ts (3 lanes of
  evocative place-agnostic prose, 729-seed space); composeSeed joins the picks; hidden.
- [x] **PL-3d DONE** — culture surname pools (all 6) + suggestSurnames() + OnboardingScreen
  bestowal: 3 culture-appropriate suggestions + non-disruptive "name your own line…" modal.
  Founding pre-sets emerged+named; the redundant in-game emergence-cue + naming beats were
  removed; gender beat ("The First Cry") reworded; in-game opens at gender → calling.
- [x] **PL-3e DONE** — live-verified: landing has no inputs; consciousness phase composes the
  seed; place revealed via sensory cue; surname via suggestions AND the modal (typed
  "Ironwood" carried through the founded line); in-game opens at "The First Cry" → calling;
  console clean; determinism + leak tests pass; harness audit 0 findings; 493 unit + 68
  browser green. Shipped as PR #36 (autoloop batch PL-1/PL-2/PL-3).

### Discovered next (for upcoming loop cycles — playtesting the PlayScreen)
- [x] **PL-4 DONE** (commit 53f7b2d, pushed to PR #36). Meter HUD is a CSS grid: 3 cols on
  phones (tidy 3×2), 6-across at >=34rem. No orphaned Heat gauge; reclaims vertical budget.
  Verified via MeterHud visual+browser tests + live screenshot.
- [x] **PL-5 DONE** (commit 6871795, pushed to PR #36). Tightened HUD row-gap + padding
  (HUD 202→185px, chrome above the event 39→37% on a 915px viewport). The proportionate,
  no-downside trim. NOTE for the user: a deeper reduction (collapsible HUD, hide the
  personality band) is a larger UX decision deliberately NOT taken autonomously — flag if
  wanted as a future item.
- [x] **PL ship — MERGED** — PR #36 (PL-1..PL-5) squash-merged by the user → main (release
  0.5.0, #37). LEARNING: #36 was merged before its e2e fix landed on the PR head, so main
  shipped the PL-3 onboarding flow with the OLD Playwright suite (driving the removed
  title-screen inputs) → red main CI. Process fix: when a UI FLOW changes, update e2e in
  the SAME push as the UI, and confirm the PR head includes it before merging.
- [ ] [WAIT] **PL-fix red main** — PR #38 re-applies the onboarding-aware e2e suite (all 7
  pass locally vs main's app code). Merge on green → main CI green again.

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
