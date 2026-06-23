/**
 * DYNASTY AGENT (Convergence Saga, SS-3) — a bloodline as a GOAP agent.
 *
 * Every line in the world (the one you play AND all the others) is the same thing: a DynastyAgent
 * carrying its 8 MOTIVATORS (SS-1) + its archetype power-base + a position on the shared
 * 1800s→stars rung/tier, with a GOAP brain (SS-2) whose evaluators are chosen by the archetype
 * and whose characterBias on each evaluator is driven by the motivators. Each turn the brain
 * arbitrates (highest score × bias) to pick the line's current strategy — pure + deterministic,
 * so all the unplayed lines advance identically on replay. The played line surfaces the chosen
 * goals to the player; the others resolve automatically.
 *
 * Pure: no Math.random/Date.now. Any stochastic resolution takes an injected createRng-seeded pick.
 */

import { GoapBrain, GoapEvaluator, GoapGoal, type GoapOwner } from "./goap";
import {
  dominantMotivator,
  initMotivators,
  type MotivatorAxis,
  type Motivators,
} from "./motivators";
import type { Archetype } from "./slots";

/** The strategies a dynasty line can pursue at a turn — the top-level GOAP goals. */
export type DynastyStrategy =
  | "accumulate" // build wealth/capital (economic lean)
  | "seize_power" // offices, dominance (power lean)
  | "spread_belief" // faith/movement (worldview−/community)
  | "advance_knowledge" // invention/science (worldview+/progress)
  | "win_renown" // fame/glory (entertainment/athletic, reputation)
  | "endure"; // survive, hold the line (the humble/fallback strategy)

/** A dynasty line's mutable agent state (the GOAP owner). */
export interface DynastyAgent extends GoapOwner {
  readonly id: string;
  readonly uuid: string;
  /** The line's power base. */
  archetype: Archetype;
  /** The 8-axis motivator profile (drifts across generations). */
  motivators: Motivators;
  /** Position on the shared progress ladder (0 = arrival in the 1800s … higher = toward the stars). */
  rung: number;
  /** The strategy the brain chose this turn (null until first tick). */
  strategy: DynastyStrategy | null;
  /** SHOCK-AFTERMATH-IN-RIVALS: the rival took a seeded setback (lost a rung) and has not yet rebounded —
   *  a window the player can exploit. Transient run state (rebuilt deterministically by advanceWorld), like
   *  `strategy`; not serialized. */
  stumbled?: boolean;
  /** The line's GOAP brain (not serialized directly; rebuilt from archetype+motivators on load). */
  brain?: GoapBrain<DynastyAgent>;
}

/** Each archetype's natural strategy set + which motivator axis most amplifies each strategy. */
const ARCHETYPE_STRATEGIES: Record<
  Archetype,
  ReadonlyArray<{ strategy: DynastyStrategy; axis: MotivatorAxis; dir: 1 | -1 }>
> = {
  economic: [
    { strategy: "accumulate", axis: "wealth", dir: 1 },
    { strategy: "seize_power", axis: "power", dir: 1 },
  ],
  political: [
    { strategy: "seize_power", axis: "power", dir: 1 },
    { strategy: "accumulate", axis: "wealth", dir: 1 },
  ],
  technological: [
    { strategy: "advance_knowledge", axis: "worldview", dir: 1 },
    { strategy: "accumulate", axis: "wealth", dir: 1 },
  ],
  religious: [
    { strategy: "spread_belief", axis: "worldview", dir: -1 },
    { strategy: "win_renown", axis: "reach", dir: 1 },
  ],
  entertainment: [
    { strategy: "win_renown", axis: "reach", dir: 1 },
    { strategy: "accumulate", axis: "wealth", dir: 1 },
  ],
  athletic: [
    { strategy: "win_renown", axis: "reach", dir: 1 },
    { strategy: "seize_power", axis: "power", dir: 1 },
  ],
};

/** The player line's primary strategy for its archetype — used to compute glimpse RELATION to rivals
 *  (same strategy → opposing, complementary → contributing). The archetype's first natural strategy. */
export function strategyForArchetype(archetype: Archetype): DynastyStrategy {
  return ARCHETYPE_STRATEGIES[archetype][0]?.strategy ?? "endure";
}

/** A goal that records the chosen strategy on the agent (the executed plan, deterministic). */
class StrategyGoal extends GoapGoal<DynastyAgent> {
  constructor(
    agent: DynastyAgent,
    private readonly strategy: DynastyStrategy,
  ) {
    super(agent);
  }
  override activate(): void {
    this.ownerData.strategy = this.strategy;
  }
}

/**
 * An evaluator for one strategy: desirability = how strongly the line's motivator on this
 * strategy's axis leans the strategy's direction (normalized to [0,1]). characterBias (set from
 * the dominant motivator's strength) lets a strongly-charactered line commit harder.
 */
class StrategyEvaluator extends GoapEvaluator<DynastyAgent> {
  constructor(
    private readonly strategy: DynastyStrategy,
    private readonly axis: MotivatorAxis,
    private readonly dir: 1 | -1,
    private readonly brain: GoapBrain<DynastyAgent>,
    characterBias: number,
  ) {
    super(characterBias);
  }
  score(o: DynastyAgent): number {
    // lean in the strategy's direction, mapped from [-100,100] to [0,1]; a contrary lean → ~0.
    const lean = o.motivators[this.axis] * this.dir;
    return Math.max(0, Math.min(1, (lean + 100) / 200));
  }
  apply(o: DynastyAgent): void {
    this.brain.clearSubgoals();
    this.brain.addSubgoal(new StrategyGoal(o, this.strategy));
  }
}

/** The always-available fallback: endure. Low flat desirability so it wins only when nothing else does. */
class EndureEvaluator extends GoapEvaluator<DynastyAgent> {
  constructor(private readonly brain: GoapBrain<DynastyAgent>) {
    super(1);
  }
  score(): number {
    return 0.2;
  }
  apply(o: DynastyAgent): void {
    this.brain.clearSubgoals();
    this.brain.addSubgoal(new StrategyGoal(o, "endure"));
  }
}

/** Build (or rebuild) a line's GOAP brain from its archetype + motivators. Deterministic. */
export function buildBrain(agent: DynastyAgent): GoapBrain<DynastyAgent> {
  const brain = new GoapBrain<DynastyAgent>(agent);
  // characterBias scales with how strongly-charactered the line is (dominant lean magnitude).
  const bias = 1 + Math.abs(dominantMotivator(agent.motivators).value) / 100; // 1..2
  for (const { strategy, axis, dir } of ARCHETYPE_STRATEGIES[agent.archetype]) {
    brain.withEvaluator(new StrategyEvaluator(strategy, axis, dir, brain, bias));
  }
  brain.withEvaluator(new EndureEvaluator(brain));
  agent.brain = brain;
  return brain;
}

/** Create a dynasty agent from its identity + motivators, with its brain wired. */
export function createDynastyAgent(args: {
  id: string;
  archetype: Archetype;
  motivators?: Motivators;
  rung?: number;
}): DynastyAgent {
  const agent: DynastyAgent = {
    id: args.id,
    uuid: args.id,
    archetype: args.archetype,
    motivators: args.motivators ?? initMotivators(),
    rung: args.rung ?? 0,
    strategy: null,
  };
  buildBrain(agent);
  return agent;
}

/** Advance one deterministic planning turn: the brain picks + executes the line's current strategy. */
export function advanceAgent(agent: DynastyAgent): DynastyStrategy {
  if (!agent.brain) buildBrain(agent);
  agent.brain?.tick();
  return agent.strategy ?? "endure";
}
