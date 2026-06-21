# Continuous Work Directive — Dynasty (maga-money-moves)

**Status:** ACTIVE
**Owner:** jbogaty
**Mandate (2026-06-21):** REFINE the founding experience into an organic Svelte
control panel and a diegetic Epoch-0, AND decouple the conflated identity model
into orthogonal fabrics. The found-your-own-dynasty game shipped (PR #28/#30,
archived). Work SERIALLY, own everything, NO agent swarm ([[agent-swarm-discipline]]).
File/PR size no constraint. Completed history → `directive-archive.md`.
Spec: docs/superpowers/specs/2026-06-21-founding-control-panel.md.

## What CONTINUOUS means
1. Never stop for status reports the user didn't ask for. 2. Never stop for scope
caution. 3. Never stop to summarize. 4. Never stop on context pressure. 5. Never
stop because a task feels big. 6. Only stop on: explicit user halt, red CI
blocking, or a genuine scope-flip design question (ask, then continue).

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

## Batch — FOUNDING CONTROL PANEL & DIEGETIC EPOCH-0 (batch-20260621-control-panel)

USER VISION (2026-06-21): replace the linear 3-step founding with an organic
control panel — swipeable moment CAROUSEL → fade to a NAMING MODAL (name + gender
identity) → choose a CALLING → into a DIEGETIC EPOCH-0 (faith adopt/reject,
finding a partner, the axis-setting choices that refine the line for generations).

LOCKED DECISIONS (user):
- Identity = **PLACE × CULTURE × thematic axes** (full orthogonal split). Places =
  geography only (+ add canada / american_midwest / american_south). Culture =
  ethnic naming only. Religion/sociology/ideology/tech are woven per place×era×
  choices, not baked into a conflated label. Decompose `wasp_east_coast` etc.
- **All four thematic axes are explicit Epoch-0 choices** (faith / ideology /
  sociology / tech bent), each place-and-time-scaled (weight from the place×era
  stack), rippling for generations via flags + trope/trait bias.
- Calling = trait + trope generational lens, layered on archetype.
- Gender identity drives naming + succession + content (real sim input).
- foundDynasty stays the single pure engine seam the UI feeds.

### Queue
- [x] **CP-1 DONE:** decoupled identity. `wasp_east_coast` (conflated place+ethnicity) → pure ethnic `anglo_protestant` culture; gilded_age moment re-pointed to (place=east_coast, culture=anglo_protestant). Added canada / american_midwest / american_south world-stacks (geography-only immigration destinations, full 4-layer + perils). Tests: new places exist, culture is place-free, wasp_east_coast gone. 452 green. (More culture/place re-pointing surfaces as content uses the new places — CP-8.)
- [x] **CP-2 DONE:** calling system. CallingSchema (traitDrift + tropeWeights) + callings.json (merchant/scholar/soldier/cleric/builder/courtier) + callings.ts resolver (callingById/applyCallingDrift/callingWeight). Wired: foundDynasty stores founding.calling; applyChoice drifts each begotten child's traits; effectiveWeight multiplies events by the calling's trope weights (layered on branch+personality bias). buildContent cross-refs trope-weight keys to the catalog. 8 tests; 460 green; pure/deterministic (drift is a fixed add, weight a lookup).
- [x] **CP-3 DONE (sim):** gender/identity. foundDynasty accepts gender (overrides moment default; drives the onomastic name pool + the seeded progenitor's sex) + successionMode, both stored on founding metadata. succeed gained a SuccessionMode param (absolute=eldest regardless / primogeniture=eldest son first / matriarchal=eldest daughter first), threaded from founding.successionMode in applyChoice. 5 new tests (gender→pool, female progenitor, 3 succession modes). 462 green. (Pronoun {token} interpolation + the UI identity picker land in CP-7.)
- [x] **CP-4 DONE:** thematic axes as Epoch-0 choices. Axis/AxisOption/AxesFile schema + axes.json (faith/ideology/sociology/tech, faith = devout/pragmatic/reject etc.). WorldStack.axisIntensity (per-axis 0..1 per place×era; set on baghdad/ireland/west_coast). axes.ts resolveAxisChoice scales an option's meter/personality deltas by the place×era intensity (flags unscaled). foundDynasty applies chosen stances → scaled deltas + durable flags + records founding.axisChoices. 5 tests incl. faith-reject lands harder in Baghdad than the frontier. 467 green; pure/deterministic.
- [x] **CP-5 DONE:** partner mechanic. FamilyState.partnerId; family.takePartner mints a married-in in-law (complement sex, culture-pool name, own seeded traits, no parentId, protagonist's generation) and sets partnerId. beget now blends the partner's traits (midpoint) into the protagonist's children. ChoiceSchema.takesPartner wired into applyChoice (the Epoch-0 "find a partner" beat); succession clears partnerId for the heir. 4 tests (mint, trait-blend, determinism, applyChoice). 471 green; pure/seeded.
- [x] **CP-6 DONE:** save carries the full founding config. SaveData.founding extended (calling/gender/successionMode/axisChoices); toSave persists them; fromSave passes them back to foundDynasty so a configured founded line reconstructs bit-identically (additive/optional — v2 saves stay compatible). foundDynasty already accepted all inputs (CP-2..CP-5). Browser round-trip test asserts flags/meters/family all match. 471 unit + save browser green.
- [x] **CP-7 DONE then SUPERSEDED:** built the control-panel UI (carousel→name→calling→axes, live-verified). The user pivoted to a DIEGETIC BitLife-style birth (below); the panel is retired by CP-7r. The sim layers it fed (CP-1..CP-6) stay.
- [~] **CP-8 partial:** authored 2 diegetic Epoch-0 beats (ev_cp_take_partner, ev_cp_raise_heirs) gated on founded_line. Remainder folds into CP-7r-c (the birth sequence) + CP-8 breadth.

### PIVOT (user, 2026-06-21): DIEGETIC BITLIFE-STYLE BIRTH — supersedes the panel
New Game drops straight into your BIRTH; you DISCOVER origin via sensory/social cues, not a config form. "You emerge kicking and screaming into the…" → 6-slot sensory choice (desert heat+market = Baghdad, fish+salt air = Ireland…) resolves PLACE; "your parents exclaim their —" → son/daughter/other resolves GENDER; parents name you; calling + the 4 axes become LIVED Epoch-0 beats. LOCKED: origin = PLACE × ERA composed independently (foundDynasty generalizes from momentId → composed {place,era,culture,gender,…}; start-moments become seed material). 6-slot compressed events (2-line story + 6 terse choices). No internal identity nouns (Donald/ev_donald_*) in player-facing copy. Spec: docs/superpowers/specs/2026-06-21-founding-control-panel.md §PIVOT/§CP-7r.

### REASSESSED ORDER (user, 2026-06-21: "figure out the right order… no placeholders/drift/stubs, no fallbacks, absorb/rename everything")
Rationale: rip out the literal layer FIRST so the new diegetic model is never built ALONGSIDE dead literal content (that's the drift the user warns of). Then generalize founding to composition, then build the birth on cleared ground, then UI, then breadth, then DoD. Each step ships green with no parallel old+new.

- [x] **CP-R1 DONE: dissolved the literal protagonist layer.** (1) Wired identity tokens (given_name/surname/full_name/family_name) to resolve from the run's FOUNDED LINE via runTerms, removed the literal fallbacks (PATRIARCH_GIVEN/?? "Donald"/?? "Trump") + the literal terms.json defaults; (2) renamed the 3 ev_donald_* → ev_protagonist_* + tokenized their copy; (3) rewired procgen to draw names from the live family tree, not the literal spine; (3b) tokenized ALL protagonist-line names across the life-arc eras (brand era 100% clean). Browser-verified: of 519 events rendered for a founded Irish "Donnelly" line, only 24 retain literal Trump/Drumpf — all the documented bucket-C ANCESTOR/ORIGIN biography (Friedrich/Fred immigrant arc, nazi/theocracy/evangelical origin variants) + 2 Musk-rival events, which CP-R4/CP-R-ARCH repurpose. 474 unit + 68 browser green; app runs; build bundles. Commits bba0e96..(this).
- [x] **CP-R-AUDIT DONE: exhaustive bespoke-content audit (both layers).** TIMELINE layer (docs/.../2026-06-20-cp-r-audit-timelines.md): the 6 alt-history branches → place×time×flag/archetype conditions (nazi→axis_ascendant, theocracy→theocracy_proof_of_concept, media→entertainment+pleasure_king_origin, megachurch→dynasty_nonprofit_architecture, oligarchy→corporate_state, westcoast→place:westcoast); kennedy.json+musk.json → dissolve into base + condition gates. ERA layer (docs/.../2026-06-20-cp-r-audit-eras.md): 519 events classified — entertainment is a real 138-event slice (primetime/brand/mogul), athletic is GREENFIELD (~6 real events, needs CP-R6 authoring), ~36% archetype-agnostic, ~25% locked, ~49% multi. The archetypes:[...] event field + eligibility gate are built (foundation commit).
- [x] **CP-R-ARCH DONE (all sub-items complete).** 6 power archetypes + the archetypes:[...] event gate + entertainment/athletic event tagging + spines (ARCH-1) + the branch-timeline collapse 34→8 files (ARCH-2) + kennedy/musk dissolution into rival-house backdrop (ARCH-3). Foundation + tagging detail below. Added `entertainment` + `athletic` archetypes (6 total) + the `archetypes:[...]` event field + the eligibility gate (browser-verified: entertainment events hide from economic runs, show to entertainment; USFL shows for athletic+economic). Tagged the entertainment slice (Apprentice/WWE/reality/branding/licensing/consumer/tabloid/pageant across primetime/brand/mogul) + the ~6 real athletic events (NYMA baseball, USFL). Remaining CP-R-ARCH sub-items:
- [x] **CP-R-ARCH-1 DONE: family-tree spines for the 2 new archetypes.** Added thin generic family-trees/entertainment.json + athletic.json (progenitor→founder→heir+rival, non-literal names — the live family drives founded runs so these are pre-founding fallbacks only). Extended FamilyTreeSchema.archetype enum to 6. slots.dynasty.{entertainment,athletic} overrides not needed yet (resolveSlot falls back to default/branch; greenfield until CP-R6). Updated family-trees test to expect 6 spines. 474 green.
- [x] **CP-R-ARCH-2 DONE: collapsed alt-history branch timelines into one file per scope (34→10).** Added a `branch` field to WorldEvent; rewired timelinesForBranch from FILE-swap to EVENT-level REPLACE selection (a branch's events replace the scope's default; fall back to default). Merged the 6 branch variants for usa/world/mores/religion into their base files, each event branch-tagged; removed 24 variant files. Browser-verified: usa.json (1 file, 286 events) → 48 default / 56 nazi / 36 media events, zero overlap, exact prior behavior. 460 unit + 68 browser green; build bundles. (Simpler than the anchor-flag-injection plan — the branch field + REPLACE selection preserves the complete-alternate-history semantics directly.)
- [x] **CP-R-ARCH-3 DONE: dissolved kennedy.json + musk.json into geographic backdrop.** Folded the kennedy arc → eastcoast.json (tags rival-house:political) and the musk arc → westcoast.json (tags rival-house:technological); removed the two literal-person scope files + the musk/kennedy scope-enum entries; removed the NewsTicker "Musk" literal label; simplified archetypeForScope (all remaining scopes are shared backdrop — rival houses are world-context every line encounters, the "other timelines to weave," not archetype-locked). Their flags (kennedy_dynasty_active/musk_* ) still gate the political/technological prologues. 34→8 timeline files total. 458 unit + 68 browser green; build bundles. CP-R-ARCH COMPLETE.
- [x] **CP-R2 DONE: foundByComposition (sim).** Origin = composed {place, era, culture, year, archetype, gender, surname, seed, calling?, successionMode?, axisChoices?}. foundByComposition is the pure founding seam; foundDynasty(momentId) is now a thin wrapper (compositionFromMoment → foundByComposition + attach moment). A pure composition synthesizes a `composed:<place>:<era>` origin id. GameState.founding + SaveData carry the full composition (era/year/archetype/deepHistory) so a pure-composition run reconstructs via foundByComposition (fromSave falls back to foundDynasty for legacy moment saves). StartMoment + FamilyTree archetype enums extended to 6. Tests: pure-composition founding, entertainment/athletic compose, replay determinism, foundDynasty==composition parity, and a pure-composition SAVE ROUND-TRIP (reconstructs identically). 463 unit + 68 browser green.
- [x] **CP-R-ERA DONE (commit 48096bb): eras reorganized by PLACE × TIME, glob-loaded.** eras/<place>/<period>/events.json (baghdad/new-york/_shared), recursive glob, place+period from path, era-layout contract test. (This duplicate checkbox is now flipped to match.)
- [x] **CP-R3 DONE: places catalog + resolvers.** src/data/world/places.json: 9 canonical places, each with sensoryCue (cue→place for the diegetic birth), defaultCulture, eraContentDir, validEras. PlaceSchema + content.places + content-build cross-ref (every place's defaultCulture in onomastics, validEras real, world-stack covers it). places.ts resolvers: placeById, placeForCue, placeEraSpace, resolveComposition (place×era→Composition, throws off-catalog). INVARIANT test: every (place × era) in the space founds a valid run + unique cues. 469 unit + 68 browser green.
- [x] **CP-R4 DONE: diegetic birth sequence.** dealComposition(seed,surname) deals a seed-dealt origin (place×era×gender×archetype); foundByComposition founds it. Authored the birth chain in origins (founded_line-gated, weight 1000, run-first): ev_birth_emergence (6-slot sensory cue → "You Emerge"), ev_birth_gender ("Your Parents Exclaim"), ev_birth_naming ("You are {full_name}"). Flows into the lived Epoch-0 beats (partner/heirs). Live-verified end-to-end: New Game → emerge → gender → "You are John Donnelly / The Donnelly line begins with you" (founded-line tokens, NO preset) → partner. dealComposition determinism + validity tested.
- [x] **CP-R5 DONE: retired the panel UI.** TitleScreen → masthead + surname + seed + New Game (onBirth) · Load · Settings only. Removed the carousel/name/calling/axes step machine + all its dead CSS; App.foundGame → birthGame (deal+found+drop into birth). Rewrote TitleScreen.visual + screens.browser tests to the diegetic-entry contract; removed the dead panel fixtures. 471 unit + 67 browser green; 0 typecheck errors/warnings; build bundles; live-verified.
- [ ] **CP-R6 Content breadth.** Author the lived calling + axis Epoch-0 beats across the place×era space (Gemini toolkit for breadth); branch-density still passes; no thin/stub eras.
- [ ] **CP-R7 DoD.** Full gate + AH6/persona/founded-longrun sweeps over the new model + live-verify the birth→Epoch-0 per a modern AND the deep-history line; PR; reviewer trio; squash-merge; Status RELEASED.

## Architectural notes carried forward
- Eras are ONE linear chain by `order`; deep-history eras prepend via NEGATIVE order; a run's start era is resolved BY ID from its start-moment.
- Procedural expander is pure/seeded (src/sim/procgen); replay reconstructs generated events with NO persistence (Mode A), unlike Gemini Mode B.
- Trope catalog (src/data/tropes.json) is the single source of truth for the sim cross-ref gate AND the Gemini retag/extrapolate toolkit.
- buildExpandContext is the seam place/culture/calling/axis context plug into — wire there, don't duplicate.
- Every new sim input (place, culture, gender, calling, axis, partner) flows through seed+history with reconstructable rng.fork labels — replay must stay bit-identical.
