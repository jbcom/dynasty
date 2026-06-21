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
ALSO OWN (user, 2026-06-21): merge the release-please PRs, and keep ALL workflows green —
not just feature-PR CI, but the post-merge CD/Release on main too. PR #47 fixed a
long-standing CD APK break (proguard-android.txt → -optimize.txt for Gradle 9.6/R8). Release
+ dependabot PRs auto-merge via `.github/workflows/automerge.yml` (approve + --auto --squash).
PRIVATE REPO (user): keep it private. CodeQL = GitHub default-setup
(`dynamic/github-code-scanning/codeql`), NOT a repo workflow file — user wants it DELETED
(low value on a private repo). [BLOCKER — needs the user]: disable it in repo Settings →
Code security → Code scanning → CodeQL default setup; the `gh api code-scanning/default-setup`
call returns 403, so the agent can't toggle it via tools.
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

## Milestone — ONBOARDING REWORK → AUTHORED EPOCH-0 (batch-20260621-epoch0)

Spec: docs/superpowers/specs/2026-06-21-onboarding-rework.md. SUPERSEDES the PL-3
consciousness-phase onboarding (the user rejected it as confusing).

GOAL (user): Epoch-0 is the FIRST STAGE OF THE STORY, not a control panel — a fully-written
birth → man/womanhood → first turn of the calling → finding a partner → branch-fork, with
the player choosing EVERYTHING (location, gender, family + given name, calling). Each choice
diegetically SETS A CAUSAL ANCHOR the butterfly/world/pool engines read to generate this
line's unique storyline. The seed is a HIDDEN random draw (world only). Geography (place) ≠
chronology (era/date): the doctor draws a seed-random month/day, narrates the full date,
which frames the era. Calling IS the archetype (diegetic title). EACH place × era needs its
OWN fully-written Epoch-0. Polish sweep (PL-1..PL-13) shipped — see git history.

### Queue
- [x] **OB-1 spec** (34d7c41/a837c41/533ada1) — Epoch-0-as-story scope, geography≠chronology,
  calling=archetype, causal-anchor purpose.
- [x] **OB-2 seam + helpers** (3f3bf9b) — suggestGivenNames; ARCHETYPE_CALLINGS
  (archetype→diegetic title+summons); drawBirthDate/formatBirthDate (seed-drawn {month,day},
  year from era); 6 unit tests. (`birthDate` field on composition + the Epoch-0 flag chain
  land with OB-3/OB-4 where they're wired into the founding seam + authored beats.)
- [x] **OB-3 DONE** (commit 08ded25) — consciousness phase removed (seedComposer + seed-words
  deleted); New Game → OnboardingScreen does the LOCATION pick (discernible place-cue cards:
  "fish and salt air…" → Ireland) → family-name bestowal → founds. Hidden random seed
  (crypto); chosen place threads through dealComposition. e2e rewired; live-verified (Ireland
  cue → Gallagher/Brennan/MacCarthy → game). NOTE: era/gender/archetype still seed-dealt as
  starting defaults — OB-4's authored beats convert these to player choices in-game; and the
  founding `emerged`/`named` pre-set still needs revisiting in OB-4 so the birth/naming beats
  actually play (currently they're skipped, holdover from PL-3).
- [x] **OB-4 VERTICAL SLICE DONE** (commits afc1e9c + 31a8c7d, branch feat/ob4-ireland-epoch0)
  — Ireland/origins Epoch-0 authored end-to-end: "Born to the Rain" (birth + the doctor's
  seed-drawn date via {birth_date}) → first cry (gender) → "A Name at the Font" (given-naming)
  → "What the Parish Teaches" (class/station emerges from observing tenant-and-landlord
  Ireland) → "The Hedge and the Master" (schooling + an inspiring/embittered teacher) → "What
  You Are For" (the calling CRYSTALLIZES into the archetype via the new setsArchetype choice
  field) → partner → heirs. Chronology seam (birthDate) wired through composition/state/terms;
  founding emerged/named pre-set dropped so the beats play; place-agnostic ev_birth_generic
  fallback for non-custom origins (excluded for Ireland). 0 leaks; 510 unit + 73 browser + 7
  e2e green; textQuality corpus-clean. NOTE: starting meters ($1K/low) already read as a poor
  tenant family; a deeper "family money vs your money" mechanic is a future refinement, not
  blocking. A richer partner beat + an explicit branch-fork beat can be added in OB-5 polish.
- [ ] [WAIT] **OB-5 REPLICATE (batch 1 in PR #53)** — full Epoch-0 per place × era. Batch 1
  (bavaria 617dd15 + south_africa dee952d, 0-leak + green) is in PR #53 (CI running). REMAINING
  batches SEQUENCED after #53 merges (one PR in flight): west_coast, east_coast, canada,
  american_midwest, american_south, baghdad/caliphate.
  MAINTENANCE SMELL to fix soon: the generic ev_birth_generic + ev_birth_calling carry a
  growing per-place `notFlags:[place:X]` exclusion list — replace with a cleaner "exclude if
  the place has its own birth beat" mechanism before the list gets long.
- [ ] [WAIT] **OB-6 verify** — e2e + component + textQuality + harness audit 0 findings;
  live-verify each origin; gate green; remove dead PL-3 paths.

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
