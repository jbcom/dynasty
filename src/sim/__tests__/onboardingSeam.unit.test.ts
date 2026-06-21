import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { drawBirthDate, formatBirthDate } from "../birthDate";
import { getCulture, suggestGivenNames } from "../onomastics";
import { createRng } from "../rng";
import type { OnomasticsFile } from "../schema";
import { ARCHETYPE_CALLINGS, ARCHETYPES } from "../slots";

/**
 * OB-2 — the seam helpers the authored Epoch-0 needs: given-name suggestions, the seed-drawn
 * birth date (chronology, separate from the place geography), and the calling=archetype
 * titles. All pure + seeded.
 */

describe("OB-2 given-name suggestions", () => {
  const onomastics: OnomasticsFile = { cultures: loadContent().onomastics };

  it("offers distinct, sex-appropriate names from the culture pool", () => {
    const culture = getCulture(onomastics, "irish_catholic");
    const offer = suggestGivenNames(culture, "male", createRng("ob"), 3);
    expect(offer).toHaveLength(3);
    expect(new Set(offer).size).toBe(3);
    for (const n of offer) expect(culture.givenMale).toContain(n);
  });

  it("is seeded + deterministic, and female pool for female", () => {
    const culture = getCulture(onomastics, "bavarian_german");
    const a = suggestGivenNames(culture, "female", createRng("z"), 3);
    const b = suggestGivenNames(culture, "female", createRng("z"), 3);
    expect(a).toEqual(b);
    for (const n of a) expect(culture.givenFemale).toContain(n);
  });
});

describe("OB-2 birth date (chronology)", () => {
  it("draws a valid month + day, deterministic for a seed", () => {
    const d1 = drawBirthDate(createRng("s"));
    const d2 = drawBirthDate(createRng("s"));
    expect(d1).toEqual(d2);
    expect(d1.month).toBeGreaterThanOrEqual(1);
    expect(d1.month).toBeLessThanOrEqual(12);
    expect(d1.day).toBeGreaterThanOrEqual(1);
    expect(d1.day).toBeLessThanOrEqual(31);
  });

  it("never draws an invalid day for the month (e.g. Feb 30)", () => {
    for (let i = 0; i < 200; i++) {
      const d = drawBirthDate(createRng(`seed-${i}`));
      const max = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][d.month - 1] ?? 30;
      expect(d.day, `month ${d.month}`).toBeLessThanOrEqual(max);
    }
  });

  it("narrates the doctor's-notes date with the era's year", () => {
    expect(formatBirthDate({ month: 9, day: 6 }, 1885)).toBe("September 6, 1885");
    expect(formatBirthDate({ month: 3, day: 3 }, 768)).toBe("March 3, 768");
  });
});

describe("OB-2 calling = archetype titles", () => {
  it("has a diegetic title + summons for every archetype", () => {
    for (const a of ARCHETYPES) {
      const c = ARCHETYPE_CALLINGS[a];
      expect(c, a).toBeDefined();
      expect(c.title.length).toBeGreaterThan(2);
      expect(c.summons.length).toBeGreaterThan(10);
    }
  });
});
