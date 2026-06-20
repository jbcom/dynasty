# Feature: MAGA Money Moves — Full Build

**Created**: 2026-06-19
**Version**: 2.88
**Timeframe**: Multi-session (autonomous)
**Source spec**: `docs/superpowers/specs/2026-06-19-maga-money-moves-design.md`

## Priority: Critical

## Config

- `stop_on_failure=false` (NEVER stop — self-resolve, engage dynamic loop + scheduled wakeups through any issue)
- `auto_commit=true` — one commit per task, Conventional Commits, on a single feature branch
- `repo=jbcom/maga-money-moves`, **private / stealth**
- Determinism: no `Math.random` / `performance.now` in `src/sim/**` or `src/engine/**`
- Test layout: colocated `__tests__/`, suffix-tagged, Vitest browser mode for visuals
- Docs → Tests → Code for every task

## Overview

Satirical life-simulator of Donald Trump, birth → first Martian base / immortal
two-world patriarch. Hybrid narrative + management sim. Vite + TS + Capacitor +
Svelte 5, JSON-config-driven content, butterfly engine (visible ledger + seeded
chaos ripples), 6 meters, 10 eras. Full build: bootstrap → engine → UI → audio →
butterfly → Android → author ALL 10 eras of content → polish.

## Tasks

### Phase A — Bootstrap & Profile

- [ ] **A1 [P1]** Initialize repo as arcade-game profile project
  - Files: `CLAUDE.md`, `.agent-state/directive.md`, `.claude/gates.json`, `.gitignore`
  - Criteria: thin `CLAUDE.md` includes arcade-game + mobile-android + agent-state profiles via `@<abs-path>`; `gates.json` rewritten for colocated `__tests__/` globs (`src/sim/**/__tests__/**`, suffix patterns); directive seeded with these tasks.
  - Verify: file_exists; `gates.json` parses as JSON.

- [ ] **A2 [P1]** Scaffold Vite + TS + pnpm + Biome + Svelte 5
  - Files: `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig.json`, `biome.json`, `index.html`, `src/main.ts`, `src/App.svelte`
  - Criteria: pnpm only; deps pinned (svelte, seedrandom, tone, motion, d3-scale/shape/force, uplot, vis-timeline, open-props, zod, @capacitor/* incl. haptics/preferences/status-bar, @vitest/browser, playwright, @biomejs/biome).
  - Verify: `pnpm install` succeeds; `pnpm dev` boots; `pnpm typecheck` clean.

- [ ] **A3 [P1]** Configure Vitest (node + browser mode/Playwright provider) + Playwright e2e
  - Files: `vitest.config.ts`, `vitest.workspace.ts`, `playwright.config.ts`, `e2e/` skeleton
  - Criteria: node project for `*.unit.test.ts`; browser project (Playwright/Chromium) for `*.browser/visual/audio.test.ts`; visual-regression screenshot config; `pnpm test`, `pnpm test:browser`, `pnpm test:e2e` scripts.
  - Verify: a trivial unit + a trivial browser test both pass.

### Phase B — Pure Sim Engine (Docs→Tests→Code, no DOM/Math.random)

- [ ] **B1 [P1]** RNG facade
  - Files: `src/sim/rng.ts`, `src/sim/__tests__/rng.unit.test.ts`
  - Criteria: `createRng(seed)` wraps seedrandom; deterministic sequence.
  - Verify: same seed → identical sequence; unit tests pass.

- [ ] **B2 [P1]** JSON content schemas (zod) + loader/validator
  - Files: `src/sim/schema.ts`, `src/sim/__tests__/schema.unit.test.ts`
  - Criteria: schemas for Event, Choice, Era, Meter, ButterflyRule, Assets; malformed content rejected.
  - Verify: valid fixtures pass, malformed fixtures throw; tests pass.

- [ ] **B3 [P1]** GameState + meters
  - Files: `src/sim/state.ts`, `src/sim/meters.ts`, `__tests__/*.unit.test.ts`
  - Criteria: 6 meters (Money log-scaled, Reputation signed), clamp/apply deltas, flags, era, age, butterfly ledger, choice history.
  - Verify: meter math + clamping unit tests pass.

- [ ] **B4 [P1]** Event eligibility + seeded weighted selection
  - Files: `src/sim/events.ts`, `__tests__/events.unit.test.ts`
  - Criteria: `requires` (flags + meter comparators) filter; seeded weighted pick-next.
  - Verify: eligibility + deterministic selection tests pass.

- [ ] **B5 [P1]** Butterfly engine (B + C)
  - Files: `src/sim/butterfly.ts`, `__tests__/butterfly.unit.test.ts`
  - Criteria: named-flag chains with human-readable templates (B); seeded weighted ripples perturbing future event weights (C); cross-era rules from `butterfly-rules.json`.
  - Verify: chain templating + deterministic ripple propagation tests pass.

- [ ] **B6 [P1]** Effects + timeline + end conditions
  - Files: `src/sim/effects.ts`, `src/sim/timeline.ts`, `__tests__/*.unit.test.ts`
  - Criteria: `(GameState, seed, choiceId) → {state, ledgerEntries}` pure; era advance on pool-exhaust/age-health gate; end states (death, coup, victory).
  - Verify: deterministic replay (seed+history → identical state); end-state tests pass.

### Phase C — Engine glue

- [ ] **C1 [P1]** Clock facade + game loop
  - Files: `src/engine/clock.ts`, `src/engine/loop.ts`, `__tests__/`
  - Criteria: clock facade (no `performance.now` in sim); loop drives sim→ui bridge.
  - Verify: unit tests pass.

- [ ] **C2 [P1]** Save/load via Capacitor Preferences
  - Files: `src/engine/save.ts`, `__tests__/save.browser.test.ts`
  - Criteria: autosave each event; persists seed + choice-history; reconstructs state deterministically.
  - Verify: save→load roundtrip reconstructs identical state; browser test passes.

### Phase D — UI / Render / Audio

- [ ] **D1 [P1]** Design tokens + open-props brand system
  - Files: `src/ui/tokens.css`, `src/ui/theme.ts`
  - Criteria: gold/red/navy palette as CSS custom props; brand-hex ban-gate honored.
  - Verify: build clean; tokens referenced (no raw banned hex in components).

- [ ] **D2 [P1]** Meter HUD (hand-rolled SVG/CSS gauges) + Motion One deltas
  - Files: `src/ui/MeterHud.svelte`, `__tests__/MeterHud.visual.test.ts`
  - Criteria: 6 gauges, animated deltas, crit thresholds, OpenMoji icons.
  - Verify: visual screenshot baseline; browser test passes.

- [ ] **D3 [P1]** Event Card + choice flow + sim bridge
  - Files: `src/ui/EventCard.svelte`, `src/ui/bridge.ts`, `__tests__/EventCard.browser.test.ts`
  - Criteria: scene + research_note + extrapolated/trek badges + choices; UI never touches sim internals except via bridge; haptics on big swings.
  - Verify: choosing applies effects via sim; browser test passes.

- [ ] **D4 [P2]** Butterfly Log + D3 force-DAG graph view
  - Files: `src/ui/ButterflyLog.svelte`, `src/ui/ButterflyGraph.svelte`, `__tests__/*.visual.test.ts`
  - Criteria: ledger list + force-DAG of cause→effect using d3-force/shape/scale.
  - Verify: visual baseline; browser test passes.

- [ ] **D5 [P2]** Timeline (vis-timeline) + Stats (uPlot) + Dossier views
  - Files: `src/ui/TimelineView.svelte`, `src/ui/StatsView.svelte`, `src/ui/Dossier.svelte`, `__tests__/`
  - Criteria: scrollable era/event timeline; net-worth + meter-trend sparklines; current meters+flags. Hand-rolled timeline fallback if vis-timeline too heavy.
  - Verify: visual baselines; browser tests pass.

- [ ] **D6 [P2]** Render layer — caricature portrait/scene compositing
  - Files: `src/render/*.ts`, `__tests__/*.visual.test.ts`
  - Criteria: layered caricature portraits per era; scene backgrounds.
  - Verify: visual baseline passes.

- [ ] **D7 [P2]** Audio — Tone.js graph (era beds, stingers, blips)
  - Files: `src/audio/*.ts`, `__tests__/audio.audio.test.ts`
  - Criteria: gated audio layer; per-era ambient track, choice stinger, meter blip.
  - Verify: WebAudio graph wiring test passes (browser mode).

- [ ] **D8 [P2]** Screens — Title/New Game (seed), Era intro, end Legacy Report
  - Files: `src/ui/screens/*.svelte`, `__tests__/`
  - Criteria: seed entry/random; era intro card w/ palette+track; legacy report shows full butterfly chain.
  - Verify: browser tests pass.

### Phase E — Assets

- [ ] **E1 [P2]** Asset sourcing + manifest
  - Files: `src/data/assets.json`, `ASSETS.md`, `public/assets/**`
  - Criteria: OpenMoji (CC-BY) icons; CC0 backgrounds (Wikimedia PD/Pexels/Unsplash); CC0 caricature sprites where available else generated; EVERY asset logged with path/source/license/attribution.
  - Verify: every referenced asset exists in manifest with a license field; schema-valid.

### Phase F — Content: ALL 10 Eras (each a task, schema-valid, research-noted)

- [ ] **F0 [P1]** Era index + meters + butterfly-rules data
  - Files: `src/data/eras/index.json`, `src/data/meters.json`, `src/data/butterfly-rules.json`
  - Criteria: 10 eras ordered with spans/titles/flags/audio/palette; meters defined; cross-era butterfly rules.
  - Verify: validates against schema; tests pass.

- [ ] **F1 [P1]** Era 1 — Birth & Boyhood (1946–1964), 7–12 events
- [ ] **F2 [P1]** Era 2 — Apprentice Mogul (1964–1987)
- [ ] **F3 [P1]** Era 3 — Boom, Bust & Brand (1988–2003)
- [ ] **F4 [P1]** Era 4 — Prime Time (2004–2014)
- [ ] **F5 [P1]** Era 5 — The Ascent (2015–2020)
- [ ] **F6 [P1]** Era 6 — Interregnum & Return (2021–2028)
- [ ] **F7 [P1]** Era 7 — Total Victory (2029–2040) *[extrapolated]*
- [ ] **F8 [P1]** Era 8 — The Atomic Horror (2041–2053) *[extrapolated, startrek_inspired]*
- [ ] **F9 [P1]** Era 9 — The Unification (2054–2079) *[extrapolated, startrek_inspired]*
- [ ] **F10 [P1]** Era 10 — Red Planet & Beyond (2080+) *[extrapolated]*
  - Per-era Criteria (F1–F10): 7–12 events; each event has scene + `research_note` + correct `extrapolated`/`startrek_inspired` flags + tags + portrait + `requires` + weighted choices with effects/setFlags/ripples/outcome; pivotal real events researched (use deep-research where helpful); extrapolated eras flagged; cause/effect remedies present.
  - Per-era Verify: era file validates against schema; appears in index; deterministic playthrough can traverse it; unit tests pass.

### Phase G — Integration, Android, Polish

- [ ] **G1 [P1]** Full e2e playthroughs to each end state
  - Files: `e2e/playthrough.spec.ts`
  - Criteria: Playwright drives a seeded run on mobile viewport to death, coup, and victory ends; butterfly chain visible at end.
  - Verify: `pnpm test:e2e` passes.

- [ ] **G2 [P1]** Capacitor Android setup + sync
  - Files: `capacitor.config.ts`, `android/**`
  - Criteria: status-bar/safe-area edge-to-edge; haptics + preferences wired.
  - Verify: `pnpm cap:sync` shows "Sync finished"; `pnpm build` clean.

- [ ] **G3 [P1]** Verify app RUNS — Chromium screenshot of real playthrough
  - Criteria: launch dev server, drive a real playthrough via chrome-devtools-mcp, screenshot, READ the screenshot, compare to design intent, fix drift.
  - Verify: screenshot artifact captured + reviewed; visuals match spec.

- [ ] **G4 [P2]** Reviewer trio + green PR
  - Criteria: code/security/simplify reviewers on the diff; findings folded forward; open ONE private PR; CI green; threads resolved; squash-merge.
  - Verify: PR merged; CI green.

## Dependencies

- B* depends on A2/A3; B2 before B4/B5/B6.
- C* depends on B*. D* depends on C2 (save) + B6 (sim) + D1 (tokens).
- F0 before F1–F10; F* depend on B2 (schema) + B4/B5 (engine consumes them).
- E1 before D2/D6 (icons/art) and F* (portraits referenced).
- G1 depends on D* + F*. G2 depends on A2. G3 depends on G1/G2. G4 last.

## Acceptance Criteria (global)

- Every task: Docs→Tests→Code; tests pass; sim purity preserved; one Conventional commit.
- All 10 era JSONs validate; deterministic replay holds; app verified running (G3).
- Repo stays **private**; single feature branch → squash-merge.

## Autonomy directive

NEVER stop on failure. On any blocker that is not a true blocker (credential entry,
spend authorization, physical hardware), self-resolve: dispatch `stuck-loop-debugger`
for stuck bugs, fold review findings forward, retry with fixes. Use the **dynamic
loop** (`/loop`, self-paced via ScheduleWakeup) and scheduled wakeups to stay on
task across context boundaries until the entire batch is `[x]`.

## Risks

- vis-timeline weight on mobile → hand-rolled fallback (D5).
- Asset licensing → strict manifest gate (E1); reject anything not CC0/CC-BY/PD.
- Likeness sensitivity → caricature only, never photographic.
- Content volume (10 eras) → each era is its own task; research-note discipline.

## Technical Notes

Stack & architecture per the design spec §2–§3. Test type by filename suffix;
Vitest browser mode (Playwright provider) for all visual/component/audio tests.
