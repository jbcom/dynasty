# Continuous Work Directive — maga-money-moves

**Status:** ACTIVE
**Owner:** jbogaty

## Batch — causality-endings-personality (batch-20260620-causality)

Source: docs/plans/causality-endings-personality.prq.md (sha256: 9eaf443ac3929c8faab9e78c05b2a38036d96ed711f2356c6d7335930942e812)
Started: 2026-06-20
Config: stop_on_failure=false (autonomous, self-resolving) · single feature branch → squash-merge

### Phase H — Research & Causality Model
- [x] H1 Web-research timeline; index pivotal events w/ dated cause→effect (Wikipedia bio + business career indexed; key endings/ideology anchors pulled)
- [x] H2 Causality graph model (delayed/compounding consequences w/ prereqs) + butterfly promoted to a subpackage (ripples/ledger/consequences) + ledger DEDUP fix (no more duplicate chains under different dates)
- [x] H3 Personality vector schema + sim (ideology + grandiosity; outward vs inward) — + time-monotonicity fix (no backward years) + timeline self-reveal (no future spoilers)

### Phase I — Endings
- [ ] I1 Data-driven ending system (triggers over meters+personality+flags+era)
- [ ] I2 Author ending set (early/late × good/bad + named: jail, bankruptcy, assassination, coup, communist-utopia, megalomaniac-king, Martian-patriarch, obscurity)
- [ ] I3 Wire ending triggers across all 10 eras
- [ ] I4 SETI / deep-space tech achievement track (science+SETI+telescope flags)
- [ ] I5 Two SECRET First-Contact endings (Benevolent/warp APEX vs Malevolent/hostile), forked by planet moral state

### Phase J — Causal Content Pass (per era)
- [ ] J1 Era 1 causal+personality+ending pass
- [ ] J2 Era 2 pass
- [ ] J3 Era 3 pass
- [ ] J4 Era 4 pass
- [ ] J5 Era 5 pass
- [ ] J6 Era 6 pass
- [ ] J7 Era 7 pass
- [ ] J8 Era 8 pass
- [ ] J9 Era 9 pass (First-Contact-2063 hooks)
- [ ] J10 Era 10 pass

### Phase K — Personality & Endings UI
- [ ] K1 HUD-as-language (tyranny↔utopia drift, visual + diegetic, outward radiation)
- [ ] K2 Ending-aware Legacy Report + endings-discovered tracker (secrets locked)
- [ ] K3 First-Contact apex-ending presentation (lightspeed → the stars)

### Phase L — Verify
- [ ] L1 Determinism + schema tests; seeded playthroughs reach a spread of endings; live screenshots
- [ ] L2 Reviewer trio + green PR + squash-merge

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
- [x] F0 Era index + meters + butterfly-rules data
- [x] F1 Era 1 — Birth & Boyhood (1946–1964)
- [x] F2 Era 2 — Apprentice Mogul (1964–1987)
- [x] F3 Era 3 — Boom, Bust & Brand (1988–2003)
- [x] F4 Era 4 — Prime Time (2004–2014)
- [x] F5 Era 5 — The Ascent (2015–2020)
- [x] F6 Era 6 — Interregnum & Return (2021–2028)
- [x] F7 Era 7 — Total Victory (2029–2040) [extrapolated]
- [x] F8 Era 8 — The Atomic Horror (2041–2053) [extrapolated, startrek_inspired]
- [x] F9 Era 9 — The Unification (2054–2079) [extrapolated, startrek_inspired]
- [x] F10 Era 10 — Red Planet & Beyond (2080+) [extrapolated]

### Phase G — Integration, Android, Polish
- [x] G1 Full e2e playthroughs to each end state
- [x] G2 Capacitor Android setup + sync
- [x] G3 Verify app RUNS — Chromium screenshot of real playthrough
- [x] G4 Reviewer trio + green PR (PR #1 squash-merged: trio folded, CI green, CodeRabbit pass, all 10 bot threads resolved)

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
