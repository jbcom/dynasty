/**
 * GOAP (Convergence Saga, SS-2) — a PURE, deterministic Goal-Oriented Action Planning layer
 * built on Yuka's goal core (Goal / CompositeGoal / Think / GoalEvaluator). Yuka's goal classes
 * are pure (no Math.random / Date.now / time — those live only in Yuka's STEERING code, which we
 * never import). We use the goal classes directly; the agent that owns a brain is a plain data
 * object (NOT a spatial GameEntity), passed as the owner via the minimal structural shape Yuka's
 * goal core actually reads (it only ever dereferences `owner` opaquely — see arbitrate()).
 *
 * Determinism: this layer reaches for NO randomness. Where a goal/evaluator needs a stochastic
 * choice it takes an injected `pick`/`rng` derived from createRng(seed); never Math.random. The
 * brain serializes to/from plain JSON so it round-trips inside the seed+history save bit-for-bit.
 */

import { CompositeGoal, type GameEntity, Goal, GoalEvaluator, Think } from "yuka";

/**
 * The minimal owner contract a GOAP brain needs. Any data object satisfying this can own a brain;
 * our DynastyAgent (SS-3) implements it. We cast to Yuka's GameEntity generic at the boundary
 * because Yuka's goal core never touches the spatial GameEntity surface — only `owner` identity.
 */
export interface GoapOwner {
  /** Stable id (used for serialization references). */
  readonly id: string;
  /** Yuka's goal toJSON() dereferences owner.uuid; mirror id into uuid so serialization is safe. */
  readonly uuid?: string;
}

/** Cast a plain GoapOwner to the GameEntity shape Yuka's goal generics expect. Pure, no-op at runtime. */
function asEntity<O extends GoapOwner>(owner: O): GameEntity {
  return owner as unknown as GameEntity;
}

/** A GOAP goal over a plain owner O — the unit of planned action. Pure lifecycle (activate/execute/terminate). */
export class GoapGoal<O extends GoapOwner> extends Goal<GameEntity> {
  constructor(public readonly ownerData: O) {
    super(asEntity(ownerData));
  }
}

/** A composite GOAP goal (a plan made of subgoals) over a plain owner O. */
export class GoapCompositeGoal<O extends GoapOwner> extends CompositeGoal<GameEntity> {
  constructor(public readonly ownerData: O) {
    super(asEntity(ownerData));
  }
}

/**
 * A goal evaluator: scores a top-level strategy's desirability for the owner (0..1), scaled by
 * `characterBias` (which the dynasty's MOTIVATORS set — SS-3). `score(owner)` is the pure desirability;
 * `apply(owner)` installs the chosen goal. Deterministic: no RNG here.
 */
export abstract class GoapEvaluator<O extends GoapOwner> extends GoalEvaluator<GameEntity> {
  constructor(characterBias = 1) {
    super(characterBias);
  }
  /** Pure desirability in [0,1] for this owner. */
  abstract score(owner: O): number;
  /** Install the goal this evaluator represents onto the owner's brain. */
  abstract apply(owner: O): void;

  // Bridge Yuka's GameEntity-typed hooks to our plain-owner methods.
  override calculateDesirability(owner: GameEntity): number {
    return this.score(owner as unknown as O);
  }
  override setGoal(owner: GameEntity): void {
    this.apply(owner as unknown as O);
  }
}

/**
 * The brain of a dynasty line — a Yuka Think over a plain owner. `arbitrate()` picks the highest
 * `score(owner) * characterBias` evaluator as the current strategy; `step()` executes the current
 * plan one tick. Pure + deterministic: same owner state + same evaluators → same plan.
 */
export class GoapBrain<O extends GoapOwner> extends Think<GameEntity> {
  constructor(public readonly ownerData: O) {
    super(asEntity(ownerData));
  }

  /** Add an evaluator (a candidate top-level strategy). Chainable. */
  withEvaluator(e: GoapEvaluator<O>): this {
    this.addEvaluator(e);
    return this;
  }

  /** Run one deterministic planning + execution tick: choose the best strategy, execute the plan. */
  tick(): this {
    this.arbitrate();
    this.execute();
    return this;
  }
}

/**
 * Serialize a brain's PLANNING STATE to plain JSON for the save. We persist what is needed to
 * reconstruct the plan deterministically: the chosen-goal status chain. Evaluators + goals are
 * re-registered from code by type on load (Yuka's registerType pattern), so only the dynamic
 * status/subgoal tree is serialized. Returns a JSON-safe object.
 */
export function serializeBrain<O extends GoapOwner>(brain: GoapBrain<O>): unknown {
  return brain.toJSON();
}
