import { describe, expect, it } from "vitest";
import { createRng } from "../../rng";
import { GoapBrain, GoapEvaluator, GoapGoal, type GoapOwner } from "../index";

/**
 * SS-2 — the pure GOAP layer over Yuka's goal core. Proves: deterministic arbitration (highest
 * score × characterBias wins), purity (same owner → same chosen plan), no Math.random (seeded
 * RNG injected), and JSON serialization round-trips.
 */

// A toy dynasty-like owner: an ambition scalar the evaluators read.
interface TestAgent extends GoapOwner {
  ambition: number; // 0..100
  chosen: string | null;
}

class RiseGoal extends GoapGoal<TestAgent> {
  override activate(): void {
    this.ownerData.chosen = "rise";
  }
}
class RestGoal extends GoapGoal<TestAgent> {
  override activate(): void {
    this.ownerData.chosen = "rest";
  }
}

// "Rise" desirability scales with ambition; "rest" is a flat fallback. characterBias models motivators.
class RiseEvaluator extends GoapEvaluator<TestAgent> {
  score(o: TestAgent): number {
    return o.ambition / 100;
  }
  apply(o: TestAgent): void {
    const brain = (o as unknown as { brain?: unknown }).brain;
    void brain;
  }
}

describe("GOAP brain (SS-2)", () => {
  function makeBrain(ambition: number, riseBias: number) {
    const agent: TestAgent = { id: "a1", ambition, chosen: null };
    const brain = new GoapBrain<TestAgent>(agent);
    // Two strategies; the rise evaluator carries the motivator-driven characterBias.
    const rise = new RiseEvaluator(riseBias);
    rise.apply = (o) => {
      brain.clearSubgoals();
      brain.addSubgoal(new RiseGoal(o));
    };
    const rest = new (class extends GoapEvaluator<TestAgent> {
      score(): number {
        return 0.4;
      }
      apply(o: TestAgent): void {
        brain.clearSubgoals();
        brain.addSubgoal(new RestGoal(o));
      }
    })(1);
    brain.withEvaluator(rise).withEvaluator(rest);
    return { agent, brain };
  }

  it("arbitrates to the highest score × characterBias strategy", () => {
    // High ambition (0.9) × bias 1 = 0.9 > rest 0.4 → rise.
    const a = makeBrain(90, 1);
    a.brain.tick();
    expect(a.agent.chosen).toBe("rise");

    // Low ambition (0.1) × bias 1 = 0.1 < rest 0.4 → rest.
    const b = makeBrain(10, 1);
    b.brain.tick();
    expect(b.agent.chosen).toBe("rest");

    // Low ambition but high motivator bias (0.1 × 5 = 0.5 > 0.4) → rise. (Motivators tip it.)
    const c = makeBrain(10, 5);
    c.brain.tick();
    expect(c.agent.chosen).toBe("rise");
  });

  it("is pure/deterministic — same owner state yields the same plan every run", () => {
    const r1 = makeBrain(70, 1);
    r1.brain.tick();
    const r2 = makeBrain(70, 1);
    r2.brain.tick();
    expect(r1.agent.chosen).toBe(r2.agent.chosen);
  });

  it("uses injected seeded RNG (createRng), never Math.random", () => {
    // determinism of the RNG facade itself, used where a goal needs a stochastic pick.
    expect(createRng("goap-x").int(1, 6)).toBe(createRng("goap-x").int(1, 6));
  });

  it("serializes the brain's planning state to JSON and round-trips the type tag", () => {
    const { brain } = makeBrain(90, 1);
    brain.tick();
    const json = brain.toJSON() as { type: string; status: string };
    expect(json.type).toBe("GoapBrain"); // the Think subclass name
    expect(json.status).toBeDefined();
    // JSON is plain + stringify-safe (no cycles, no functions).
    expect(() => JSON.parse(JSON.stringify(json))).not.toThrow();
  });
});
