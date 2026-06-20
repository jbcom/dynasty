import { describe, expect, it } from "vitest";
import {
  applyPersonality,
  archetypeOf,
  initPersonality,
  perceptionGap,
  spectrumLabel,
  tyrannyUtopiaAxis,
} from "../personality";

describe("personality vector", () => {
  it("starts neutral-ish and pure-applies clamped deltas", () => {
    const p = initPersonality();
    expect(p.ideology).toBe(0);
    const next = applyPersonality(p, { ideology: 200, grandiosity: -5 });
    expect(next.ideology).toBe(100); // clamped
    expect(next.grandiosity).toBe(5);
    expect(p.ideology).toBe(0); // original untouched
  });

  it("clamps the low end too", () => {
    expect(applyPersonality(initPersonality(), { outward: -250 }).outward).toBe(-100);
  });

  it("classifies archetypes across the ideology x grandiosity space", () => {
    expect(archetypeOf({ ideology: -80, grandiosity: 60, outward: 0, inward: 0 })).toBe(
      "communist_visionary",
    );
    expect(archetypeOf({ ideology: -70, grandiosity: 0, outward: 0, inward: 0 })).toBe(
      "social_democrat",
    );
    expect(archetypeOf({ ideology: 0, grandiosity: 0, outward: 0, inward: 0 })).toBe("dealmaker");
    expect(archetypeOf({ ideology: 70, grandiosity: 20, outward: 0, inward: 0 })).toBe(
      "populist_strongman",
    );
    expect(archetypeOf({ ideology: 90, grandiosity: 90, outward: 0, inward: 0 })).toBe(
      "megalomaniac_king",
    );
  });

  it("tyrannyUtopiaAxis trends negative for utopian, positive for tyrannical", () => {
    const utopian = { ideology: -60, grandiosity: -20, outward: -80, inward: -40 };
    const tyrant = { ideology: 80, grandiosity: 90, outward: 90, inward: 50 };
    expect(tyrannyUtopiaAxis(utopian)).toBeLessThan(-30);
    expect(tyrannyUtopiaAxis(tyrant)).toBeGreaterThan(30);
  });

  it("spectrumLabel maps the axis to readable bands", () => {
    expect(spectrumLabel({ ideology: -80, grandiosity: -40, outward: -90, inward: -90 })).toBe(
      "Utopian",
    );
    expect(spectrumLabel({ ideology: 90, grandiosity: 90, outward: 90, inward: 90 })).toBe(
      "Tyrannical",
    );
    expect(spectrumLabel(initPersonality())).toBe("Contested");
  });

  it("perceptionGap measures self-delusion (outward vs inward divergence)", () => {
    expect(perceptionGap({ ideology: 0, grandiosity: 0, outward: 80, inward: -20 })).toBe(100);
  });
});
