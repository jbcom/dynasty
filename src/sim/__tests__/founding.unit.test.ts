import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { fromSave, toSave } from "../../engine/save";
import {
  type Composition,
  compositionFromMoment,
  foundByComposition,
  foundDynasty,
} from "../founding";

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
      // Composed-origin fields (CP-R2): the era/year/archetype the moment expands to.
      era: "origins",
      year: 1885,
      archetype: "economic",
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

describe("CP-R2 foundByComposition — composed origin (place × era × culture × archetype)", () => {
  const baseComposition = (over: Partial<Composition> = {}): Composition => ({
    place: "ireland",
    era: "origins",
    culture: "irish_catholic",
    year: 1885,
    archetype: "economic",
    gender: "male",
    surname: "Donnelly",
    seed: "s",
    ...over,
  });

  it("founds a valid run from a pure composition (no start-moment)", () => {
    const r = foundByComposition(content, baseComposition());
    expect(r.moment).toBeUndefined(); // pure composition, not moment-derived
    expect(content.eras[r.state.eraIndex]?.id).toBe("origins");
    expect(r.state.year).toBe(1885);
    expect(r.state.birthYear).toBe(1885);
    expect(r.state.founding?.place).toBe("ireland");
    expect(r.state.founding?.culture).toBe("irish_catholic");
    expect(r.state.archetype).toBe("economic");
    // Structural founding flags are seeded, with a synthesized origin id.
    expect(r.state.flags).toContain("founded_line");
    expect(r.state.flags).toContain("founded:composed:ireland:origins");
    expect(r.state.flags).toContain("place:ireland");
    // The live family names the line itself.
    expect(r.progenitorName.endsWith(" Donnelly")).toBe(true);
  });

  it("FS-ONB-DRIFT: stamps founding-origin seed flags (region/base/power/standing) on the run", () => {
    const r = foundByComposition(
      content,
      baseComposition({
        place: "founding_south",
        seedFlags: ["region:south", "base:land", "power:land", "standing:established"],
      }),
    );
    for (const f of ["region:south", "base:land", "power:land", "standing:established"]) {
      expect(r.state.flags).toContain(f);
    }
    // The generic founding flags still stamp alongside the origin flags.
    expect(r.state.flags).toContain("founded_line");
  });

  it("composes the two new archetypes (entertainment, athletic)", () => {
    for (const archetype of ["entertainment", "athletic"] as const) {
      const r = foundByComposition(content, baseComposition({ archetype }));
      expect(r.state.archetype).toBe(archetype);
      expect(r.state.flags).toContain(`archetype:${archetype}`);
    }
  });

  it("ONB-1: a player-chosen GIVEN name overrides the seeded pick + is stored + round-trips", () => {
    const r = foundByComposition(content, baseComposition({ given: "Aloysius" }));
    expect(r.progenitorGiven).toBe("Aloysius");
    expect(r.progenitorName).toBe("Aloysius Donnelly");
    expect(r.state.founding?.given).toBe("Aloysius");
    // A save round-trips the chosen given (a free-typed name isn't re-derivable from the seed).
    const restored = fromSave(content, toSave(r.state));
    expect(restored.founding?.given).toBe("Aloysius");
    expect(restored.family?.members[0]?.given).toBe("Aloysius");
  });

  it("ONB-1: absent `given` falls back to the seeded culture+gender draw (prior behavior)", () => {
    const r = foundByComposition(content, baseComposition());
    const culture = content.onomastics.irish_catholic;
    expect(culture?.givenMale).toContain(r.progenitorGiven);
    expect(r.state.founding?.given).toBeUndefined();
  });

  it("ONB-1: a player-chosen naming STYLE (culture) names the founder from THAT culture's pool", () => {
    // An Irish-wave founder who chooses the Anglo-Protestant naming tradition is named from it.
    const r = foundByComposition(
      content,
      baseComposition({ culture: "anglo_protestant", gender: "female" }),
    );
    const anglo = content.onomastics.anglo_protestant;
    expect(anglo?.givenFemale).toContain(r.progenitorGiven);
    expect(r.state.founding?.culture).toBe("anglo_protestant");
  });

  it("is replay-deterministic: same composition → identical state", () => {
    const c = baseComposition({ seed: "abc", calling: "merchant" });
    expect(foundByComposition(content, c).state).toEqual(foundByComposition(content, c).state);
  });

  it("foundDynasty delegates to the same composition a moment expands to", () => {
    const m = content.startMoments[0];
    if (!m) throw new Error("no start-moment");
    const viaMoment = foundDynasty(content, { momentId: m.id, surname: "Vane", seed: "s" });
    const comp = compositionFromMoment(m, { momentId: m.id, surname: "Vane", seed: "s" });
    const viaComposition = foundByComposition(content, comp);
    // Same founding state; foundDynasty just additionally attaches the moment.
    expect(viaComposition.state).toEqual(viaMoment.state);
    expect(viaMoment.moment?.id).toBe(m.id);
  });

  it("a pure-composition run survives a save round-trip (CP-R2 replay parity)", () => {
    // A composed origin whose momentId is a synthesized `composed:…` id (no
    // start-moment). toSave must carry the composition so fromSave reconstructs it
    // via foundByComposition — not foundDynasty, which would fail to find the moment.
    const c = baseComposition({ archetype: "entertainment", calling: "courtier", seed: "rt" });
    const founded = foundByComposition(content, c).state;
    const restored = fromSave(content, toSave(founded));
    expect(restored.founding?.momentId).toBe("composed:ireland:origins");
    expect(restored.founding?.place).toBe("ireland");
    expect(restored.founding?.era).toBe("origins");
    expect(restored.archetype).toBe("entertainment");
    expect(restored).toEqual(founded);
  });
});
