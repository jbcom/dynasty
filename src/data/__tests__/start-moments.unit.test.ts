import { describe, expect, it } from "vitest";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent, type RawContent } from "../../sim/content";
import { foundDynasty } from "../../sim/founding";
import { loadContent } from "../loadContent";

/**
 * FD-6.1 — start-moments: the "found your own dynasty" hinges load + cross-ref
 * validate (culture ∈ onomastics, startEra ∈ eras, archetype enum), and the deep-
 * history exemplar is present and wired to its caliphate era.
 */

const content = loadContent();

const MODERN = [
  "irish_famine_1847",
  "bavaria_1885",
  "cape_colony_1906",
  "apartheid_end_1994",
  "gold_rush_1849",
  "gilded_age_ny_1880",
  "second_awakening_1830",
];

describe("FD-6.1 start-moments content", () => {
  it("loads all 7 modern moments + 1 deep-history exemplar", () => {
    const ids = new Set(content.startMoments.map((m) => m.id));
    for (const id of MODERN) expect(ids.has(id), id).toBe(true);
    expect(ids.has("abbasid_baghdad_762")).toBe(true);
    expect(content.startMoments).toHaveLength(8);
  });

  it("every moment's culture resolves in onomastics", () => {
    const cultures = new Set(Object.keys(content.onomastics));
    for (const m of content.startMoments) {
      expect(cultures.has(m.culture), `${m.id} culture ${m.culture}`).toBe(true);
    }
  });

  it("each moment uses the HISTORICALLY-APPROPRIATE culture for its origin", () => {
    // Pin every moment's culture so a placeholder (e.g. a caliphate line naming its
    // progenitor in the Scots-Irish tradition) can never regress in silently.
    const expected: Record<string, string> = {
      irish_famine_1847: "irish_catholic",
      bavaria_1885: "bavarian_german",
      cape_colony_1906: "afrikaner",
      apartheid_end_1994: "afrikaner",
      gold_rush_1849: "scots_irish",
      gilded_age_ny_1880: "anglo_protestant",
      second_awakening_1830: "scots_irish",
      abbasid_baghdad_762: "arabic_abbasid",
    };
    for (const m of content.startMoments) {
      expect(m.culture, `${m.id} must use ${expected[m.id]}`).toBe(expected[m.id]);
    }
  });

  it("the Abbasid caliphate line names its progenitor in the Arabic tradition", () => {
    const arabic = content.onomastics.arabic_abbasid;
    expect(arabic, "arabic_abbasid culture exists").toBeDefined();
    // The deep-history line's seeded progenitor is an Arabic given name, never a
    // Western (Scots-Irish/WASP) one.
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const r = foundDynasty(content, {
        momentId: "abbasid_baghdad_762",
        surname: "al-Rashid",
        seed,
      });
      expect(arabic?.givenMale).toContain(r.progenitorGiven);
    }
  });

  it("every moment's startEra resolves to a real era", () => {
    const eraIds = new Set(content.eras.map((e) => e.id));
    for (const m of content.startMoments) {
      expect(eraIds.has(m.startEra), `${m.id} startEra ${m.startEra}`).toBe(true);
    }
  });

  it("the deep-history exemplar is flagged and starts in the caliphate era", () => {
    const deep = content.startMoments.find((m) => m.id === "abbasid_baghdad_762");
    expect(deep?.deepHistory).toBe(true);
    expect(deep?.startEra).toBe("caliphate");
    expect(deep?.year).toBeLessThan(1000);
  });

  it("each moment offers at least one founding choice", () => {
    for (const m of content.startMoments) {
      expect(m.choices.length, m.id).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("FD-6.1 start-moment cross-ref gates", () => {
  function rawWith(moment: Record<string, unknown>): RawContent {
    const raw = validRaw();
    raw.onomastics = {
      cultures: {
        test_culture: {
          label: "Test",
          givenMale: ["A"],
          givenFemale: ["B"],
          convention: "patronymic",
          namingRules: {},
        },
      },
    };
    raw.startMoments = { moments: [moment] };
    return raw;
  }

  const base = {
    id: "m1",
    label: "M1",
    year: 1900,
    place: "p",
    culture: "test_culture",
    archetype: "economic",
    startEra: "boyhood",
    scene: "s",
    researchNote: "r",
    choices: [{ id: "c", text: "t", outcome: "o" }],
  };

  it("accepts a well-formed moment", () => {
    expect(() => buildContent(rawWith({ ...base }))).not.toThrow();
  });

  it("rejects an unknown culture", () => {
    expect(() => buildContent(rawWith({ ...base, culture: "atlantean" }))).toThrow(
      /unknown culture/,
    );
  });

  it("rejects an unknown startEra", () => {
    expect(() => buildContent(rawWith({ ...base, startEra: "neverland" }))).toThrow(
      /unknown startEra/,
    );
  });
});
