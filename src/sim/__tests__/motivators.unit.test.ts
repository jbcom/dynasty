import { describe, expect, it } from "vitest";
import {
  applyMotivators,
  axisLabel,
  createMotivators,
  dominantMotivator,
  driftMotivators,
  initMotivators,
  MOTIVATOR_AXES,
  type Motivators,
  meetsMotivatorGate,
} from "../motivators";

/** SS-1 — the 8-axis motivator grounding model: init, drift, gate, dominant, labels. Pure + deterministic. */

describe("motivators core (SS-1)", () => {
  it("inits centrist on all 8 axes; createMotivators is the alias", () => {
    const m = initMotivators();
    expect(MOTIVATOR_AXES).toHaveLength(8);
    for (const a of MOTIVATOR_AXES) expect(m[a]).toBe(0);
    expect(createMotivators()).toEqual(m);
  });

  it("applyMotivators is pure + clamps to [-100,100]", () => {
    const m = initMotivators();
    const next = applyMotivators(m, { wealth: 250, power: -250, honor: 30 });
    expect(next.wealth).toBe(100);
    expect(next.power).toBe(-100);
    expect(next.honor).toBe(30);
    expect(m.wealth).toBe(0); // original untouched
  });

  it("drift regresses the heir toward centrist, then applies the generation delta", () => {
    const parent: Motivators = { ...initMotivators(), wealth: 80, politics: -40 };
    const heir = driftMotivators(parent, { politics: -10 }, 0.25);
    expect(heir.wealth).toBe(60); // 80 * 0.75
    expect(heir.politics).toBe(-40); // round(-40*0.75) = -30, then -10
  });

  it("gate: a profile passes only when all thresholds hold", () => {
    const m: Motivators = { ...initMotivators(), power: 60, honor: 50 };
    expect(meetsMotivatorGate(m, { power: { min: 40 }, honor: { min: 40 } })).toBe(true);
    expect(meetsMotivatorGate(m, { power: { min: 80 } })).toBe(false);
    expect(meetsMotivatorGate(m, { honor: { max: 20 } })).toBe(false);
    expect(meetsMotivatorGate(m, {})).toBe(true);
  });

  it("dominantMotivator returns the strongest lean + its pole name", () => {
    const m: Motivators = { ...initMotivators(), wealth: 20, power: -70, reach: 40 };
    const d = dominantMotivator(m);
    expect(d.axis).toBe("power");
    expect(d.value).toBe(-70);
    expect(d.pole).toBe("community"); // power − pole
  });

  it("axisLabel bands a lean into readable copy", () => {
    const m = initMotivators();
    expect(axisLabel(m, "wealth")).toBe("centrist");
    expect(axisLabel({ ...m, wealth: 30 }, "wealth")).toBe("leaning rich");
    expect(axisLabel({ ...m, wealth: -90 }, "wealth")).toBe("strongly poor");
  });

  it("a barely-off-zero dominant reads CENTRIST, not the pole (headline matches the strip)", () => {
    // A near-zero negative wealth: the strip calls it "centrist", so the dominant headline must too —
    // else a fresh line is mislabelled "A poor line" while every axis shows "centrist".
    const d = dominantMotivator({ ...initMotivators(), wealth: -6 });
    expect(d.pole).toBe("centrist");
    expect(axisLabel({ ...initMotivators(), wealth: -6 }, "wealth")).toBe("centrist");
    // Past the deadzone, the real pole shows.
    expect(dominantMotivator({ ...initMotivators(), wealth: -40 }).pole).toBe("poor");
  });
});
