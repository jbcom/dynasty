import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { foundDynasty } from "../founding";

/**
 * FD-6.2 — the founding flow: every start-moment founds a valid run; deep-history
 * starts in its prefix era; the progenitor is named from culture + surname;
 * founding flags + metadata are seeded; founding is replay-deterministic.
 */

const content = loadContent();

describe("FD-6.2 foundDynasty", () => {
  it("founds a valid run for every start-moment", () => {
    for (const m of content.startMoments) {
      const r = foundDynasty(content, { momentId: m.id, surname: "Vane", seed: "s" });
      const era = content.eras[r.state.eraIndex];
      expect(era?.id, m.id).toBe(m.startEra);
      expect(r.state.year, m.id).toBe(m.year);
      expect(r.state.birthYear, m.id).toBe(m.year);
      expect(r.state.age, m.id).toBe(0);
      expect(r.state.end).toBeNull();
    }
  });

  it("throws on an unknown moment", () => {
    expect(() => foundDynasty(content, { momentId: "nope", surname: "X", seed: "s" })).toThrow(
      /unknown start-moment/,
    );
  });

  it("names the progenitor from the moment's culture + the chosen surname", () => {
    const r = foundDynasty(content, {
      momentId: "irish_famine_1847",
      surname: "Vane",
      seed: "s",
    });
    const irish = content.onomastics.irish_catholic;
    expect(irish?.givenMale).toContain(r.progenitorGiven);
    expect(r.progenitorName).toBe(`${r.progenitorGiven} Vane`);
  });

  it("seeds founding flags (founded/archetype/place/culture)", () => {
    const r = foundDynasty(content, { momentId: "bavaria_1885", surname: "Vane", seed: "s" });
    expect(r.state.flags).toContain("founded:bavaria_1885");
    expect(r.state.flags).toContain("archetype:economic");
    expect(r.state.flags).toContain("place:bavaria");
    expect(r.state.flags).toContain("culture:bavarian_german");
    expect(r.state.founding).toEqual({
      momentId: "bavaria_1885",
      surname: "Vane",
      culture: "bavarian_german",
      place: "bavaria",
      gender: "male",
    });
  });

  it("CP-3: gender drives the progenitor name pool + is stored; succession mode is stored", () => {
    const r = foundDynasty(content, {
      momentId: "irish_famine_1847",
      surname: "Vane",
      seed: "g",
      gender: "female",
      successionMode: "matriarchal",
    });
    const irish = content.onomastics.irish_catholic;
    // A female progenitor is named from the female pool.
    expect(irish?.givenFemale).toContain(r.progenitorGiven);
    expect(r.state.founding?.gender).toBe("female");
    expect(r.state.founding?.successionMode).toBe("matriarchal");
    // The seeded progenitor member is female.
    const p = r.state.family?.members.find((m) => m.id === r.state.family?.protagonistId);
    expect(p?.sex).toBe("female");
  });

  it("the deep-history moment starts in the caliphate era + flags deep_history_line", () => {
    const r = foundDynasty(content, {
      momentId: "abbasid_baghdad_762",
      surname: "ibn Vane",
      seed: "s",
    });
    expect(content.eras[r.state.eraIndex]?.id).toBe("caliphate");
    expect(r.state.year).toBe(762);
    expect(r.state.flags).toContain("deep_history_line");
  });

  it("is replay-deterministic: same (moment, surname, seed) → identical state", () => {
    const a = foundDynasty(content, { momentId: "gold_rush_1849", surname: "Vane", seed: "abc" });
    const b = foundDynasty(content, { momentId: "gold_rush_1849", surname: "Vane", seed: "abc" });
    expect(a.state).toEqual(b.state);
    expect(a.progenitorName).toBe(b.progenitorName);
  });

  it("different seeds vary the progenitor given name", () => {
    const names = new Set(
      ["s1", "s2", "s3", "s4", "s5"].map(
        (seed) =>
          foundDynasty(content, { momentId: "gilded_age_ny_1880", surname: "Vane", seed })
            .progenitorGiven,
      ),
    );
    // With 10-name pools and 5 seeds, expect at least 2 distinct draws.
    expect(names.size).toBeGreaterThanOrEqual(2);
  });
});
