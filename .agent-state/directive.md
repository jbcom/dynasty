# Continuous Work Directive — Dynasty (maga-money-moves)

**Status:** ACTIVE
**Owner:** jbogaty
**Mandate (2026-06-21):** EXPANSION. The game itself is DONE (found-your-own / diegetic
birth / orthogonal identity / 0-leak bespoke→slot dissolution shipped via PR #31,
archived). This branch is **pure breadth**: build the GenAI-discussed pieces to fill out
the place × era × archetype × branch space so a single founded line can run a rich
**1000-YEAR dynasty** with as many permutations as possible across the ages. Work
SERIALLY, own everything, NO agent swarm ([[agent-swarm-discipline]]). The CP-R7 dev
harness (trace/dump/validate + the in-app overlay) is the substrate + the acceptance gate:
every expansion stays at **0 leaks** and clean generation-to-generation progression.
Completed history → `directive-archive.md`.

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

## Milestone — 1000-YEAR DYNASTY BREADTH (batch-20260621-expansion)

GOAL (user): a dev-mode 1000-year dynasty with maximum permutations — tons of different
possibilities across the ages, every place×era×archetype×branch richly populated, all
still 0-leak and consistent under the harness. The substrate (composition, places,
archetypes, harness, dev overlay) exists; this milestone is content + the GenAI toolkit
that generates it at breadth.

### Queue (to enumerate per use-case before building — this is the discovery seed, not a fixed plan)
- [ ] [WAIT] PR #32 (directive release + EX-1 gap matrix) CI green → squash-merge → sync main. EX-2+ authoring opens on a fresh branch off the merged main (one-branch-per-unit; the expansion directive must be live on main first).
- [x] **EX-1 DONE: place×era coverage gap matrix → docs/EX-1-coverage-gap.md.** Per-era density is healthy (18–51 events/era) and — because most events are archetype-AGNOSTIC — every archetype already sees nearly the full pool, so the primary gap is NOT archetype reach. The real gap is PLACE: all 8 non-baghdad places map eraContentDir=new-york (they share the new-york arc, coherent + 0-leak but not place-distinct). Priority: EX-2 fork the 8 places' own period content → EX-3 athletic/entertainment locked depth → EX-4 GenAI breadth → EX-5 millennium run. Every cell stays at 0 harness findings.
- [x] **EX-2 DONE (origins coverage): per-place life-arc breadth across all 8 places.** Built the place gate (events with `place:<id>` fire only for a matching founding; absent = agnostic) + the KEY multi-file-per-era merge fix (buildContent appends, not overwrites — the place-arc model needs it). Authored place-SPECIFIC `origins` arcs for all 8 shared-arc places: ireland (land/parish/letter), bavaria (conscription/brewing/German-name), south_africa (frontier/war-on-veld/restlessness), west_coast (gold-coast/reinvention), east_coast (old-money-wall/machine), canada (northern-reach/two-nations), american_midwest (grain-rail/populist-tide), american_south (new-south/caste). Verified: each place routes 2–3 own events, ZERO foreign-place leakage; harness 0 findings; validator refined (Friedrich = legit Bavarian given name). Added 3 tropes (tenant-and-landlord/faith-and-community/letter-from-away). NOTE: era-content DIR names (new-york/_shared/baghdad) ≠ place ids. (Later eras stay shared/place-agnostic — per-place later-era breadth is EX-4 GenAI territory.)
- [x] **EX-3 DONE: athletic depth filled (entertainment already healthy).** Athletic was the true greenfield (2 tagged events); authored a distinct athletic arc spanning boyhood→primetime: schoolyard prodigy → turning pro (player-vs-owner fork) → the franchise gambit (athletic+economic) → athlete-becomes-brand (athletic→entertainment pivot) → raising the next champions (sporting-dynasty succession). Athletic now has 7 tagged events, 5 athletic-distinct (hidden from other archetypes). Entertainment was already 15 tagged (8 locked) from the CP-R-ARCH dissolution — at parity. Files live in new-york period dirs as place-agnostic, archetype-locked. Harness 0 findings; 474 unit + 67 browser green.
- [ ] **EX-4 GenAI breadth toolkit.** Wire the discussed generation pieces (Gemini/dev-bulk
  retag + extrapolate over the trope catalog) to populate the space at scale, validated
  through the harness (0 leaks, branch-density, chronology) before anything lands.
- [ ] **EX-5 The millennium run.** A founded line should be able to run ~1000 years across
  the full era chain with rich, non-repeating content each generation; verify via the dev
  overlay fast-forward + a harness long-run audit.
- [ ] **EX-6 DoD.** Full gate + harness audit at 0 findings over a wide permutation sweep;
  live-verify a long multi-generational run; PR; reviewer trio; squash-merge; Status RELEASED.

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
