import { describe, expect, it } from "vitest";
import {
  ButterflyRulesSchema,
  EraIndexSchema,
  MetersFileSchema,
} from "../../sim/schema";
import butterflyJson from "../butterfly-rules.json";
import indexJson from "../eras/index.json";
import metersJson from "../meters.json";

describe("F0 data files", () => {
  it("meters.json defines the six meters and validates", () => {
    const meters = MetersFileSchema.parse(metersJson);
    expect(meters.meters.map((m) => m.id).sort()).toEqual([
      "health",
      "heat",
      "loyalty",
      "money",
      "power",
      "reputation",
    ]);
  });

  it("eras/index.json validates and orders all 10 eras", () => {
    const index = EraIndexSchema.parse(indexJson);
    expect(index.eras).toHaveLength(10);
    const orders = index.eras.map((e) => e.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    // Eras 7-10 are extrapolated; 8-9 are Star Trek inspired.
    const byId = Object.fromEntries(index.eras.map((e) => [e.id, e]));
    expect(byId.victory?.extrapolated).toBe(true);
    expect(byId.atomic?.startrekInspired).toBe(true);
    expect(byId.unification?.startrekInspired).toBe(true);
  });

  it("butterfly-rules.json validates", () => {
    const rules = ButterflyRulesSchema.parse(butterflyJson);
    expect(rules.rules.length).toBeGreaterThan(0);
    for (const r of rules.rules) {
      expect(r.chainTemplate.length).toBeGreaterThan(0);
    }
  });
});
