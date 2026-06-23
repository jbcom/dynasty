import { describe, expect, it } from "vitest";
import {
  FOUNDING_REGIONS,
  type FoundingOriginChoice,
  POWER_BASES,
  powerBaseDef,
  regionDef,
  resolveFoundingStart,
  startRungForStanding,
} from "../foundingOrigin";
import { MOTIVATOR_AXES } from "../motivators";

/**
 * FS-ONB-DRIFT — the founding-origin resolver replaces the immigration-wave funnel for the PLAYER.
 * A (region × power-base × standing) selection resolves deterministically to starting motivators, the
 * archetype coloring, the class rung, and seed flags. Grounded in the founding-era research.
 */

describe("foundingOrigin catalog", () => {
  it("offers exactly three regions and six power bases", () => {
    expect(FOUNDING_REGIONS.map((r) => r.id)).toEqual(["new_england", "mid_atlantic", "south"]);
    expect(POWER_BASES.map((b) => b.id)).toEqual([
      "land",
      "commerce",
      "pulpit",
      "law",
      "press",
      "military",
    ]);
  });

  it("each base maps to a distinct-enough archetype coloring of the one spine", () => {
    expect(powerBaseDef("pulpit").archetype).toBe("religious");
    expect(powerBaseDef("law").archetype).toBe("political");
    expect(powerBaseDef("press").archetype).toBe("entertainment");
    expect(powerBaseDef("military").archetype).toBe("athletic");
    // Land + commerce are both economic (the two wealth bases) — that's intentional, not a bug.
    expect(powerBaseDef("land").archetype).toBe("economic");
    expect(powerBaseDef("commerce").archetype).toBe("economic");
  });

  it("every region names native bases drawn from the real power-base set", () => {
    const baseIds = new Set(POWER_BASES.map((b) => b.id));
    for (const r of FOUNDING_REGIONS) {
      expect(r.nativeBases.length).toBeGreaterThan(0);
      for (const b of r.nativeBases) expect(baseIds.has(b)).toBe(true);
    }
  });

  it("lookups throw on unknown ids", () => {
    // @ts-expect-error — deliberate bad id
    expect(() => regionDef("atlantis")).toThrow();
    // @ts-expect-error — deliberate bad id
    expect(() => powerBaseDef("piracy")).toThrow();
  });
});

describe("resolveFoundingStart", () => {
  const choice: FoundingOriginChoice = {
    region: "south",
    base: "land",
    standing: "established",
  };

  it("is pure + deterministic (same selection → identical seed)", () => {
    expect(resolveFoundingStart(choice)).toEqual(resolveFoundingStart(choice));
  });

  it("seeds the base's archetype + a wealth-led profile for a landed Southern planter", () => {
    const start = resolveFoundingStart(choice);
    expect(start.archetype).toBe("economic");
    // Land base (+wealth30, +lineage20) + South (+wealth15, +lineage15) + established (+wealth20,+lineage10).
    expect(start.motivators.wealth).toBeGreaterThan(40);
    expect(start.motivators.lineage).toBeGreaterThan(30);
  });

  it("established founders start a rung up; rising founders start at the bottom + hungrier", () => {
    expect(startRungForStanding("established")).toBe(2);
    expect(startRungForStanding("rising")).toBe(0);
    const rising = resolveFoundingStart({
      region: "new_england",
      base: "pulpit",
      standing: "rising",
    });
    const established = resolveFoundingStart({
      region: "new_england",
      base: "pulpit",
      standing: "established",
    });
    expect(rising.classState.rung).toBe(0);
    expect(established.classState.rung).toBe(2);
    // Rising starts poorer than established (capital-gated mobility).
    expect(rising.motivators.wealth).toBeLessThan(established.motivators.wealth);
  });

  it("a pulpit founder is faith-led (worldview toward faith), a press founder is reach-led", () => {
    const minister = resolveFoundingStart({
      region: "new_england",
      base: "pulpit",
      standing: "rising",
    });
    const printer = resolveFoundingStart({
      region: "mid_atlantic",
      base: "press",
      standing: "rising",
    });
    expect(minister.motivators.worldview).toBeLessThan(0); // faith pole
    expect(printer.motivators.reach).toBeGreaterThan(20); // expansive pole
  });

  it("stamps region + base + standing seed flags for spine/branch coloring", () => {
    const start = resolveFoundingStart(choice);
    expect(start.flags).toContain("region:south");
    expect(start.flags).toContain("base:land");
    expect(start.flags).toContain("power:land");
    expect(start.flags).toContain("standing:established");
  });

  it("clamps every motivator axis into [-100, 100]", () => {
    for (const region of FOUNDING_REGIONS) {
      for (const base of POWER_BASES) {
        for (const standing of ["established", "rising"] as const) {
          const m = resolveFoundingStart({ region: region.id, base: base.id, standing }).motivators;
          for (const axis of MOTIVATOR_AXES) {
            expect(m[axis]).toBeGreaterThanOrEqual(-100);
            expect(m[axis]).toBeLessThanOrEqual(100);
          }
        }
      }
    }
  });
});
