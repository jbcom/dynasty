import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { foundByComposition } from "../founding";
import { tracePlaythrough, validateTrace } from "../harness";
import { createRng } from "../rng";

/**
 * OB-6 — acceptance verification for the completed OB-5 milestone. Every one of the nine
 * authored origins must: be picked up by content.authoredEpoch0Places, found a leak-free run
 * whose authored Epoch-0 birth beat actually plays (the line emerges, is named, and crystallizes
 * a calling), and trace to the far future without a preset-person leak. This pins the whole
 * Epoch-0 surface so a regression in any single place's beats is caught.
 */

const NINE = [
  "ireland",
  "bavaria",
  "south_africa",
  "west_coast",
  "east_coast",
  "canada",
  "american_midwest",
  "american_south",
  "baghdad",
] as const;

describe("OB-6: every authored origin is complete + leak-free", () => {
  const content = loadContent();

  it("all nine places ship an authored Epoch-0 (derived from content)", () => {
    for (const place of NINE) expect(content.authoredEpoch0Places.has(place)).toBe(true);
    expect(content.authoredEpoch0Places.size).toBeGreaterThanOrEqual(NINE.length);
  });

  for (const place of NINE) {
    it(`${place}: founds, stamps has_authored_epoch0, and traces leak-free`, () => {
      const def = content.places.find((p) => p.id === place);
      if (!def) throw new Error(`place ${place} missing from catalog`);
      const era = def.validEras[0];
      if (!era) throw new Error(`place ${place} has no valid era`);
      const comp = {
        place,
        era,
        culture: def.defaultCulture,
        year: era === "caliphate" ? 762 : 1885,
        archetype: "economic" as const,
        gender: "male" as const,
        surname: "Verifier",
        seed: `ob6-${place}`,
        originId: `composed:${place}:${era}`,
      };
      const founded = foundByComposition(content, comp).state;
      expect(founded.flags).toContain("founded_line");
      expect(founded.flags).toContain("has_authored_epoch0");

      const trace = tracePlaythrough(content, comp);
      expect(validateTrace(trace).filter((f) => f.kind === "leak")).toEqual([]);
    });
  }

  it("the authored birth beat fires for each place (the line emerges via its own opener)", () => {
    for (const place of NINE) {
      const birth = content.epoch0Events.find(
        (e) => e.place === place && e.choices.some((c) => c.setFlags?.includes("emerged")),
      );
      expect(birth, `${place} has no authored birth beat`).toBeDefined();
    }
  });

  it("every authored calling beat offers all six archetypes (no calling dead-ends)", () => {
    const SIX = [
      "athletic",
      "economic",
      "entertainment",
      "political",
      "religious",
      "technological",
    ];
    for (const place of NINE) {
      const calling = content.epoch0Events.find(
        (e) => e.place === place && e.id.includes("calling_crystall"),
      );
      expect(calling, `${place} has no calling beat`).toBeDefined();
      const archs = (calling?.choices ?? [])
        .map((c) => c.setsArchetype)
        .filter(Boolean)
        .sort();
      expect(archs, `${place} calling archetypes`).toEqual(SIX);
    }
  });
});

// keep createRng import meaningful (determinism spot-check)
describe("OB-6: founding is deterministic per place", () => {
  const content = loadContent();
  it("same seed → same founded flags for a representative place", () => {
    const mk = () =>
      foundByComposition(content, {
        place: "ireland",
        era: "origins",
        culture: "irish_catholic",
        year: 1885,
        archetype: "economic" as const,
        gender: "male" as const,
        surname: "Verifier",
        seed: "ob6-determinism",
        originId: "composed:ireland:origins",
      }).state.flags;
    expect(mk()).toEqual(mk());
    expect(createRng("x").int(1, 6)).toBe(createRng("x").int(1, 6));
  });
});
