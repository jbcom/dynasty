# Continuous Work Directive — maga-money-moves

**Status:** ACTIVE
**Owner:** jbogaty

## Batch — maga-money-moves-full-build (batch-20260619-build)

Source: docs/plans/maga-money-moves.prq.md (sha256: 894bc3bfdbc5b8dcfb3ccfbaf679f3be09d1523c7b32ad85e88139579846705c)
Started: 2026-06-19
Config: stop_on_failure=false (autonomous, self-resolving) · single feature branch → squash-merge

### Phase A — Bootstrap & Profile
- [x] A1 Initialize repo as arcade-game profile project
- [x] A2 Scaffold Vite + TS + pnpm + Biome + Svelte 5
- [x] A3 Configure Vitest (node + browser mode) + Playwright e2e

### Phase B — Pure Sim Engine
- [x] B1 RNG facade (createRng/seedrandom)
- [x] B2 JSON content schemas (zod) + loader/validator
- [x] B3 GameState + meters
- [x] B4 Event eligibility + seeded weighted selection
- [x] B5 Butterfly engine (visible ledger + seeded chaos ripples)
- [x] B6 Effects + timeline + end conditions

### Phase C — Engine glue
- [x] C1 Clock facade + game loop
- [x] C2 Save/load via Capacitor Preferences

### Phase D — UI / Render / Audio
- [x] D1 Design tokens + open-props brand system
- [x] D2 Meter HUD (SVG gauges) + Motion One deltas
- [x] D3 Event Card + choice flow + sim bridge
- [x] D4 Butterfly Log + D3 force-DAG graph view
- [x] D5 Timeline (hand-rolled fallback) + Stats (uPlot) + Dossier views
- [x] D6 Render layer — caricature portrait/scene compositing
- [x] D7 Audio — Tone.js graph
- [x] D8 Screens — Title/New Game, Play (HUD+tabs+portrait+card), Legacy Report + router

### Phase E — Assets
- [x] E1 Asset sourcing + manifest (OpenMoji icons, CC0 SVG caricatures + backgrounds, photo→cartoon derivatives, scraper + cartoonify dev tools, ASSETS.md)

### Phase F — Content: all 10 eras
- [ ] F0 Era index + meters + butterfly-rules data
- [ ] F1 Era 1 — Birth & Boyhood (1946–1964)
- [ ] F2 Era 2 — Apprentice Mogul (1964–1987)
- [ ] F3 Era 3 — Boom, Bust & Brand (1988–2003)
- [ ] F4 Era 4 — Prime Time (2004–2014)
- [ ] F5 Era 5 — The Ascent (2015–2020)
- [ ] F6 Era 6 — Interregnum & Return (2021–2028)
- [ ] F7 Era 7 — Total Victory (2029–2040) [extrapolated]
- [ ] F8 Era 8 — The Atomic Horror (2041–2053) [extrapolated, startrek_inspired]
- [ ] F9 Era 9 — The Unification (2054–2079) [extrapolated, startrek_inspired]
- [ ] F10 Era 10 — Red Planet & Beyond (2080+) [extrapolated]

### Phase G — Integration, Android, Polish
- [ ] G1 Full e2e playthroughs to each end state
- [ ] G2 Capacitor Android setup + sync
- [ ] G3 Verify app RUNS — Chromium screenshot of real playthrough
- [ ] G4 Reviewer trio + green PR

## What CONTINUOUS means
1. Never stop for status reports the user didn't ask for.
2. Never stop for scope caution.
3. Never stop to summarize — git log is the summary.
4. Never stop for context pressure — task-batch + compaction survival handle it.
5. Never stop because a task feels big — pick the next atomic commit.
6. Only stop on: explicit user halt, red CI blocking, or genuine STOP_FAIL.

## Operating loop
while queue has [ ] items: implement → verify → commit → dispatch reviewers → mark [x] → next.

## Forbidden phrases
"deferred" | "v2+" | "out of scope" | "future work" | "tracked separately" | "follow-up"
"TODO" | "FIXME" | "stub" | "placeholder" | "mock for now"
