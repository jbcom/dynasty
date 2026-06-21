import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { applySuffix, getCulture, type KinNames, nameChild, pickGivenName } from "../onomastics";
import { createRng } from "../rng";

/**
 * FD-5 — the pure onomastics resolver: per-culture given-name pools + naming
 * conventions. Real content loads; picks are in-pool + seeded-deterministic;
 * child naming follows the culture's rule; suffixing matches the convention.
 */

const content = loadContent();
const onomastics = { cultures: content.onomastics };

describe("FD-5 onomastics content", () => {
  it("loads the seed cultures (5 modern + the Abbasid Arab deep-history culture)", () => {
    expect(new Set(Object.keys(content.onomastics))).toEqual(
      new Set([
        "irish_catholic",
        "bavarian_german",
        "afrikaner",
        "scots_irish",
        "wasp_east_coast",
        "arabic_abbasid",
      ]),
    );
  });

  it("getCulture throws on an unknown id", () => {
    expect(() => getCulture(onomastics, "atlantean")).toThrow(/unknown culture/);
  });
});

describe("FD-5 pickGivenName", () => {
  const irish = getCulture(onomastics, "irish_catholic");

  it("picks from the correct-sex pool", () => {
    for (const seed of ["a", "b", "c", "d"]) {
      expect(irish.givenMale).toContain(pickGivenName(irish, "male", createRng(seed)));
      expect(irish.givenFemale).toContain(pickGivenName(irish, "female", createRng(seed)));
    }
  });

  it("is deterministic for a given seed", () => {
    expect(pickGivenName(irish, "male", createRng("x"))).toBe(
      pickGivenName(irish, "male", createRng("x")),
    );
  });
});

describe("FD-5 nameChild — convention-driven", () => {
  const bavarian = getCulture(onomastics, "bavarian_german");
  const kin: KinNames = {
    paternalGrandfather: "Friedrich",
    paternalGrandmother: "Elisabeth",
    maternalGrandfather: "Otto",
    father: "Heinrich",
    mother: "Greta",
  };

  it("names the eldest son after the paternal grandfather (Bavarian rule)", () => {
    const r = nameChild(bavarian, { sex: "male", ordinal: 1 }, kin, createRng("s"));
    expect(r.name).toBe("Friedrich");
    expect(r.source).toBe("paternalGrandfather");
  });

  it("names the eldest daughter after the paternal grandmother (Bavarian rule)", () => {
    const r = nameChild(bavarian, { sex: "female", ordinal: 1 }, kin, createRng("s"));
    expect(r.name).toBe("Elisabeth");
  });

  it("falls back to a seeded pool pick when the kin name is unknown", () => {
    const r = nameChild(bavarian, { sex: "male", ordinal: 1 }, {}, createRng("s"));
    expect(r.source).toBeNull();
    expect(bavarian.givenMale).toContain(r.name);
  });

  it("third+ children always draw from the pool (no rule)", () => {
    const r = nameChild(bavarian, { sex: "male", ordinal: 3 }, kin, createRng("s"));
    expect(r.source).toBeNull();
    expect(bavarian.givenMale).toContain(r.name);
  });
});

describe("FD-5 applySuffix", () => {
  const wasp = getCulture(onomastics, "wasp_east_coast");
  const irish = getCulture(onomastics, "irish_catholic");

  it("WASP junior_suffix: Jr. for the second bearer, then numerals", () => {
    expect(applySuffix(wasp, "Prescott", 0)).toBe("Prescott");
    expect(applySuffix(wasp, "Prescott", 1)).toBe("Prescott Jr.");
    expect(applySuffix(wasp, "Prescott", 2)).toBe("Prescott III");
  });

  it("patronymic cultures use Roman numerals from the second bearer", () => {
    expect(applySuffix(irish, "Patrick", 0)).toBe("Patrick");
    expect(applySuffix(irish, "Patrick", 1)).toBe("Patrick II");
    expect(applySuffix(irish, "Patrick", 3)).toBe("Patrick IV");
  });
});
