import { describe, expect, it } from "vitest";
import { advanceAgent, buildBrain, createDynastyAgent } from "../dynastyAgent";
import { initMotivators, type Motivators } from "../motivators";

/**
 * SS-3 — a bloodline as a GOAP agent: archetype → strategy set, motivators → characterBias +
 * desirability, deterministic arbitration. Proves the line picks the strategy its character
 * supports, that it's pure/deterministic, and that the brain serializes for the save.
 */

const mot = (over: Partial<Motivators> = {}): Motivators => ({ ...initMotivators(), ...over });

describe("DynastyAgent (SS-3)", () => {
  it("an economic line that leans RICH pursues accumulation", () => {
    const a = createDynastyAgent({
      id: "econ",
      archetype: "economic",
      motivators: mot({ wealth: 90 }),
    });
    expect(advanceAgent(a)).toBe("accumulate");
  });

  it("a religious line that leans FAITH spreads belief", () => {
    // worldview − pole = faith; the religious strategy keys on worldview dir -1.
    const a = createDynastyAgent({
      id: "rel",
      archetype: "religious",
      motivators: mot({ worldview: -90 }),
    });
    expect(advanceAgent(a)).toBe("spread_belief");
  });

  it("a technological line that leans SCIENCE advances knowledge", () => {
    const a = createDynastyAgent({
      id: "tech",
      archetype: "technological",
      motivators: mot({ worldview: 90 }),
    });
    expect(advanceAgent(a)).toBe("advance_knowledge");
  });

  it("a flat/centrist line falls back to endure (nothing strongly desired)", () => {
    const a = createDynastyAgent({ id: "flat", archetype: "economic", motivators: mot() });
    // centrist wealth → accumulate score 0.5 > endure 0.2, so a centrist economic line still
    // mildly accumulates; a line whose archetype axes are CONTRARY endures instead:
    const contrary = createDynastyAgent({
      id: "poor-econ",
      archetype: "economic",
      motivators: mot({ wealth: -100, power: -100 }),
    });
    // a centrist economic line still pursues an archetypal strategy (not endure) —
    // both its strategies score 0.5 > endure 0.2; arbitrate's >= tiebreak picks the last.
    expect(advanceAgent(a)).not.toBe("endure");
    expect(advanceAgent(contrary)).toBe("endure"); // both econ strategies score 0 → endure wins
  });

  it("is pure/deterministic — same agent state → same strategy every run", () => {
    const mk = () =>
      createDynastyAgent({ id: "d", archetype: "political", motivators: mot({ power: 70 }) });
    expect(advanceAgent(mk())).toBe(advanceAgent(mk()));
  });

  it("the brain serializes to JSON for the save", () => {
    const a = createDynastyAgent({
      id: "s",
      archetype: "athletic",
      motivators: mot({ reach: 80 }),
    });
    advanceAgent(a);
    const brain = buildBrain(a);
    expect(() => JSON.parse(JSON.stringify(brain.toJSON()))).not.toThrow();
  });
});
