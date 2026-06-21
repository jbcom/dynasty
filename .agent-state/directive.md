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
well-scoped features — one PR per improvement, each green + 0-leak + harness-clean. The
queue is a LIVING discovery list: add items as found (playtesting, reading code,
screenshots), compress as they ship. Each cycle picks the highest-value [ ] item.

### Shipped (history in git / PRs)
- PR #36 (release 0.5.0): PL-1 title wordmark descender; PL-2 meter delta badges; PL-3 fully
  diegetic onboarding (no upfront inputs → consciousness-phase seed authoring + culture
  surname bestowal w/ modal); PL-4 even 3×2 meter HUD grid; PL-5 HUD vertical-budget trim.
- PR #38: restored the onboarding-aware e2e suite (main had gone red — #36 merged before its
  e2e fix landed on the head). LEARNING: when a UI FLOW changes, update e2e in the SAME push
  and confirm the PR head includes it before merging.
- PR #39: PL-6 subtle choice consequence hints (meter-icon dots, role=img a11y).
- OPEN-FOR-USER (not taken autonomously): a deeper HUD reduction (collapsible HUD / hide the
  personality band) — a larger UX decision; flag if wanted.

### Queue (next cycles)
- [x] **PL-7 MERGED** (#41) — Timeline shows the line's own era chain (no pre-founding eras).
- [x] **PL-8 MERGED** (#42) — Lineage roles: Consort badge + ✝ deceased mark (role=img).
- [x] **PL-9 MERGED** (#43) — legacy report celebrates the DYNASTY ("The House of X endured
  N years across G generations — M souls"); reduce-based stats (no Math.max-spread overflow).
- [x] **PL-10 MERGED** (#44) — Dossier shows a character record, not a flag dump
  (src/ui/flagLabel.ts hides structural/lifecycle/preset machinery + humanizes the rest).
- [x] **PL-11 DONE** (commit 3d1dd2b, branch feat/pl11-views) — News tab shows a quiet-world
  empty state instead of a blank panel (matches Lineage/Dossier empty states). Test updated.
- [ ] [WAIT] **PL-11 ship** — open + merge the PL-11 PR on green.
- [ ] [WAIT] **PL-12** — SEQUENCED after PL-11 merges (one PR in flight). Remaining un-
  inspected views: Stats (Trajectory chart), Markets. Playtest, pick the gap, ship it. If
  no meaningful gaps remain, the polish sweep of the views is complete — pivot to a feature
  add or audit the content (event text quality) for the next cycle.

PROCESS LESSON (encoded): keep a single polish PR in flight, merge it, sync main, branch the
next from fresh main. Avoids the directive-divergence conflicts seen across cycles 3–6.

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
