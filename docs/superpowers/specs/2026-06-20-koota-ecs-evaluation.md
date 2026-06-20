# Koota (ECS) evaluation — query/engine layer for the dynasty sim

**Date:** 2026-06-20
**Status:** Recommendation (no code yet) — for review
**Question (user):** should we wire [Koota](https://github.com/pmndrs/koota) (pmndrs
reactive ECS) into the JSON-data layer to power the many cross-cutting queries +
engines we keep hand-rolling?

## What Koota is

Koota is a reactive Entity-Component-System: a mutable `World` holds entities;
components are typed data attached to entities; queries select entities matching
a component set; traits/relationships model graphs. It's optimized for real-time
loops (games, R3F) where a `world` is mutated each frame and systems read/write
components in place. It is fast, ergonomic, and reactive (observers fire on
component change).

## What we have (the hard constraint)

The sim is a **pure, deterministic, replay-from-seed** state machine
(`src/sim/**`, gate-enforced):

- `GameState` is plain serializable data; `applyChoice(content, state, choiceId,
  rng)` returns a **new** state. No in-place mutation.
- A save is **`seed + history`**; `replay()` reconstructs the exact state to the
  bit. No `Math.random`/`Date.now`; all randomness via `createRng(seed)` +
  `fork(label)`.
- The "queries/engines" the user means are already pure functions over `Content`
  (immutable, validated JSON) + `GameState`: `eligibleEvents`/`effectiveWeight`
  (event eligibility + weighting), `applyWorldFlags`/`timelinesForBranch` (the
  linking protocol), butterfly-rule matching, `resolveSlot`/`resolveCurrency`/
  `branchOf` (compile-time resolution), `systemicTick` (markets/ranks).

The tension: **Koota's value is a mutable reactive world; our correctness rests
on immutability + determinism + tiny replayable saves.** A mutable ECS as the
*source of truth* would fight the replay model (you'd have to serialize the whole
world every save and prove the mutation order is deterministic) and risks
smuggling in non-determinism (observer fire order, insertion order).

## Three options

### A. Adopt Koota as CORE (rewrite state.ts as an ECS world) — **DECLINE**
Replacing `GameState` with a Koota world means: saves become world snapshots (not
seed+history) OR we keep seed+history and must prove the world rebuilds
bit-identically through Koota's mutation/observer model — which Koota does not
guarantee (it's not designed for deterministic lockstep replay). High churn,
re-tests the entire pure core, adds a load-bearing dependency on mobile
(Capacitor bundle), and trades a property we depend on (determinism) for query
ergonomics we already have. Not worth it.

### B. Adopt Koota as a derived READ-MODEL (a query layer over GameState) — **DEFER / OPTIONAL**
Build a Koota world *each turn* by projecting the current pure `Content` +
`GameState` into entities/components, run declarative queries for read-only
concerns (e.g. "all eligible events biased toward branch X", UI dashboards,
the compiler/harness analytics), and throw it away. The pure transition stays the
source of truth; Koota is a disposable index.
- Pro: declarative queries; no determinism risk (read-only, rebuilt from pure
  state). Could simplify some hand-rolled filters.
- Con: rebuilding the world per turn is overhead; our current pure helpers are
  small, fast, tested, and read fine. The win is marginal *today*. Worth
  revisiting IF query complexity explodes (e.g. the persona-playtest analytics or
  a heavy cross-timeline UI), where ad-hoc loops would get unwieldy.

### C. Decline for now, keep pure helpers — **RECOMMENDED**
The hand-rolled pure functions are: deterministic by construction, individually
unit-tested, dependency-free, trivially serializable, and already composable
(`branchOf` → `timelinesForBranch` → `compileTimeline`; `effectiveWeight` stacks
butterfly + ripple + bias). They are not "queries we keep painfully
re-implementing" — they are a small, coherent, tested query vocabulary. Adding an
ECS now is a solution ahead of the problem.

## Recommendation

**Decline Koota as core (A); keep the pure helpers (C); hold option B in reserve.**
Adopt B *only if* a concrete future need appears where declarative queries clearly
beat the pure helpers AND can be expressed as a disposable read-model that never
becomes the source of truth — most likely candidates: the persona-playtest
analytics (task-023) or a complex cross-timeline UI. Even then, scope Koota to a
read-only projection rebuilt from `GameState`, never the save format.

**Tripwire to revisit:** if we find ourselves writing the same multi-component
join (e.g. "entities with trait X and relationship Y and component Z") in 3+
places by hand, that's the signal to introduce option B for that surface.

## Determinism guardrail (if B is ever adopted)

- The Koota world is rebuilt from `(Content, GameState)` every time it's needed
  and discarded; it is NEVER persisted and NEVER mutated as the source of truth.
- No query result may feed back into `GameState` except through the existing pure
  transition (so replay stays exact).
- No Koota observer may carry game logic with side effects; observers are for UI
  reactivity only.
