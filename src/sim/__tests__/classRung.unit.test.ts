import { describe, expect, it } from "vitest";
import {
  applyHysteresis,
  applyMisfortune,
  climb,
  initClassState,
  MAX_RUNG,
  RUNGS,
  recover,
  rungName,
} from "../classRung";
import { EPOCHS, type Epoch } from "../macroActs";
import { initMotivators, type Motivators } from "../motivators";
import { createRng } from "../rng";

/** SS-5 — class as a movable rung: climb, seeded misfortune drop into the lower track, recovery, hysteresis. */

const mot = (over: Partial<Motivators> = {}): Motivators => ({ ...initMotivators(), ...over });
const WAR = EPOCHS.find((e) => e.id === "great_wars") as Epoch;

describe("class rung (SS-5)", () => {
  it("init + climb raise the rung and track the peak", () => {
    let s = initClassState(1); // working
    expect(rungName(s.rung)).toBe("working");
    s = climb(s);
    expect(rungName(s.rung)).toBe("middle");
    expect(s.peakRung).toBe(2);
    expect(RUNGS).toHaveLength(MAX_RUNG + 1);
  });

  it("misfortune drops a vulnerable line into the lower track + leaves a mark", () => {
    const s = initClassState(3); // comfortable
    // community-leaning (power−) line is vulnerable to the war shock; force a hard roll seed.
    let dropped = 0;
    let result = initClassState(3);
    // try seeds until we observe a drop (deterministic; just proving the mechanism fires)
    for (let i = 0; i < 50; i++) {
      const r = applyMisfortune(s, WAR, mot({ power: -90 }), createRng(`seed-${i}`));
      if (r.dropped > 0) {
        dropped = r.dropped;
        result = r.state;
        break;
      }
    }
    expect(dropped).toBeGreaterThan(0);
    expect(result.rung).toBeLessThan(3);
    expect(result.hasFallen).toBe(true);
    expect(result.marks).toContain("knew_hunger_once");
    expect(result.peakRung).toBe(3); // peak preserved for recovery
  });

  it("a non-vulnerable line is never dropped by the shock", () => {
    const s = initClassState(3);
    for (let i = 0; i < 20; i++) {
      const r = applyMisfortune(s, WAR, mot({ power: 90 }), createRng(`safe-${i}`));
      expect(r.dropped).toBe(0);
    }
  });

  it("recovery climbs back toward the peak and clears hasFallen at the top", () => {
    let s = { rung: 1, peakRung: 3, hasFallen: true, marks: ["knew_hunger_once"] };
    s = recover(s); // 1→2
    expect(s.rung).toBe(2);
    expect(s.hasFallen).toBe(true);
    s = recover(s); // 2→3 (peak) → cleared
    expect(s.rung).toBe(3);
    expect(s.hasFallen).toBe(false);
  });

  it("hysteresis nudges a hunger-marked line toward community/lineage", () => {
    const base = mot();
    const after = applyHysteresis(base, ["knew_hunger_once"]);
    expect(after.power).toBeLessThan(base.power);
    expect(after.lineage).toBeGreaterThan(base.lineage);
    // no mark → unchanged
    expect(applyHysteresis(base, [])).toEqual(base);
  });

  it("misfortune is deterministic for a given seed", () => {
    const s = initClassState(3);
    const a = applyMisfortune(s, WAR, mot({ power: -90 }), createRng("fixed"));
    const b = applyMisfortune(s, WAR, mot({ power: -90 }), createRng("fixed"));
    expect(a).toEqual(b);
  });
});
