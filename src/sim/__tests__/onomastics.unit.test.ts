import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import {
  applySuffix,
  dealFoundingSurname,
  getCulture,
  type KinNames,
  nameChild,
  pickGivenName,
  suggestGivenNames,
} from "../onomastics";
import { createRng } from "../rng";

/**
 * FD-5 — the pure onomastics resolver: per-culture given-name pools + naming
 * conventions. Real content loads; picks are in-pool + seeded-deterministic;
 * child naming follows the culture's rule; suffixing matches the convention.
 */

const content = loadContent();
const onomastics = { cultures: content.onomastics };

describe("FD-5 onomastics content", () => {
  it("loads the immigration-wave cultures (Convergence Saga roster)", () => {
    expect(new Set(Object.keys(content.onomastics))).toEqual(
      new Set([
        "irish_catholic",
        "bavarian_german",
        "afrikaner",
        "scots_irish",
        "anglo_protestant",
        "arabic_abbasid",
        "italian",
        "ashkenazi_jewish",
        "scandinavian",
        "chinese",
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

  it("ONO-DEDUP: never returns a given name equal to the excluded surname", () => {
    // Pick whatever the seed would draw, then exclude it — the result must differ (pool has alternatives).
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const drawn = pickGivenName(irish, "male", createRng(seed));
      const deduped = pickGivenName(irish, "male", createRng(seed), drawn);
      expect(deduped).not.toBe(drawn);
      expect(irish.givenMale).toContain(deduped);
    }
  });
});

describe("EI-6b dealFoundingSurname", () => {
  it("deals a non-empty family name from the seed", () => {
    const s = dealFoundingSurname(createRng("run1"));
    expect(s).toMatch(/\S/);
  });

  it("is deterministic for a given seed (provisional == final founding name)", () => {
    // The OpeningScreen provisional and App's final founding both deal with `${seed}::founding:surname`;
    // they MUST agree so the naming beat speaks the exact name the founded line carries.
    expect(dealFoundingSurname(createRng("seedA::founding:surname"))).toBe(
      dealFoundingSurname(createRng("seedA::founding:surname")),
    );
  });

  it("varies across seeds (different lines get different houses)", () => {
    const names = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h"].map((s) => dealFoundingSurname(createRng(s))),
    );
    // The neutral pool has 8 names; 8 distinct seeds should surface more than one house.
    expect(names.size).toBeGreaterThan(1);
  });
});

describe("ONO-DEDUP suggestGivenNames", () => {
  const irish = getCulture(onomastics, "irish_catholic");

  it("never offers a given name equal to the excluded surname", () => {
    // Exclude the first name the un-excluded offer would surface; it must be absent from the deduped offer.
    const plain = suggestGivenNames(irish, "male", createRng("dd"), 3);
    const exclude = plain[0];
    if (!exclude) throw new Error("no suggestions");
    const deduped = suggestGivenNames(irish, "male", createRng("dd"), 3, exclude);
    expect(deduped).not.toContain(exclude);
    expect(deduped.length).toBeGreaterThan(0);
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
  const anglo = getCulture(onomastics, "anglo_protestant");
  const irish = getCulture(onomastics, "irish_catholic");

  it("anglo-protestant junior_suffix: Jr. for the second bearer, then numerals", () => {
    expect(applySuffix(anglo, "Prescott", 0)).toBe("Prescott");
    expect(applySuffix(anglo, "Prescott", 1)).toBe("Prescott Jr.");
    expect(applySuffix(anglo, "Prescott", 2)).toBe("Prescott III");
  });

  it("patronymic cultures use Roman numerals from the second bearer", () => {
    expect(applySuffix(irish, "Patrick", 0)).toBe("Patrick");
    expect(applySuffix(irish, "Patrick", 1)).toBe("Patrick II");
    expect(applySuffix(irish, "Patrick", 3)).toBe("Patrick IV");
  });
});
