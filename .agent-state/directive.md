# Continuous Work Directive — Dynasty (maga-money-moves)

**Status:** ACTIVE
**Owner:** jbogaty
**Mandate (2026-06-20):** This ONE branch must land EVERYTHING remaining so the
next branch starts from the most complete, goal-aligned Dynasty game — meeting all
goals — and can then focus on USING + REFINING the game and the GenAI interactions.
No deferment, no splitting across branches. Work SERIALLY, own everything, NO agent
swarm ([[agent-swarm-discipline]]). File/PR size is no constraint — use barrel
packages. Completed history → `directive-archive.md`. Spec:
docs/superpowers/specs/2026-06-20-found-your-own-dynasty.md.

## What CONTINUOUS means
1. Never stop for status reports the user didn't ask for.
2. Never stop for scope caution. 3. Never stop to summarize — git log is the summary.
4. Never stop on context pressure (harness auto-compacts).
5. Never stop because a task feels big — pick the next atomic commit.
6. Only stop on: explicit user halt, red CI blocking, or a genuine scope-flip
   design question (ask, then continue).

## Operating loop
while queue has [ ] items: enumerate use-cases → docs/tests/code → verify (typecheck
+ biome + full suite, screenshot UI) → commit (Conventional Commit, one per item) →
dispatch reviewers → mark [x] → next.

## Forbidden phrases / behaviors
"deferred" | "v2+" | "out of scope" | "future work" | "follow-up" | "TODO" |
"FIXME" | "stub" | "placeholder" | "mock for now" | "pause point" | "next session"
| "stopping point" | "clean handoff". No Math.random/Date.now in src/sim (purity).
No commit to main. Squash-merge only. Stubs/`as any`/`it.todo` are bugs.

---

## Batch — FOUND YOUR OWN DYNASTY (batch-20260620-found-your-own-dynasty)

The player founds their own line at a historical hinge (name + when + where);
choices BEGET CHILDREN; the family tree GROWS; birth/death/inheritance/estate/
succession run the line across generations toward a 1000-year dynasty. The 4
composite archetypes are quick-start presets. Determinism (pure + seeded, replay
from seed+history) is the load-bearing invariant throughout.

**Shipped (detail in directive-archive.md):** FD-0 (spec), FD-1 (family trees),
FD-2 (unified event pool + no-leak), FD-3 (tropes-as-influences — literal lines
dissolved), FD-4.1/4.2 (procedural expander + lazy materialization), FD-5
(onomastics), FD-6.1 (8 start-moments + deep-history caliphate era).

### USER INTENT — tear apart the preset families (2026-06-20, authoritative)
"there are no more presets. this isnt additive." / "by now all preset families
should have been renamed, torn apart and repurposed as per our plan" / "giving us
tons of different timelines as events to weave together by epoch-0 choices and the
butterfly + causality engine and world events."
→ The literal Trump/Kennedy/Musk/Graham IDENTITIES are fully dissolved: no preset
dynasty cards, no `DynastyKey` literal enum, no dynasty:<id> no-leak keyed on real
families. A run's identity = its FOUNDING (start-moment → archetype + culture +
place + surname). The former character/family timelines become RAW EVENT MATERIAL
the compiler weaves by Epoch-0 choices + butterfly/causality + world events. The 4
composite archetypes (economic/political/technological/religious) are the identity
axis, not named houses.

### FD-3.5 DISSOLVE LITERAL DYNASTY IDENTITY (prerequisite for FD-6.3 UI) — NEXT
- [ ] FD-3.5a retire `DynastyKey = trump|musk|kennedy` → `Archetype = economic|political|technological|religious` as the run identity key. Thread through initState/Game/loop/save/compiler/effects/worldEvents/slots. birthYear comes from the start-moment (foundDynasty already does this); drop DYNASTY_START literal map (or rekey by archetype default years).
- [ ] FD-3.5b no-leak gate rekeys onto the FOUNDING, not literal families: world/character events tagged by archetype (or by source-line id) are gated vs the run's archetype. The musk/kennedy character timelines keep their EVENTS as woven material but lose literal-family exclusivity — they contribute to the matching archetype pool.
- [ ] FD-3.5c family-trees become archetype-keyed generic spines (repurpose the 4 real trees as the archetype seed material; strip literal-only framing where it leaks as a named preset). Founded lines grow their OWN tree (FD-8) from the progenitor; the archetype spine is reference/seed, not the player's identity.
- [ ] FD-3.5d delete the preset dynasty-select carousel data (TitleScreen DYNASTIES array, dynasty-*.svg preset cards) — folded into FD-6.3.

### Remaining — this branch lands ALL of it

- [x] **FD-6.2 DONE:** founding.foundDynasty → {state, progenitorName, moment}; GameState.founding metadata; seeded progenitor naming; 7 tests; 406 green.
- [ ] **FD-6.3 Stage-0 founding UI** (depends on FD-3.5). FOUND-ONLY — the carousel is GONE. Flow: title → moment picker (the 8 hinges, deep-history flagged) → surname entry → progenitor confirm → start. App calls foundDynasty → passes the founded GameState as `restore`. Update TitleScreen + browser/visual/e2e tests. Screenshot-verify.
- [ ] **FD-7 world stacks.** src/data/world/ geo/politics/religion/ideology per place (ireland/uk/south_africa/canada/east_coast/west_coast/baghdad). STANDING context by current `place`; migration = place change. Pure resolver feeding the FD-4.2 ExpandContext (real place + period perils, replacing the era-generic fallback). Tests per place/era.
- [ ] **FD-8 family-tree STATE + BIRTH.** FamilyState in GameState (live mutable tree, serializable). Pure seeded `beget()` — children from reign choices/events, onomastic naming (FD-5), inherited+varied traits. Replay-determinism tests.
- [ ] **FD-9 DEATH + AGING.** Per-year seeded mortality hazard (age + health + era-medicine); non-protagonist death events; protagonist death triggers succession (FD-10). Tests.
- [ ] **FD-10 INHERITANCE + ESTATE + SUCCESSION.** The eternal-dynasty loop: estate-planning choices (name heir, primogeniture vs split, rivalries, trusts); heir selection at death; protagonist-handoff continuing AS the heir; carry-forward of capital/ladders/branch/place; line-failure ending. Multi-generation replay tests.
- [ ] **FD-4.3 deep-history templates + breadth.** Author deep-history procedural templates (caliphate era + start-moment now exist); a 2nd deep-history exemplar if it strengthens breadth. Then FD-11 bulk fleshes the long tail.
- [ ] **FD-11 Gemini dev-bulk to the SHIP BAR.** Run `pnpm extrapolate` (gap-detect → generate w/ last-10–25 context → self-critique → schema+guard validate → commit JSON) until ALL dynasties + the deep-history line sustain a full 1000 YEARS of rule, no dead-ends/thin years. Mode A bakes into content; deterministic play unaffected. The depth ship-criterion.
- [ ] **FD-12 title menu + settings + runtime live (Mode B).** Title → New Game · Load Game · Settings. Settings stores the Gemini key via Capacitor secure storage (+ web fallback) + toggles live extrapolation; optional runtime generate-on-exhaustion persisting generated events INTO the save (determinism preserved by storage). Default OFF — the infinite tail beyond FD-11's baked depth.
- [ ] **FD-13 lineage view.** The growing family-tree screen (reclaimed portrait space); luxury-styled, real-2D, no portraits. Screenshot-verify.
- [ ] **FD-14 worldtime.ts retirement.** After live parity-verify that projectWorldEvents fully covers the linking protocol, retire the parallel worldtime.ts path. Parity test before removal.
- [ ] **FD-15 DEFINITION OF DONE (whole game).** Full gate (typecheck + biome + unit + browser + e2e) + AH6 + persona sweeps over MULTI-GENERATION runs + 1000-year determinism stress. App live-verified end-to-end per dynasty AND a founded line AND the deep-history line: found → beget heir → die → succeed → carry forward → ship bar. All commits on this branch; open ONE PR; reviewer trio; resolve threads; squash-merge green; directive → RELEASED. Next branch = use + refine the game + GenAI interactions.

## Architectural notes carried forward
- Eras are ONE linear chain by `order`; deep-history eras prepend via NEGATIVE order; a run's start era is resolved BY ID from its start-moment (initState startEra param), never array position.
- Procedural expander is pure/seeded (src/sim/procgen); replay reconstructs generated events with NO persistence (procgen/Mode A), unlike Gemini Mode B (which stores its output in the save).
- Trope catalog (src/data/tropes.json) is the single source of truth for the sim cross-ref gate AND the Gemini retag/extrapolate toolkit.
- buildExpandContext (FD-4.2) is the seam FD-7 (place/perils) and FD-8 (live tree → member/rival) plug into — wire them there, don't duplicate.
