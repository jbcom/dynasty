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
- [ ] **CP-2 Calling system (sim).** Calling data type (trait-drift + trope weights) + callings.json + resolver in beget + effectiveWeight; catalog cross-ref; tests.
- [ ] **CP-3 Gender/identity (sim).** Generalize progenitorSex → identity: onomastic pool + succession mode (primogeniture/matriarchal/absolute) + pronouns; wire foundDynasty + succession; tests.
- [ ] **CP-4 Thematic axes as Epoch-0 choices (sim+data).** Pure AxisChoice for faith/ideology/sociology/tech, resolved vs the founding place×era stack (place-and-time-scaled), setting durable flags + bias. Tests prove same choice lands differently by place/era.
- [ ] **CP-5 Partner mechanic (Epoch 0).** Early beat: take a partner (in-law LiveMember whose traits feed next beget + dynastic-merger hook). Pure + seeded; tests.
- [ ] **CP-6 foundDynasty + save extend.** Accept {place, culture, surname, given, gender, calling, axisChoices}; save carries them; replay reconstructs; tests.
- [ ] **CP-7 Control-panel UI.** Swipeable carousel → naming modal (name + gender) → calling → Epoch-0 axis choices → partner → play; replaces the 3-screen founding. Screenshot-verify; browser tests.
- [ ] **CP-8 Content pass.** Author Epoch-0 axis-choice events + partner beats per place/era (Gemini toolkit for breadth); branch-density still passes.
- [ ] **CP-9 DoD.** Full gate + AH6/persona/founded-longrun sweeps over the new model + live-verify panel→Epoch-0 per a modern AND the deep-history line; PR; reviewer trio; squash-merge; Status RELEASED.

## Architectural notes carried forward
- Eras are ONE linear chain by `order`; deep-history eras prepend via NEGATIVE order; a run's start era is resolved BY ID from its start-moment.
- Procedural expander is pure/seeded (src/sim/procgen); replay reconstructs generated events with NO persistence (Mode A), unlike Gemini Mode B.
- Trope catalog (src/data/tropes.json) is the single source of truth for the sim cross-ref gate AND the Gemini retag/extrapolate toolkit.
- buildExpandContext is the seam place/culture/calling/axis context plug into — wire there, don't duplicate.
- Every new sim input (place, culture, gender, calling, axis, partner) flows through seed+history with reconstructable rng.fork labels — replay must stay bit-identical.
