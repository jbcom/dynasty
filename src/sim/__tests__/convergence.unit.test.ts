import { describe, expect, it } from "vitest";
import {
  type ConvergenceContext,
  ENDINGS,
  endingColoring,
  resolveConvergence,
} from "../convergence";
import { applyMotivators, initMotivators, type Motivators } from "../motivators";

/** SS-9 — the shared convergence ending lattice: destination × motivator coloring, motivator-gated, others' fates folded in. */

const mot = (over: Partial<Motivators> = {}): Motivators => applyMotivators(initMotivators(), over);
const ctx = (over: Partial<ConvergenceContext> = {}): ConvergenceContext => ({
  motivators: mot(),
  tier: 5,
  survived: true,
  hasHeir: true,
  rivalsReachedStars: false,
  ...over,
});

describe("convergence endings (SS-9)", () => {
  it("the lattice spans the four destinations with star colorings + sub-variants", () => {
    const dests = new Set(ENDINGS.map((e) => e.destination));
    expect(dests).toEqual(new Set(["stars", "contributed", "earthbound", "extinguished"]));
    expect(ENDINGS.filter((e) => e.destination === "stars").length).toBeGreaterThanOrEqual(6);
    expect(ENDINGS.length).toBeGreaterThanOrEqual(12);
  });

  it("a power+cunning line at the stars reaches a Conquest ending", () => {
    const e = resolveConvergence(ctx({ motivators: mot({ power: 70, honor: 60 }) }));
    expect(e.id).toMatch(/^stars_conquest/);
  });

  it("a community line CANNOT reach a conquest ending — it reaches the Commonwealth", () => {
    const e = resolveConvergence(ctx({ motivators: mot({ power: -70, reach: 40 }) }));
    expect(e.destination).toBe("stars");
    expect(e.id).toMatch(/^stars_commonwealth/);
    expect(e.id).not.toMatch(/conquest/);
  });

  it("a faith line carries the Covenant outward", () => {
    const e = resolveConvergence(ctx({ motivators: mot({ worldview: -70, reach: 50 }) }));
    expect(e.id).toMatch(/^stars_covenant/);
  });

  it("not surviving → extinguished (no-heir vs ruin)", () => {
    expect(resolveConvergence(ctx({ survived: false, hasHeir: false })).id).toBe(
      "extinguished_no_heir",
    );
    expect(resolveConvergence(ctx({ survived: false, hasHeir: true })).id).toBe(
      "extinguished_ruin",
    );
  });

  it("high tier + a rival reached the stars → contributed (the others' fate folds in)", () => {
    const e = resolveConvergence(
      ctx({ tier: 4, motivators: mot({ reach: 40 }), rivalsReachedStars: true }),
    );
    expect(e.destination).toBe("contributed");
  });

  it("survived but grounded (low tier) → earthbound", () => {
    const e = resolveConvergence(ctx({ tier: 2, motivators: mot({ lineage: 40 }) }));
    expect(e.destination).toBe("earthbound");
  });

  it("is deterministic + colors by the dominant motivator", () => {
    const c = ctx({ motivators: mot({ power: 70, honor: 60 }) });
    expect(resolveConvergence(c)).toEqual(resolveConvergence(c));
    expect(endingColoring(mot({ worldview: -80 }))).toBe("faith");
  });
});
