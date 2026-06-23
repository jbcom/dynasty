import { describe, expect, it } from "vitest";
import { ARCHETYPES } from "../../slots";
import type { RankState } from "../../state";
import {
  lifeStageForAge,
  type PortraitArchetype,
  type RungTier,
  rungTierForRung,
  rungTierForState,
  wardrobeFor,
} from "../portraitFacets";

/**
 * EI-8b — the live-state portrait facets: LIFE-STAGE from age, RUNG TIER from the rank ladders. Pure +
 * deterministic; these feed the EI-8 composite portrait key.
 */

describe("EI-8b lifeStageForAge", () => {
  it("maps representative ages to the right stage", () => {
    expect(lifeStageForAge(0)).toBe("infant");
    expect(lifeStageForAge(6)).toBe("child");
    expect(lifeStageForAge(16)).toBe("youth");
    expect(lifeStageForAge(40)).toBe("adult");
    expect(lifeStageForAge(72)).toBe("elder");
  });

  it("places stage boundaries on the inclusive-upper-bound side", () => {
    expect(lifeStageForAge(2)).toBe("infant");
    expect(lifeStageForAge(3)).toBe("child");
    expect(lifeStageForAge(11)).toBe("child");
    expect(lifeStageForAge(12)).toBe("youth");
    expect(lifeStageForAge(19)).toBe("youth");
    expect(lifeStageForAge(20)).toBe("adult");
    expect(lifeStageForAge(64)).toBe("adult");
    expect(lifeStageForAge(65)).toBe("elder");
  });

  it("clamps a negative age to infant (the emergence opens before age 0 is meaningful)", () => {
    expect(lifeStageForAge(-1)).toBe("infant");
  });
});

describe("EI-8b rungTier", () => {
  it("collapses a rung index to low/mid/high", () => {
    expect(rungTierForRung(0)).toBe("low");
    expect(rungTierForRung(1)).toBe("low");
    expect(rungTierForRung(2)).toBe("mid");
    expect(rungTierForRung(3)).toBe("mid");
    expect(rungTierForRung(4)).toBe("high");
    expect(rungTierForRung(5)).toBe("high");
  });

  it("takes the HIGHEST current rung across the ladders (the line's peak standing on any axis)", () => {
    const ranks: Record<string, RankState> = {
      social: { rung: 1, peak: 2 },
      commercial: { rung: 4, peak: 4 },
      religious: { rung: 0, peak: 0 },
      political: { rung: 2, peak: 3 },
    };
    expect(rungTierForState(ranks)).toBe("high"); // commercial rung 4 → high
  });

  it("reads an all-bottom line as low (a line owed nothing)", () => {
    const ranks: Record<string, RankState> = {
      social: { rung: 0, peak: 0 },
      commercial: { rung: 1, peak: 1 },
    };
    expect(rungTierForState(ranks)).toBe("low");
  });

  it("reads an empty ladder set as low", () => {
    expect(rungTierForState({})).toBe("low");
  });
});

describe("EI-8c wardrobeFor", () => {
  const TIERS: RungTier[] = ["low", "mid", "high"];
  const PORTRAIT_ARCHETYPES: PortraitArchetype[] = [...ARCHETYPES, "crime"];

  it("covers every (archetype × tier) — 7 archetypes (the 6 + crime) × 3 tiers = 21 registers", () => {
    expect(PORTRAIT_ARCHETYPES).toHaveLength(7);
    const all = new Set<string>();
    for (const a of PORTRAIT_ARCHETYPES) {
      for (const t of TIERS) {
        const w = wardrobeFor(a, t);
        expect(w, `${a}/${t} has a wardrobe register`).toMatch(/\S/);
        all.add(`${a}:${t}`);
      }
    }
    expect(all.size).toBe(21);
  });

  it("DEEPENS with the rung tier within an archetype (low ≠ mid ≠ high)", () => {
    for (const a of PORTRAIT_ARCHETYPES) {
      const [lo, mid, hi] = [wardrobeFor(a, "low"), wardrobeFor(a, "mid"), wardrobeFor(a, "high")];
      expect(new Set([lo, mid, hi]).size, `${a} scales across tiers`).toBe(3);
    }
  });

  it("the high-rung registers read as the user's named paths (CEO, celebrity, cult-leader, crime boss)", () => {
    expect(wardrobeFor("economic", "high")).toMatch(/magnate|CEO/i);
    expect(wardrobeFor("entertainment", "high")).toMatch(/celebrity|icon/i);
    expect(wardrobeFor("religious", "high")).toMatch(/cult-leader|prelate|vestments/i);
    expect(wardrobeFor("crime", "high")).toMatch(/crime boss|sovereign/i);
  });
});
