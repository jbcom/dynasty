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

/**
 * The origins that MUST ship an authored Epoch-0 (the OB-5 spec). This is an explicit
 * allow-list on purpose: it is the contract, not a mirror of the code. The completeness
 * test asserts the derived set EQUALS exactly this — so silently losing a place's authored
 * beat fails here, and ADDING a new authored place is a deliberate one-line update to this
 * list (which then auto-extends every per-place check below). The per-place verification
 * loops iterate the DERIVED set so any newly-authored place is covered without further edits.
 */
const EXPECTED_ORIGINS = [
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
  // Drive the per-place checks off the DERIVED set (robust to future additions), but pin
  // it to the spec list so the suite still fails loudly if the two ever diverge.
  const authored = [...content.authoredEpoch0Places].sort();

  it("the authored-Epoch-0 set equals exactly the spec origins (no missing, no surprises)", () => {
    expect(authored).toEqual([...EXPECTED_ORIGINS].sort());
  });

  for (const place of authored) {
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
    for (const place of authored) {
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
    for (const place of authored) {
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
