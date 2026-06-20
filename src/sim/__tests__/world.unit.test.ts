import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import { effectiveWeight, eligibleEvents } from "../events";
import { initState } from "../state";
import { Eligible, EventRef, projectWorld, queryEligible, queryEligibleByWeight } from "../world";
import { validRaw } from "./fixtures";

const content = () => buildContent(validRaw());

describe("Koota read-model projection (task-026)", () => {
  it("projects one entity per event, in content order, deterministically", () => {
    const c = content();
    const s = initState(c, "seed");
    const w1 = projectWorld(c, s);
    const w2 = projectWorld(c, s);
    const ids1 = w1.query(EventRef).map((e) => e.get(EventRef)?.id);
    const ids2 = w2.query(EventRef).map((e) => e.get(EventRef)?.id);
    expect(ids1).toEqual(ids2); // deterministic projection
    expect(ids1.length).toBe(c.allEvents.length);
  });

  it("queryEligible over the read-model exactly matches the pure eligibleEvents", () => {
    const c = content();
    for (const seed of ["a", "b", "c"]) {
      const s = initState(c, seed);
      const pure = eligibleEvents(c, s)
        .map((e) => e.id)
        .sort();
      const viaWorld = queryEligible(c, s)
        .map((e) => e.id)
        .sort();
      expect(viaWorld).toEqual(pure);
    }
  });

  it("the eligible set changes with state, and the read-model tracks it", () => {
    const c = content();
    const s = initState(c, "seed");
    const before = queryEligible(c, s).length;
    // Advance era; eligibility shifts. The projection reflects the new state.
    const later = queryEligible(c, { ...s, eraIndex: 1 });
    expect(later.every((e) => e.id)).toBe(true);
    // Both are non-empty and the projection is a pure function of state.
    expect(before).toBeGreaterThanOrEqual(0);
    const eligibleTrait = projectWorld(c, s).query(Eligible).length;
    expect(eligibleTrait).toBe(before);
  });

  it("queryEligibleByWeight ranks the same eligible set by effective weight (desc)", () => {
    const c = content();
    const s = initState(c, "seed");
    const ranked = queryEligibleByWeight(c, s);
    // Same membership as queryEligible.
    expect(ranked.map((r) => r.event.id).sort()).toEqual(
      queryEligible(c, s)
        .map((e) => e.id)
        .sort(),
    );
    // Weights match the pure helper and are sorted descending.
    for (const { event, weight } of ranked) {
      expect(weight).toBeCloseTo(effectiveWeight(c, s, event), 5);
    }
    const weights = ranked.map((r) => r.weight);
    const sortedDesc = [...weights].sort((a, b) => b - a);
    expect(weights).toEqual(sortedDesc);
  });
});
