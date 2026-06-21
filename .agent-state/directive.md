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

### FD-3.5 DISSOLVE LITERAL DYNASTY IDENTITY — DONE (live-verified)
- [x] FD-3.5a DONE: `DynastyKey` → `Archetype = economic|political|technological|religious` threaded through slots/state/compiler/effects/loop/save/gameStore/App/procgen. GameState.dynasty → archetype; DYNASTY_START → ARCHETYPE_START; compiler dynastyOf → archetypeOf. Save format v2 (archetype + founding metadata; v1 literal-dynasty migrated by mapping).
- [x] FD-3.5b DONE: no-leak gate rekeyed onto ARCHETYPE — projectWorldEvents tags `archetype:<id>` (musk→technological, kennedy→political); ownedByOtherArchetype gates vs state.archetype. The character timelines are now woven material for the matching archetype pool, no literal-family exclusivity.
- [x] FD-3.5c DONE (interim): family-trees keyed by `archetype` (treeForArchetype); founded lines use their OWN surname/place from founding metadata, the archetype tree is reference/seed. (Full tree-grow is FD-8.)
- [x] FD-3.5d DONE: preset dynasty-select carousel REMOVED (TitleScreen DYNASTIES array + the Trump/Kennedy/Musk cards gone). Replaced by the founding flow (FD-6.3).

### Remaining — this branch lands ALL of it

- [x] **FD-6.2 DONE:** founding.foundDynasty → {state, progenitorName, moment}; GameState.founding metadata; seeded progenitor naming; 7 tests; 406 green.
- [x] **FD-6.3 DONE (live-verified):** found-only Stage-0 UI. TitleScreen rebuilt: title → moment picker (8 hinges, deep-history flagged green) → surname entry (Begin disabled until named) → onFound(momentId, surname, seed). App.foundGame calls foundDynasty → GameStore(restore=founded state). TitleScreen browser+visual tests rewritten (10 green). LIVE-VERIFIED via chrome-devtools: founded the deep-history Baghdad line "al-Rashid" → opened in the caliphate era (year 795 "A Marriage of Houses" → choice → year 819 "The Victor Enters the City"), full HUD, ZERO console errors.
- [x] **FD-7 DONE:** world stacks. WorldStackSchema (geography/politics/religion/ideology + perils + placeLabel, per place [+ optional era]). src/data/world/stacks.json: 6 places (ireland/bavaria/south_africa/west_coast/east_coast/baghdad) covering every start-moment. worldStacks.resolveStack (era-specific wins over era-less). Wired into content + loader + the FD-4.2 procgen ExpandContext (place label + period perils now from the stack, replacing the era-generic fallback). buildContent cross-ref: every start-moment's place must have a stack. 6 tests; 412 green.
- [x] **FD-8 DONE:** live family tree + birth. FamilyState/LiveMember on GameState; family.ts seedFamily + beget (seeded sex, onomastic naming + suffix, inherited±20 traits) + childrenOf/kinFor/memberById; foundDynasty seeds progenitor; ChoiceSchema.begets wired into applyChoice (forked-rng, replay-deterministic). 9 tests; 421 green.
- [x] **FD-9 DONE:** mortality + aging. mortality.ts deathHazard (Gompertz; rises with age, lowered by era-medicine + vigor) + ERA_MEDICINE table + applyMortality (per-year seeded pass, records died=year, never resurrects). Wired into the applyChoice per-year tick. 10+ tests.
- [x] **FD-10 DONE (core):** succession. succession.ts succeed (eldest living child by primogeniture, or a `heir_<id>`-flagged named heir; skips dead heirs) + isLineExtinct. applyChoice: protagonist death → promote heir AS new protagonist (re-anchor birthYear/age + succession_occurred flag) carrying capital/ladders/branch/place forward, or end with `line-extinct`. Multi-generation applyChoice integration + replay tests. (Richer estate-planning CHOICES — split/trusts/rivalries — are authored content for FD-11.)
- [x] **FD-4.3 DONE:** deep-history procedural templates. src/data/templates/deep-history.json (court_favor_turns, caravan_fortune) feed the caliphate era; tropes catalog-valid; a founded Baghdad line materializes them with the Baghdad world-stack place/perils resolved. 2 tests. (Broader long-tail breadth comes from FD-11 Gemini bulk.)
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
