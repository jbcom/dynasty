import { describe, expect, it } from "vitest";
import {
  assertEraDecisionVariety,
  DYNASTY_SPINE,
  pivotalArchitecture,
  spineActForGen,
} from "../spineAuthored";

/**
 * FS-3: the authored dynasty spine replaces the 504-cell generator. These tests pin the structural
 * contracts that BREAK the sameness — most importantly, that no two consecutive eras present the same
 * SHAPE of decision (the thing the single-template generator could not guarantee).
 */

describe("authored dynasty spine (FS-3)", () => {
  it("spans founding → stars as one continuous line (gens 0..N, ascending years)", () => {
    // One line, contiguous generations.
    expect(DYNASTY_SPINE[0]?.gen).toBe(0);
    DYNASTY_SPINE.forEach((a, i) => {
      expect(a.gen).toBe(i);
    });
    // Founded at the founding; reaches the stellar era.
    expect(DYNASTY_SPINE[0]?.macroAct).toBe("founding");
    expect(DYNASTY_SPINE.at(-1)?.macroAct).toBe("ascension");
    // Years strictly ascend (the spine clock moves forward, generation by generation).
    for (let i = 1; i < DYNASTY_SPINE.length; i++) {
      expect(DYNASTY_SPINE[i]!.year).toBeGreaterThan(DYNASTY_SPINE[i - 1]!.year);
    }
  });

  it("ANTI-SAMENESS: no two consecutive eras share a pivotal decision architecture", () => {
    // The core FS-3 invariant — the data-level guarantee against the 504× one-template fork.
    expect(assertEraDecisionVariety()).toEqual([]);
  });

  it("uses a genuinely DIVERSE set of decision architectures across the spine", () => {
    const pivots = DYNASTY_SPINE.map(pivotalArchitecture).filter(Boolean);
    const distinct = new Set(pivots);
    // Not one template re-skinned — several structurally-different decision shapes are in play.
    expect(distinct.size).toBeGreaterThanOrEqual(5);
  });

  it("every act except the terminal one ends on a succession beat (the dynastic fork)", () => {
    for (const act of DYNASTY_SPINE.slice(0, -1)) {
      expect(act.beats.at(-1)).toBe("succession");
    }
    // The terminal stellar act resolves into the ending (expansion gambit), not a succession.
    expect(DYNASTY_SPINE.at(-1)?.beats).toContain("expansion");
  });

  it("recurring architectures (e.g. allegiance) never appear back-to-back", () => {
    // allegiance is used 3× (revolution / civil war / labor) — distinct CONTEXTS, never consecutive.
    const allegianceGens = DYNASTY_SPINE.filter((a) => pivotalArchitecture(a) === "allegiance").map(
      (a) => a.gen,
    );
    expect(allegianceGens.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < allegianceGens.length; i++) {
      expect(allegianceGens[i]! - allegianceGens[i - 1]!).toBeGreaterThan(1);
    }
  });

  it("spineActForGen resolves by generation", () => {
    expect(spineActForGen(0)?.era).toBe("The Founding");
    expect(spineActForGen(999)).toBeUndefined();
  });
});
