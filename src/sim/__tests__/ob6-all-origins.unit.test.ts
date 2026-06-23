import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { loadSaga } from "../../data/loadSaga";
import { foundByComposition } from "../founding";
import { tracePlaythrough, validateTrace } from "../harness";
import { createRng } from "../rng";
import { actsForTier } from "../saga/player";

/**
 * Convergence roster acceptance (post-NA-11): every immigration-WAVE place (places.json kind:"wave")
 * must (1) found a leak-free run and trace to the far future without a preset-person leak, and
 * (2) have a SAGA act for its tier-0 opening — the novel's first chapter (the played story is the
 * saga acts now, not the retired Epoch-0 event chain). This pins the whole played-narrative surface
 * so a regression in any single wave's coverage is caught.
 */
describe("Convergence roster: every wave founds leak-free + has a saga act", () => {
  const content = loadContent();
  const saga = loadSaga();
  const rosterIds = new Set(content.places.map((p) => p.id));
  // Only the immigration-WAVE places carry corpus saga acts. Destination grounds and the
  // FS-ONB-DRIFT founding-region places (kind:"founding") are not waves and have no cell-lattice acts.
  const wavePlaces = content.places.filter((p) => p.kind === "wave").map((p) => p.id);

  it("the roster has the expected immigration waves", () => {
    for (const wave of [
      "ireland",
      "bavaria",
      "italian",
      "ashkenazi_jewish",
      "scandinavian",
      "chinese",
      "baghdad",
    ]) {
      expect(rosterIds.has(wave), wave).toBe(true);
    }
    // dropped lines are gone.
    expect(rosterIds.has("south_africa")).toBe(false);
  });

  it("every wave place founds + traces leak-free", () => {
    for (const place of wavePlaces) {
      const def = content.places.find((p) => p.id === place);
      if (!def) continue;
      const era = def.validEras[0];
      if (!era) continue;
      const comp = {
        place,
        era,
        culture: def.defaultCulture,
        year: era === "caliphate" ? 762 : 1885,
        archetype: "economic" as const,
        gender: "male" as const,
        surname: "Verifier",
        seed: `wave-${place}`,
        originId: `composed:${place}:${era}`,
      };
      const founded = foundByComposition(content, comp).state;
      expect(founded.flags, place).toContain("founded_line");
      // NA-11: founding no longer pre-sets emerged/named or stamps has_authored_epoch0.
      expect(founded.flags, place).not.toContain("has_authored_epoch0");
      const trace = tracePlaythrough(content, comp);
      expect(
        validateTrace(trace).filter((f) => f.kind === "leak"),
        place,
      ).toEqual([]);
    }
  });

  it("every wave place opens on a saga act (the novel's tier-0 chapter) for the economic line", () => {
    for (const place of wavePlaces) {
      const act = actsForTier(saga, place, "economic", 0);
      expect(act, `${place} has no tier-0 economic saga act`).toBeDefined();
      // the act's opening scene is multi-paragraph novel prose, not a fragment.
      const openId = act?.scenes[0];
      const open = openId ? saga.scenes.get(openId) : undefined;
      expect(open?.prose.length, `${place} opening`).toBeGreaterThanOrEqual(2);
    }
  });
});

// keep createRng import meaningful (determinism spot-check)
describe("founding is deterministic per place", () => {
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
