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

describe("convergence endings (SS-9 + FS-6b destinies)", () => {
  it("the lattice spans the four destinations with the three stellar finales + named destinies", () => {
    const dests = new Set(ENDINGS.map((e) => e.destination));
    expect(dests).toEqual(new Set(["stars", "contributed", "earthbound", "extinguished"]));
    // FS-6b: exactly three distinct STELLAR finales (allies / conquest / hidden).
    const stellar = new Set(ENDINGS.filter((e) => e.destination === "stars").map((e) => e.destiny));
    expect(stellar).toEqual(new Set(["stellar_allies", "stellar_conquest", "stellar_hidden"]));
    // The named earthly destinies are all present.
    const destinies = new Set(ENDINGS.map((e) => e.destiny));
    for (const d of [
      "religious_leader",
      "communard",
      "dictator",
      "oligarch",
      "crime_leader",
      "media_mogul",
    ])
      expect(destinies).toContain(d);
  });

  it("a power+low-honor line at the stars SEIZES COLONIES (stellar conquest)", () => {
    const e = resolveConvergence(ctx({ motivators: mot({ power: 70, honor: -40 }) }));
    expect(e.destiny).toBe("stellar_conquest");
  });

  it("a reach+honor line at the stars FORGES ALLIES (stellar covenant)", () => {
    const e = resolveConvergence(ctx({ motivators: mot({ reach: 60, honor: 40 }) }));
    expect(e.destiny).toBe("stellar_allies");
  });

  it("a star-tier line clearing no other finale ends ALONE on a quiet world (hidden)", () => {
    // Neutral motivators at the stars → the catch-all hidden finale.
    const e = resolveConvergence(ctx({ motivators: mot({}) }));
    expect(e.destiny).toBe("stellar_hidden");
  });

  it("FS-6b: a high-tier power+low-honor line that didn't reach the stars crowns a DICTATOR destiny", () => {
    const e = resolveConvergence(ctx({ tier: 4, motivators: mot({ power: 70, honor: -30 }) }));
    expect(e.destiny).toBe("dictator");
  });

  it("FS-6b: a high-tier wealth line crowns an OLIGARCH destiny", () => {
    const e = resolveConvergence(ctx({ tier: 3, motivators: mot({ wealth: 70 }) }));
    expect(e.destiny).toBe("oligarch");
  });

  it("FS-6b: a high-tier faith line crowns a RELIGIOUS-LEADER destiny", () => {
    const e = resolveConvergence(ctx({ tier: 3, motivators: mot({ worldview: -70 }) }));
    expect(e.destiny).toBe("religious_leader");
  });

  it("UQ-3: a high-tier power+cunning line built OUTSIDE THE LAW crowns a CRIME-LEADER destiny", () => {
    // crime_leader gate: power>=35, worldview<=-10. Honor POSITIVE (toward the honor pole, value>0) so it
    // does NOT match the earlier dictator destiny (which needs honor<=0) — proving crime_leader is its own
    // reachable fate, not shadowed by dictator/oligarch. ([[crime-power-axis]])
    const e = resolveConvergence(
      ctx({ tier: 3, motivators: mot({ power: 50, worldview: -40, honor: 30, wealth: 10 }) }),
    );
    expect(e.destiny).toBe("crime_leader");
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
