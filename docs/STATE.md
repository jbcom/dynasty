---
title: State & Architecture
updated: 2026-06-22
status: current
domain: context
---

# Dynasty — current state & architecture

The canonical description of the game as it stands. The NARRATIVE ACTS (novel) model below is the
current top model; the CONVERGENCE SAGA and earlier founding-pivot sections are kept as historical
context (each piece either folded into the novel model or noted where still being wired).

## NARRATIVE ACTS — the NOVEL (current top model)

Spec: `docs/superpowers/specs/2026-06-21-narrative-acts-design.md`. Memory: novel-acts-model. The
PLAYED content reads as NOVELS, not sentence fragments — titled acts of multi-paragraph sensory
SCENES that frame choices (Suzerain), with a fall-forward weave + cross-family intersections (ink).
Shipped on `feat/narrative-acts` (PRs #65/#67); polished on `feat/saga-polish` (in progress).

- **Model** (`src/sim/saga/`): `schema.ts` (Act → Scene[sense + multi-paragraph prose] → Beat[ink
  weave, alternatives] → Decision[major|secondary, options may carry a `succession` effect] +
  ThreadRef[cross-family] + Codex); `player.ts` (pure: buildCorpus — which also `weaveThreads` a
  midpoint intersection per act —, applyBeatChoice, applyDecision, nextScene, openingScene,
  resolveThreads, actsForTier(…, cls) with poor-fallback); `runner.ts` (pure ActState walk:
  startAct/chooseBeat/chooseDecision; deterministic = save/replay invariant).
- **Class-keyed corpus** (`src/data/saga/<wave>/<archetype>.<cls>.act.json`): act id
  `act:<wave>:<archetype>:<cls>:t<tier>`. Two tracks, BOTH complete: `poor` (252) + `middle` (252) = 504 acts.
  42 cells (7 waves × 6 archetypes) × 6 reach tiers per track. 0 leaks / 0 dangling / 0 orphans.
- **Loader** `src/data/loadSaga.ts` (eager glob + zod). **Spine** `src/sim/spine.ts` declares the
  scene-slot scaffold (open/rising+secondary/midpoint+intersection/turn+major/close), seeded per
  cell; GenAI fleshes it. **GenAI** `genai:expand --type scene [--all --cls <poor|middle>]` +
  `scripts/retitle-saga.ts` (distinct meso act titles) + `scripts/prune-saga-orphans.ts`.
- **Engine cut-over** (`src/engine/sagaDriver.ts` + `loop.ts`): Game holds a SagaDriver; begins the
  founded line's act by cell (wave = founding place, archetype, tier = protagonist generation, cls =
  sagaClassForWealth(personality.wealth)); a saga beat/decision advances the run clock + resumes the
  event flow on act-end; `GameView.saga` = {actTitle, scene, threads, ended}.
- **Play surface (PF-3)** `src/ui/saga/SceneReader.svelte` + `PlayScreen.svelte`: PAGED prose (one
  paragraph per tap, full-bleed tap layer), choices folded in as GLOWING inline options (tap-away
  urges, doesn't advance); slim header = act-chapter (MESO) + macro·year (the macro is the ~100-yr
  SPAN, not the act title); `SlideOutMenu.svelte` top-right hamburger holds the non-essential HUD
  (meters, motivators, utopia–tyranny). Cross-family intersections render as an "Elsewhere — another
  line" aside.
- **Retired**: the Epoch-0 NARRATIVE (birth/naming/station/schooling/calling) is gone; the saga acts
  are the played story. The SUCCESSION mechanic survives (events tagged `life-stage`,
  ev_cp_take_partner/raise_heirs; founding sets emerged/named/calling_chosen).

### Saga polish — SHIPPED (PR #70, squash-merged 2026-06-22; PF-3…PF-18 done)

Everything formerly "still being wired" is now wired, plus a full corpus QA pass:

- **CONVERGENCE fed into play** (PF-7): the Game creates + advances a `DynastyWorld` (separate RNG
  stream, replay bit-identical); `GameView.glimpses`/`rung` feed `projectSaga`, so rival-line GLIMPSES
  ("OTHER LINES — holding/…") + the class readout populate the slide-out menu, and
  `Game.convergenceEnding()` resolves the dynastic destination → `LegacyReport` framing at run-end.
- **Saga succession drives real advancement** (PF-8): pure `advanceFamily(content,state,fromYear,rng)`
  (mortality → succeed → continue-as-heir) runs on each saga clock tick; reading the novel ages + succeeds the line.
- **Codex** (PF-11): `src/data/saga/codex/codex.json` (7 waves + 3 macro-acts, leak-free) + `CodexView`
  in the slide-out menu.
- **The corpus is COMPLETE + QA'd** (PF-5/9/18): 504 acts (252 poor + 252 middle, every cell 6 tiers)
  generated on **gemini-3.5-flash**; three-scope QA sweep (scene polish + lineage continuity + 504
  authored pair-specific cross-storyline crossings in `thread[]`); retitle → 496/504 distinct meso
  titles. Gen gate hardened with scene-ref integrity; `loadSaga` asserts 504 + per-cell tier completeness.
  Tooling: `genai:expand` (generate) + `genai:qa --pass scene|lineage|braid|all` (QA, pooled) +
  `retitle-saga.ts`. Leak floor unified in `src/sim/leak.ts` (case-sensitive, surname-scoped).
- Audio (PF-15/17): page-turn + choice cues (Howler) + per-era ambient bed (Tone.js), gated by a Sound setting.

## CONVERGENCE SAGA (folded into the novel model above; was the prior top model)

Spec: `docs/superpowers/specs/2026-06-21-convergence-saga-design.md`. The game is "the
story of America": you found a bloodline as a WAVE of mid-to-late-1800s immigration and
steer it generation by generation — always told first-person-intimate — through three
MACRO-ACTS (Convergence 1800s → Emergence 1900s → Ascension 2000s+) toward (or failing
to reach) colonizing the stars. Every line you DON'T play grows in parallel as a force
you glimpse. The build (`feat/convergence-saga`, tasks SS-1…SS-16):

- **Motivators** (`src/sim/motivators.ts`) — 8 grounding axes (wealth/politics/worldview/
  power/tradition/honor/lineage/reach); drift across generations + gate reachable futures.
  Replaces the old 4-axis personality (now an adapter in `personality.ts`).
- **GOAP** (`src/sim/goap/`, Yuka) — pure deterministic goal core; every line is a
  **DynastyAgent** (`src/sim/dynastyAgent.ts`) whose motivators set evaluator characterBias.
- **Macro-acts + epochs** (`src/sim/macroActs.ts`) — year-banded acts + cross-cutting epochs
  that ride/crush a line by its motivators (the misfortune driver).
- **Class rung** (`src/sim/classRung.ts`) — class is a movable rung; misfortune drops into
  the lower track, recovery climbs back, hysteresis leaves a mark.
- **Wave roster** (`places.json`, `kind:"wave"`) — 7 immigration waves (ireland, bavaria,
  italian, ashkenazi_jewish, scandinavian, chinese, baghdad→Levant) + the American
  `kind:"destination"` grounds. SA + colonial dropped.
- **Onboarding funnel** (`src/sim/waveSelect.ts` + `OnboardingScreen`) — Period → Class →
  Race/Culture, seeding the GOAP brain.
- **Multi-line world** (`src/sim/dynastyWorld.ts`) — rivals advance + surface as glimpses.
- **Convergence endings** (`src/sim/convergence.ts`) — ~14 shared destination × motivator-
  coloring states, motivator-gated, others' fates fold in.
- **Spine** (`src/sim/spine.ts`) — the authored act/beat scaffold GenAI fleshes.
- **GenAI expand** (`src/sim/genai/expand.ts`, `pnpm genai:expand`) — one uniform multi-type
  expander writing canonical JSON (no `.gen.json`); the old `genai:breadth` is retired.
- **Read-model + UI** (`src/sim/readModel.ts` + `src/ui/saga/`) — `projectSaga()` → the
  novel-frame `SagaPanel` + a per-macro-act WebGL `ShaderBackdrop`.

Acceptance (`acceptance.unit.test.ts`): a representative full run fires an hour+ of beats,
0 preset-person leaks, bit-identical replay.

The sections below describe the prior founding-pivot model (historical; still partly live
until each piece is fully cut over).

## The model in one paragraph

You FOUND your own family line. New Game deals a deterministic origin from the seed
and drops you into a diegetic, BitLife-style birth; you DISCOVER that origin through
sensory and social cues, your line is named in-fiction, and you steer it generation
to generation across the centuries. There are no preset families — the literal
Trump/Kennedy/Musk/Graham lines are fully dissolved into reusable archetypes and
tropes that any founded line embodies.

## Orthogonal identity fabric

A run's identity is composed from independent axes (no conflation):

- **PLACE** — geography only (`src/data/world/places.json` + world-stacks): ireland,
  bavaria, south_africa, the coasts, the frontier regions, baghdad, …. Each place
  carries a diegetic **sensory cue** (cue → place), a default **culture**, the
  era-tree dir holding its content, and the eras a founding here may begin in.
- **CULTURE** — ethnic naming only (`src/data/onomastics.json`): per-culture given-
  name pools + naming conventions. Place defaults a culture but they can diverge.
- **ERA** — when the line is founded (the period registry, `eras/index.json`).
- **ARCHETYPE** — the power base the dynasty is built on. Six: `economic`,
  `political`, `technological`, `religious`, `entertainment`, `athletic`
  (`src/sim/slots.ts`).
- **THEMATIC AXES** — faith / ideology / sociology / tech, set as LIVED Epoch-0
  beats, place-and-time-scaled by the world-stack's `axisIntensity`.

`foundByComposition(content, {place, era, culture, year, archetype, gender, surname,
seed, calling?, axisChoices?})` is the single pure founding seam. `dealComposition`
deals a seed-random composition; `compositionFromMoment` expands a curated
start-moment into one. Identity tokens (`{given_name}`/`{surname}`/`{full_name}`/
`{family_name}`) resolve from the run's LIVE family tree via `runTerms`, so the
founded line's own name renders everywhere — never a literal preset.

## The diegetic birth (Epoch 0) — RETIRED (historical)

> Superseded by the NARRATIVE ACTS model: the Epoch-0 birth/naming/station/schooling/calling NARRATIVE
> is deleted; the saga acts are the played opening (the tier-0 act, no when/where re-confirm). Only the
> SUCCESSION beats survive (retagged `life-stage`). Kept below for history.

New Game → `eras/new-york/1885-1946-origins` birth chain (founded-line-gated, run
first): **ev_birth_emergence** (6-slot sensory cue → place reveal) → **ev_birth_gender**
("your parents exclaim…") → **ev_birth_naming** ("You are {full_name}") →
**ev_birth_calling** (a lived choice among the six callings, `setsCalling`) → the
partner + heirs beats. Calling + axes bias the line for generations.

## Content organization

- **Eras** → `src/data/eras/<place>/<period>/events.json`, glob-loaded
  (`./eras/**/*.json`); place + period derive from the path, the era id from the
  file. `baghdad/` (deep-history), `new-york/` (the life-arc, origins→victory),
  `_shared/` (the place-agnostic future: atomic→interstellar).
- **World timelines** → one file per scope (usa/world/mores/religion/manhattan/
  eastcoast/westcoast/science). Alt-history branches (nazi/theocracy/media/
  megachurch/oligarchy/westcoast) are collapsed in: each event carries a `branch`
  field and selection REPLACES the default with the run's branch events. The former
  literal-person scopes (musk → westcoast, kennedy → eastcoast) are folded in as
  `rival-house:*`-tagged backdrop.
- **Archetype gating** — events declare `archetypes: [...]` (empty = agnostic, fires
  for any line); the eligibility gate filters by the run's archetype.

## Live family tree

`src/sim/family.ts` (seedFamily/beget/takePartner/kinFor), `mortality.ts` (Gompertz
deathHazard + ERA_MEDICINE), `succession.ts` (mode-aware heir selection). The tree
drives names, procgen `member`/`rival`, and generation-to-generation progression.

## Determinism + saves

Pure function of `(seed, choices)`. No `Math.random`/`Date.now` in `src/sim`; RNG via
`createRng(seed)` / `rng.fork(label)`. A save is seed + the full composition +
choice history; `fromSave` reconstructs via `foundByComposition` (legacy moment saves
fall back to `foundDynasty`).

## Dev harness (CP-R7)

`src/sim/harness.ts`: `tracePlaythrough` plays a founded run forward recording every
rendered beat; `validateTrace` asserts linear time, no preset-person leaks, monotonic
generation progression, and real branch width; `auditTimelines` sweeps the whole
place×era×archetype space. `src/sim/__tests__/harness.unit.test.ts` runs the audit
(180 traces / 7000+ beats → 0 findings) and dumps the corpus to
`artifacts/timeline-audit.json`. An in-app DEV overlay (App.svelte, `import.meta.env.DEV`)
adds fast-forward (+1/+10/+100) and a timeline JSON download.

## Stack

Vite + TypeScript + Svelte 5 + Capacitor (Android) + Biome + Vitest (node + browser)
+ Playwright e2e; seedrandom, Tone.js + Howler, Motion One, D3, uPlot, open-props, zod.
