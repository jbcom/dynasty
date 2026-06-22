---
title: UQ-1 — Spine Variety Architecture
updated: 2026-06-22
status: draft
domain: creative
---

# UQ-1 — spine variety: distinct arc shapes, not one template

## The bug (audit)

`spine.ts:sceneArc()` returns the SAME 5-slot shape for every act — open/rising/midpoint/turn/close,
fixed senses, fixed decision placement. Only per-tier scope WORDS vary. Result: 503/504 acts are
structurally identical ([[craft-spines-not-generator]]). Prose is surface-unique, but every act has the
same architecture → sameness + rough scannability ([[scannability-game-novel-balance]]).

## Decision: a SET of arc shapes, selected per cell

Replace the single `sceneArc` with a library of distinct **arc shapes**, each a different structural
rhythm. The shape is chosen by the cell's (tier × archetype × class × wave-hash) so the lattice spreads
across shapes deterministically — and so a wave×archetype's six tiers don't all read the same.

### The arc shapes (initial set — 6, expand later)

Each varies scene COUNT, the SENSE rotation, decision PLACEMENT/count, and the intent FRAMING. The
close always carries the succession decision (the dynastic fork the engine reads) — that invariant stays.

1. **rise** (the climb) — 5 scenes, building momentum: open → push → ally → MAJOR turn → close. Current
   default-ish, but tightened.
2. **collapse** (the fall) — 4 scenes, fast + grim: open(high) → crack → MAJOR reckoning → close(loss).
   Fewer scenes = a sharper, more scannable downward arc.
3. **holding** (endurance) — 6 scenes, slower, atmospheric: a generation that survives more than it
   achieves — open → toil → small secondary choice → drift → MAJOR quiet choice → close. More white space.
4. **reinvention** (the pivot) — 5 scenes, a hinge: open(stuck) → spark → secondary fork → MAJOR leap →
   close(changed).
5. **rivalry** (the contest) — 5 scenes, intersection-forward: a crossing is structural, not incidental —
   open → meet(the other line) → secondary maneuver → MAJOR confrontation → close. (Pairs with WV-2.)
6. **windfall** (the break) — 4 scenes, momentum up: open → the chance → MAJOR seize-or-refuse → close.

### Selection (deterministic)

`arcShapeFor(cell, tier)` → a shape id, by a pure hash of (wave, archetype, cls, tier). Tune so each
wave×archetype's 6-tier chain mixes shapes (not all "rise"), and so tier semantics still hold (a tier-0
founding leans rise/holding; a mid-tier can collapse/reinvent; a high tier can rivalry/windfall).

## Scannability in the prose prompt (paired)

Per-arc GenAI prompting (different instructions per shape) ALSO prompts for SCANNABLE rhythm: varied
sentence length, short punchy beats beside fuller passages, paragraph breaks that let the eye scan —
NOT uniform dense blocks, but NOT thinned to a couple of lines ([[scannability-game-novel-balance]]).

## Build order (design → proof → roll out)

1. `spine.ts`: the arc-shape library + `arcShapeFor` selector; `sceneArc` → `arcScenes(shape, ...)`.
   Pure + deterministic; unit-test the shape distribution (the lattice spreads; a chain mixes shapes;
   close always carries succession).
2. PROOF: regenerate a few cells (e.g. ireland economic poor + 1-2 others) and read them — confirm the
   shapes read structurally different + scannable. Adjust shapes/prompts.
3. Per-arc generation prompting in `genai-expand.ts` (different instructions + scannable-rhythm ask per
   shape).
4. Roll out: regenerate the corpus (the big GenAI run). Then UQ-2 audits semantic uniqueness + genuine
   intersections across the regenerated acts.

Determinism preserved (shape selection is a pure hash; generation seeded).
