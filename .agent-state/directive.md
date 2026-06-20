# Continuous Work Directive — maga-money-moves

**Status:** ACTIVE
**Owner:** jbogaty

## Batch — causality-endings-personality (batch-20260620-causality)

Source: docs/plans/causality-endings-personality.prq.md (sha256: 9eaf443ac3929c8faab9e78c05b2a38036d96ed711f2356c6d7335930942e812)
Started: 2026-06-20

**SCOPE MANDATE (user, 2026-06-20):** This is NOT a small fan-out. The game must
support **1000+ distinct permutations** and a real playthrough must NOT be
clickable-through in ~5 minutes. That means: deep per-era event pools (many more
events, higher budgets), heavily requires-gated branching so paths diverge, more
choices per event, dozens of endings, and rich consequence chains. Build systems
to support that scale, then author content MASSIVELY (parallel agents per era,
multiple passes). Depth + divergence are the goal, not coverage checkboxes.

### Phase M — Scale content for depth (1000+ permutations)
- [x] M1 Raise era event budgets + author deep event pools (20-40 events/era), heavily flag/meter/personality-gated for divergent paths
- [x] M2 Many more choices per event (3-5) with distinct downstream gating
- [ ] M3 Branch-density pass: ensure no era is a straight line; verify path-divergence metric
- [x] M4 WORLD/regional/local per-year events woven into all eras (world-event tag)

### Phase N — ONE reality + medium-native HUD (user, 2026-06-20)
- [x] N1 ONE reality: strip meta/franchise keywords from player-facing text (Trek/Vulcan/Cochrane/Phoenix); rename benevolent first-contact species to an original in-world name; startrekInspired flag stays private provenance
- [x] N2 Immersion: removed Extrapolated badge + research-note panel (facts woven into scene prose)
- [ ] N3 Medium-native HUD: Capacitor Device form-factor (phone/tablet/foldable) → diegetic surfaces (newspapers, TV) not a constant button set
- [x] N4 engine: era entryRequires gate (advanceTimeline ends the run if next era's gate fails) — implements the science ladder
**SCIENCE LADDER (user, 2026-06-20):**
  - NO science at all → game ends on EARTH (≤Era 9) with a utopian/religious OR deistic god-king ending. No Mars.
  - PARTIAL science (Mars program) → reach MARS (Era 10) → good/bad Martian ending.
  - FULL science (back_science + extrasolar_flight from Mars) → Era 11 First Contact → Era 12 Interstellar FTL.
  Personality (utopian↔tyrannical) forks the FLAVOR at every tier.
- [x] N4a Index: add era 11 (firstcontact) + 12 (interstellar); entryRequires gates (mars: mars_program; 11: back_science+extrasolar_flight; 12: warp_gift)
- [ ] N4b Earth-terminal endings (utopian-religious, deistic god-king) when science not embraced; ensure Mars-terminal good/bad endings
- [ ] N5 EVERY era must be able to END the game, good OR bad, with a logical extrapolated reason it wouldn't continue — INCLUDING childhood (fatal accident, institutionalization, vanishing into obscurity). Author per-era early-out endings (early-good + early-bad) for all 12 eras so the arc is branchy/lethal at every stage.
      EXEMPLAR (the thesis of the cause-and-effect game): the "Quiet Succession" ending — if early/mid choices keep him CONTENT and unambitious, he settles into life as a comfortable old CEO of the inherited rental business: wealthy but not insanely so, still married to his first wife, eventually handing the firm to his son (mirroring Fred→Donald). The story logically just ends — no rise, no drama engine. Early/mid-good ending gated on low grandiosity + content flags + still-married + not-overreached.
- [ ] N6 The PREMISE itself is contingent: the inherited business wasn't guaranteed. World-event branches in boyhood/mogul where the family fortune never passes down — e.g. if 1950s-70s civil-rights/housing-discrimination enforcement had gone differently and Fred Trump had been INDICTED (the rentals built on FHA + discriminatory practices; the real 1973 DOJ suit), Donald inherits nothing → no seed capital → no Manhattan, no empire → an obscurity/working-life ending. Make "no inheritance" a reachable branch that forecloses the whole rise.
- [x] N4c Author Era 11 (First Contact) + Era 12 (Interstellar FTL); set extrasolar_flight in Mars era
- [x] N4d Re-point secret endings: contact resolves Era 11; warp-apex + spread endings Era 12
- [x] N4e Era 12 branches off the Era 11 contact outcome — multiple far-futures:
      (a) WITH ALLIES: cooperative interstellar expansion (benevolent contact);
      (b) WITH SLAVES: humanity-as-empire, expansion by domination (we conquered them);
      (c) IN REBELLION: fighting back against alien overlords (malevolent contact subjugated us);
      (d) PUPPET: Trump as quisling administrator for worse tyrannical aliens (Half-Life-2/Combine-style) on a subjugated Earth.
      Each its own ending(s), gated by Era-11 outcome flags + personality.
- [x] N4f POST-HISTORY MOTIVE DOCTRINE: once real history ends, causality = hard-SF
      logistics + power dynamics, not events. extrasolar_flight is the RESULT of
      mastering the solar system: settle Jupiter's moons, the Belt, Venus, Mercury
      (rotating equatorial bases) → accumulate ORGANICS + VOLATILES → build deep-space
      ship foundries → extrasolar_flight. The tension/motivation in eras 10-12:
        • Solar-system mastery vs Mars stagnation (gather star-ship resources or stall).
        • RIVALRY WITH MUSK, the other immortal — a centuries-long power struggle.
        • Tyranny-of-distance: light-lag/relativistic separation makes TOTAL RULE
          physically impossible — does the immortal autocrat even want to expand if he
          can't control it? Expansion vs control is the core late-game dilemma.
      Redplanet (Era 10) gets a resource/expansion sub-loop; extrasolar_flight gated on it.
Config: stop_on_failure=false (autonomous, self-resolving) · single feature branch → squash-merge

### Phase H — Research & Causality Model
- [x] H1 Web-research timeline; index pivotal events w/ dated cause→effect (Wikipedia bio + business career indexed; key endings/ideology anchors pulled)
- [x] H2 Causality graph model (delayed/compounding consequences w/ prereqs) + butterfly promoted to a subpackage (ripples/ledger/consequences) + ledger DEDUP fix (no more duplicate chains under different dates)
- [x] H3 Personality vector schema + sim (ideology + grandiosity; outward vs inward) — + time-monotonicity fix (no backward years) + timeline self-reveal (no future spoilers)

### Phase I — Endings
- [x] I1 Data-driven ending system (triggers over meters+personality+flags+era)
- [x] I2 Author ending set (early/late × good/bad + named: jail, bankruptcy, assassination, coup, communist-utopia, megalomaniac-king, Martian-patriarch, obscurity)
- [x] I3 Wire ending triggers across all 10 eras
- [x] I4 SETI / deep-space tech achievement track (science+SETI+telescope flags)
- [x] I5 Two SECRET First-Contact endings (Benevolent/warp APEX vs Malevolent/hostile), forked by planet moral state

### Phase J — Causal Content Pass (per era)
- [x] J1 Era 1 causal+personality+ending pass
- [x] J2 Era 2 pass
- [x] J3 Era 3 pass
- [x] J4 Era 4 pass
- [x] J5 Era 5 pass
- [x] J6 Era 6 pass
- [x] J7 Era 7 pass
- [x] J8 Era 8 pass
- [x] J9 Era 9 pass (First-Contact-2063 hooks)
- [x] J10 Era 10 pass

### Phase K — Personality & Endings UI
- [x] K1 HUD-as-language (tyranny↔utopia drift, visual + diegetic, outward radiation)
- [x] K2 Ending-aware Legacy Report + endings-discovered tracker (secrets locked)
- [x] K3 First-Contact apex-ending presentation (lightspeed → the stars)

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
