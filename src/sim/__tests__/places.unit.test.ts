import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { foundByComposition } from "../founding";
import {
  dealComposition,
  placeById,
  placeEraSpace,
  placeForCue,
  resolveComposition,
} from "../places";

/**
 * CP-R3 — the places catalog cross-resolves, the resolvers work, and the invariant
 * holds: EVERY offered (place × era) composes into a valid founded run. The
 * directory tree + catalog IS the place×era catalog the diegetic birth draws from.
 */

const content = loadContent();
const eraIds = new Set(content.eras.map((e) => e.id));
const cultureIds = new Set(Object.keys(content.onomastics));
const stackPlaces = new Set(content.worldStacks.map((s) => s.place));

describe("CP-R3 places catalog", () => {
  it("loads a non-empty catalog with the canonical world-stack places", () => {
    expect(content.places.length).toBeGreaterThanOrEqual(9);
    for (const p of content.places) expect(stackPlaces.has(p.id), `${p.id} world-stack`).toBe(true);
  });

  it("every place cross-resolves: defaultCulture in onomastics, validEras real", () => {
    for (const p of content.places) {
      expect(cultureIds.has(p.defaultCulture), `${p.id} culture`).toBe(true);
      expect(p.validEras.length, `${p.id} validEras`).toBeGreaterThanOrEqual(1);
      for (const e of p.validEras) expect(eraIds.has(e), `${p.id} era ${e}`).toBe(true);
    }
  });

  it("every sensory cue is unique (the birth maps a cue → exactly one place)", () => {
    const cues = content.places.map((p) => p.sensoryCue);
    expect(new Set(cues).size).toBe(cues.length);
  });

  it("placeById / placeForCue resolve", () => {
    const baghdad = placeById(content.places, "baghdad");
    expect(baghdad?.defaultCulture).toBe("arabic_abbasid");
    const irelandPlace = placeById(content.places, "ireland");
    if (!irelandPlace) throw new Error("no ireland place");
    const ireland = placeForCue(content.places, irelandPlace.sensoryCue);
    expect(ireland?.id).toBe("ireland");
    expect(placeById(content.places, "atlantis")).toBeUndefined();
  });

  it("INVARIANT: every (place × era) in the space founds a valid run", () => {
    const space = placeEraSpace(content.places);
    expect(space.length).toBeGreaterThanOrEqual(content.places.length);
    for (const { place, era } of space) {
      const p = placeById(content.places, place);
      if (!p) throw new Error(`no place ${place}`);
      const era0 = content.eras.find((e) => e.id === era);
      const composition = resolveComposition(p, {
        era,
        year: era0?.yearStart ?? 1900,
        archetype: "economic",
        gender: "male",
        surname: "Testford",
        seed: `r3-${place}-${era}`,
      });
      const r = foundByComposition(content, composition);
      // A valid founded run: begins in the chosen era, names itself, not ended.
      expect(content.eras[r.state.eraIndex]?.id, `${place}×${era}`).toBe(era);
      expect(r.state.founding?.place, `${place}×${era}`).toBe(place);
      expect(r.state.end, `${place}×${era}`).toBeNull();
      expect(r.progenitorName.endsWith(" Testford"), `${place}×${era}`).toBe(true);
    }
  });

  it("dealComposition deals a valid, replayable, seed-dealt birth (CP-R4)", () => {
    const a = dealComposition(content.places, content.eras, "seed-xyz", "Vane");
    const b = dealComposition(content.places, content.eras, "seed-xyz", "Vane");
    // Same seed → identical deal (replayable birth).
    expect(a).toEqual(b);
    // The dealt origin is a real catalog place × one of its valid eras.
    const p = placeById(content.places, a.place);
    expect(p, a.place).toBeDefined();
    expect(p?.validEras).toContain(a.era);
    expect(a.surname).toBe("Vane");
    // It founds a valid run.
    const r = foundByComposition(content, a);
    expect(content.eras[r.state.eraIndex]?.id).toBe(a.era);
    expect(r.state.end).toBeNull();
  });

  it("different seeds deal different births (the hand varies)", () => {
    const origins = new Set(
      ["s1", "s2", "s3", "s4", "s5", "s6"].map((s) => {
        const c = dealComposition(content.places, content.eras, s, "Vane");
        return `${c.place}:${c.era}:${c.gender}:${c.archetype}`;
      }),
    );
    expect(origins.size).toBeGreaterThanOrEqual(2);
  });

  it("the random deal NEVER picks a founding-region place (those are onboarding-only)", () => {
    // FS-ONB-DRIFT: kind:"founding" regions are chosen explicitly via onboarding, never randomly dealt.
    // Across many seeds the random-deal branch must only surface wave/destination places.
    for (let i = 0; i < 40; i++) {
      const c = dealComposition(content.places, content.eras, `rand-${i}`, "Vane");
      const dealt = placeById(content.places, c.place);
      expect(dealt?.kind).not.toBe("founding");
    }
    // An explicitly-passed founding place is still honored (the production onboarding path).
    const south = placeById(content.places, "founding_south");
    if (!south) throw new Error("founding_south missing");
    const c = dealComposition(content.places, content.eras, "explicit", "Vane", south);
    expect(c.place).toBe("founding_south");
  });

  it("resolveComposition rejects an off-catalog (place, era)", () => {
    const ireland = placeById(content.places, "ireland");
    if (!ireland) throw new Error("no ireland");
    expect(() =>
      resolveComposition(ireland, {
        era: "interstellar", // not in ireland.validEras
        year: 2200,
        archetype: "economic",
        gender: "male",
        surname: "X",
        seed: "s",
      }),
    ).toThrow(/not valid for place/);
  });
});
