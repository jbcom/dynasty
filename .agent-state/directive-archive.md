# Directive Archive — maga-money-moves (Dynasty)

Completed work, moved out of the active directive to keep it lean (user request,
2026-06-20). This is the audit trail of shipped units; the active queue lives in
`directive.md`. Newest batch first.

---

## Batch — FOUND YOUR OWN DYNASTY (batch-20260620-found-your-own-dynasty) — RELEASED (PR #28, 2026-06-21)

The complete found-your-own-dynasty game shipped (squash-merge a72e8e3). FD-1..FD-15
all done: archetype identity (literal preset families dissolved into trope
influences + the economic/political/technological/religious axis), unified event
pool + no-leak, procedural pool (pure seeded expander + lazy materialization),
onomastics, 8 start-moments + a deep-history Abbasid-Baghdad caliphate era, world
stacks, the live family tree with seeded birth/Gompertz-mortality/primogeniture-
succession (the eternal-dynasty loop), Gemini dev-bulk (101 events), settings +
secure Gemini-key storage + live-extrapolation toggle, and the lineage view.
Reviewer trio folded (kinFor dual-lineage + posthumous-heir bugs fixed; security
clean; isMemberAlive dedup). Follow-up PR #30: per-origin onomastics (Abbasid
caliphate uses Arabic naming, not Scots-Irish) + a culture-pinning regression test.
All CI green, live-verified end-to-end. Per-FD detail below.

### FOUND-YOUR-OWN shipped items (detail)

The pivot from "pick 1 of 4 fixed houses" → "FOUND YOUR OWN line" at a historical
hinge (name + when + where). The 4 composite archetypes survive as quick-start
presets. Design: docs/superpowers/specs/2026-06-20-found-your-own-dynasty.md.

- **FD-0** DONE: researched the religious spine (Graham) + composite-archetype model; wrote the full found-your-own spec.
- **FD-1** DONE (1e7d568): FamilyTreeSchema + 4 preset trees (Trump/Kennedy/Musk/Graham) + cross-ref validation; 7 tests.
- **FD-2.1** DONE (PR #27): EventSchema historicity (real|extrapolated|personal) + place; historicityOf() reconciles legacy extrapolated.
- **FD-2.2** DONE (38010c1): projectWorldEvents converts 1169 world-timeline entries → unified reactable GameEvents; no-leak dynasty:<id> tags.
- **FD-2.3** DONE: eligibleEvents weaves protagonist beats + windowed/capped/clock-neutral world-events; no-leak gate.
- **FD-2.4** DONE (a504ee3, code layer): ripped out role-flip code (roles.ts, isRoleFlipped, roleFlipped). Data layer folded into FD-3.3.
- **FD-3.1** DONE (d564a64): canonical 20-trope catalog (src/data/tropes.json) + schema + cross-ref gate + `pnpm retag-tropes` Gemini dev-job; 6 tests.
- **FD-3.2** DONE (08796da): retag applied 272 trope:<id> tags across all 13 era pools; all catalog-valid.
- **FD-3.3** DONE (4d5e0fb non-content; f2f2696 content): removed 8 ev_flip_* events + all swap flags + swap endings; no-leak invariant enforced. FD-3 COMPLETE.
- **FD-4.1** DONE (e646ec0): purpose-built pure seeded expander (DECISION §1d.1: not tracery). expandTemplate → validated GameEvent; 8 tests.
- **FD-4.2** DONE: lazy bounded materialization; content.templates + buildExpandContext + materializeProcedural; eligibleEvents rng-gated proc fill; 7 tests.
- **FD-5** DONE (da866ce): onomastics.json (5 cultures) + pure resolver (pickGivenName/nameChild/applySuffix); 10 tests.
- **FD-6.1** DONE: start-moments.json (7 modern + 1 deep-history Abbasid Baghdad); StartMomentSchema + cross-ref gates; caliphate deep-history era (12 events); initState resolves startEra by id; 8 tests.

---

## Batch — DYNASTY EVERYTHING (batch-20260620-dynasty-everything) — RELEASED

One branch; all former [WAIT-USER] epics activated. Sequenced koota-substrate-first.

- **DE-1 (a/b/c)** DONE (PR #17): Koota query-substrate migration — eligibleEvents/effectiveWeight + remaining read surfaces as declarative queries over projectWorld; withWorld() leak-guard; parity tests.
- **DE-2 (a/b/c)** DONE (PR #18): moral-axis wiring — 19 per-branch-per-pole endings; PersonalityDial pole badge; pole-coverage invariant guard.
- **DE-3 (a/b)** DONE (PR #C): balance (dominant-strategy guard) + branch-depth-floor no-shallowness guard.
- **DE-4 (de-ui-d, 4a)** DONE: Era-0 sibling-count/birth-order lever (ev_the_children) + birth-order given-name resolution (firstborn → patriarch name).
- **DE-5 (a–d)** DONE (PR #21): DISPLAY RENAME → "Dynasty"; Musk + Kennedy playable Era-0 sagas; dynasty-select carousel.
- **DE-UI (a–d)** DONE (PR #19): self-hosted Playfair/EB-Garamond luxury fonts; gilded title; SVG meter/UI icons; real-2D-asset icon system.
- **DE-6 (a/b/c)** DONE (PR #22): ah6-sweep consistency harness; de6b-persona-sweep (5 personas × 3 dynasties × 6 seeds = 90 deterministic runs); FINAL DoD live-verified; directive → RELEASED.
- **nb-fix** DONE (PR #24): Epoch-0 prologue-skip fixed; cartoon portraits removed.

---

## Batch — dynasty-koota-deepfuture (batch-20260620-134116) — RELEASED

- **nb-001** Koota read-model extended (market entities + declarative queries + withWorld leak fix).
- **nb-002** Deep-future arcs for nazi/media/westcoast/megachurch (all 7 branches reach the stars).
- **nb-003** Full 3-pole coverage + no-shallowness audit (104–177 events per branch).
- **nb-004** Persona playtest sweep (7 personas) — found + fixed 5 real bugs.
- **nb-006 / nb-006c** Balance + content polish from persona findings (marketOps, heat decay, historical date nits).
- **nb-005** DoD — PR #12 squash-merged.

---

## Batch — alt-history-and-systemic-sim (batch-20260620-113905) — RELEASED

- **task-001** AH7 slot-event system (SlotSchema + resolveSlot).
- **task-002** AH8b branch-name audit (surname/patronymic tokens).
- **task-003** Kennedy/RFK Jr protagonist timeline + bootlegger Era-0 bridge.
- **task-004–006** West-Coast / theocracy / media branch backdrop pools.
- **task-007** Role-flip era content (9 ev_flip_* events) — LATER REMOVED in FD-3.3 (no-leak).
- **task-008** AH3 timeline compiler (compile-at-Era-0).
- **task-009** AH5 timeline-compiler dev harness (pnpm timeline:dump/sweep).
- **task-010** AH9 butterfly weight/bias pass (event.bias).
- **task-011–014** SIM1 systemic layer (markets/currencies/ranks schemas + state, pure systemicTick, data, Markets UI).
- **task-015 / task-017** Balance + no-shallowness (absorbed → DE-3).
- **task-016** AH6 mechanical sweep.
- **task-019** Megachurch religious-dynasty branch.
- **task-020** Oligarchy/oligopoly branch.
- **task-021** True totalitarian theocracy (Gilead-grade).
- **task-022** Branch moral-axis sub-paths (absorbed → DE-2).
- **task-023** Persona paper-playtest (absorbed → DE-6b).
- **task-024** Koota ECS evaluation spec.
- **task-025** Per-branch deep-future motivations.
- **task-026** Koota refactor-first decision (absorbed → DE-1).
- **task-018** DoD — PR #10 squash-merged.

---

## Batch — alt-history consistency (batch-20260620-althist) — RELEASED

AH1 title-aware overrides · AH2 mutually-exclusive events · AH3 per-branch timelines
+ gears-in-a-clock compile-at-0 engine · AH4 no-shallowness invariant · AH5 dev
harness · AH6 agent-sweep · AH7 slot events · AH8 (a–d) branch-aware names/patronyms
+ sibling-count lever · AH9 butterfly weight/bias · SIM1 systemic sim layer · the
6 alt-history branches (nazi/westcoast/theocracy/media/megachurch/oligarchy).
All DONE — see git history + the per-task notes above.

---

## Batch — causality-endings-personality (batch-20260620-causality) — RELEASED

Scope: 1000+ permutations, deep per-era pools, no 5-minute clickthrough.
- **Phase M (M1–M7)** scale content for depth: raised era budgets + deep gated pools, 3–5 choices/event, branch-density pass, world/regional events, geopolitical causality layer, early-politics + alt-1990s-presidency branches.
- **Phase P (P1–P7 + sub)** four parallel world-timelines + linking protocol + News HUD + AI/deepfakes + Era-0 alt-history branches + three thematic (mores/religion/science) timelines + Musk character-timeline + Trump↔Musk role-flip (role-flip LATER REMOVED in FD-3.3 for no-leak).
- **Phase O** perceived/compressible timeline (jumpTo hops).
- **Phase N (N1–N8 + N4a–f)** one reality + medium-native HUD + science ladder + eras 11/12 + per-era early-out endings + Era-0 origins prologue + branch-and-merge + post-history motive doctrine.
- **Phases H–L** research/causality model, data-driven endings, per-era causal passes, personality+endings UI, verification (PR #8 squash-merged).

## Batch — maga-money-moves-full-build (batch-20260619-build) — RELEASED

The original full build (PR #1 squash-merged).
- **A** bootstrap + arcade-game profile (Vite+TS+pnpm+Biome+Svelte 5+Vitest+Playwright).
- **B** pure sim engine (RNG facade, zod content, GameState+meters, weighted selection, butterfly engine, effects/timeline/end).
- **C** engine glue (clock facade, Capacitor Preferences save/load).
- **D** UI/render/audio (tokens, meter HUD, event card, butterfly log + D3 graph, timeline/stats/dossier, render layer, Tone.js, screens+router).
- **E** assets + manifest. **F** all 10 eras of content. **G** integration + Android + live-verify + PR #1.

## VISION note (historical) — "DYNASTY": three playable dynastic sagas

The systems built (branch resolver, terms/titles, slot events, per-branch timeline
pools, compile-at-0, systemic markets/ranks) are a GENERIC dynastic-saga grammar.
Realized as the rename to "Dynasty" + the 3 playable Era-0 sagas + carousel (DE-5),
then generalized further into "found your own dynasty" (the FOUND-YOUR-OWN batch).
