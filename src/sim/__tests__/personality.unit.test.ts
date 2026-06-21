import { describe, expect, it } from "vitest";
import { initMotivators } from "../motivators";
import {
  applyPersonality,
  archetypeOf,
  initPersonality,
  perceptionGap,
  spectrumLabel,
  tyrannyUtopiaAxis,
} from "../personality";

/**
 * The personality module is now the MOTIVATORS adapter (SS-1): `Personality` === `Motivators`
 * (8 axes), with the derived tyranny↔utopia / archetype helpers recomputed from the new axes
 * (politics ← ideology, power ← grandiosity). These tests pin the adapter + derived behavior.
 */

describe("personality (motivators adapter)", () => {
  it("starts centrist and pure-applies clamped deltas", () => {
    const p = initPersonality();
    expect(p).toEqual(initMotivators());
    expect(p.politics).toBe(0);
    const next = applyPersonality(p, { politics: 200, power: -5 });
    expect(next.politics).toBe(100); // clamped
    expect(next.power).toBe(-5);
    expect(p.politics).toBe(0); // original untouched
  });

  it("clamps the low end too", () => {
    expect(applyPersonality(initPersonality(), { reach: -250 }).reach).toBe(-100);
  });

  it("classifies archetypes across the politics × power space", () => {
    const base = initMotivators();
    expect(archetypeOf({ ...base, politics: -80, power: 60 })).toBe("communist_visionary");
    expect(archetypeOf({ ...base, politics: -70, power: 0 })).toBe("social_democrat");
    expect(archetypeOf(base)).toBe("dealmaker");
    expect(archetypeOf({ ...base, politics: 70, power: 20 })).toBe("populist_strongman");
    expect(archetypeOf({ ...base, politics: 90, power: 90 })).toBe("megalomaniac_king");
  });

  it("tyrannyUtopiaAxis trends negative for utopian, positive for tyrannical", () => {
    const base = initMotivators();
    const utopian = { ...base, politics: -60, power: -40, honor: -80 };
    const tyrant = { ...base, politics: 80, power: 90, honor: 80 };
    expect(tyrannyUtopiaAxis(utopian)).toBeLessThan(-30);
    expect(tyrannyUtopiaAxis(tyrant)).toBeGreaterThan(30);
  });

  it("spectrumLabel maps the axis to readable bands", () => {
    const base = initMotivators();
    expect(spectrumLabel({ ...base, politics: -90, power: -90, honor: -90 })).toBe("Utopian");
    expect(spectrumLabel({ ...base, politics: 90, power: 90, honor: 90 })).toBe("Tyrannical");
    expect(spectrumLabel(initPersonality())).toBe("Contested");
  });

  it("perceptionGap returns a finite gauge (power vs honor tempering)", () => {
    const base = initMotivators();
    expect(perceptionGap({ ...base, power: 80, honor: 20 })).toBe(60);
  });
});
