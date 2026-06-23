import { describe, expect, it } from "vitest";
import { dealSenseCues, resolvePlace, type Sense } from "../founding/senseEmergence";
import { createRng } from "../rng";

/**
 * EI-2 SENSORY-PLACE-RESOLUTION — the newborn's senses crystallize into ONE place (replacing the 3-card
 * region pick). Pure + deterministic: same seed + same reaction taps → same place; taps nudge, never
 * hard-pick; the result is always exactly one of the three founding regions.
 */

const REGIONS = ["new_england", "mid_atlantic", "south"] as const;

describe("sense emergence (EI-2 SENSORY-PLACE-RESOLUTION)", () => {
  it("deals one cue per sense, each a well-formed diegetic fragment leaning to a real region", () => {
    const cues = dealSenseCues(createRng("e1"));
    expect(cues.map((c) => c.sense).sort()).toEqual(["smell", "sound", "taste", "touch"]);
    for (const c of cues) {
      expect(c.text.length, "the cue has diegetic prose").toBeGreaterThan(0);
      expect(REGIONS).toContain(c.leans);
    }
  });

  it("is deterministic: same seed → same cues + same resolved place", () => {
    const a = dealSenseCues(createRng("seed-x"));
    const b = dealSenseCues(createRng("seed-x"));
    expect(b).toEqual(a);
    const taps: Sense[] = ["sound", "smell"];
    expect(resolvePlace(b, taps)).toBe(resolvePlace(a, taps));
  });

  it("resolves to exactly ONE of the three regions (never a 3-way pick) across many seeds + tap sets", () => {
    for (const seed of ["s1", "s2", "s3", "s4", "s5", "s6"]) {
      const cues = dealSenseCues(createRng(seed));
      for (const taps of [
        [],
        ["sound"],
        ["smell", "taste"],
        ["sound", "smell", "touch", "taste"],
      ] as Sense[][]) {
        const place = resolvePlace(cues, taps);
        expect(REGIONS, `seed=${seed} taps=${taps.join(",")}`).toContain(place);
      }
    }
  });

  it("attending a sense NUDGES toward that cue's region (a tap can shift the outcome)", () => {
    // Find a seed where the cues lean to two different regions, then show that attending all the cues of one
    // region resolves to it — proving taps move the result, not just the seed.
    let shifted = false;
    for (const seed of ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8"]) {
      const cues = dealSenseCues(createRng(seed));
      const regionsPresent = new Set(cues.map((c) => c.leans));
      if (regionsPresent.size < 2) continue;
      // Pick a region that is NOT the no-taps winner, attend exactly its cues, and check it can win.
      const baseline = resolvePlace(cues, []);
      for (const target of regionsPresent) {
        if (target === baseline) continue;
        const targetSenses = cues.filter((c) => c.leans === target).map((c) => c.sense);
        if (resolvePlace(cues, targetSenses) === target) {
          shifted = true;
          break;
        }
      }
      if (shifted) break;
    }
    expect(shifted, "attending a region's cues can shift the resolved place (taps matter)").toBe(
      true,
    );
  });
});
