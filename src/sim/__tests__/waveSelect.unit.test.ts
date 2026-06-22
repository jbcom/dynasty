import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import {
  availablePeriods,
  bandForWave,
  classesForPeriod,
  PERIOD_BANDS,
  resolveWaveStart,
  seedMotivatorsForClass,
  startRungForClass,
  wavePlaces,
  wavesForCell,
} from "../waveSelect";

/** SS-7 — the Period → Class → Race/Culture funnel resolver + class-seeded starting motivators. */

const content = loadContent();

describe("wave selection funnel (SS-7)", () => {
  it("only WAVE places are selectable (destinations excluded)", () => {
    const waves = wavePlaces(content.places).map((p) => p.id);
    expect(waves).toContain("ireland");
    expect(waves).toContain("italian");
    expect(waves).not.toContain("east_coast"); // destination ground
    expect(waves).not.toContain("american_south");
  });

  it("bands waves by mid- vs late-1800s arrival", () => {
    const ireland = content.places.find((p) => p.id === "ireland");
    const italian = content.places.find((p) => p.id === "italian");
    if (!ireland || !italian) throw new Error("missing wave");
    expect(bandForWave(ireland)?.id).toBe("mid_1800s"); // Famine ~1845
    expect(bandForWave(italian)?.id).toBe("late_1800s"); // ~1880
    expect(PERIOD_BANDS).toHaveLength(2);
  });

  it("availablePeriods + classesForPeriod offer only non-empty steps", () => {
    const periods = availablePeriods(content.places);
    expect(periods.length).toBeGreaterThan(0);
    for (const b of periods) {
      const classes = classesForPeriod(content.places, b.id);
      expect(classes.length).toBeGreaterThan(0);
      // every offered class has at least one wave in the cell.
      for (const c of classes) {
        expect(wavesForCell(content.places, b.id, c).length).toBeGreaterThan(0);
      }
    }
  });

  it("a multi-wave cell offers the race/culture pick (late-1800s poor = Italian + Chinese + Scandinavian)", () => {
    const cell = wavesForCell(content.places, "late_1800s", "poor").map((p) => p.id);
    expect(cell).toContain("italian");
    // late-1800s middle has Jewish + Levantine (Arab) + German edge.
    const mid = wavesForCell(content.places, "late_1800s", "middle").map((p) => p.id);
    expect(mid).toContain("ashkenazi_jewish");
  });

  it("seeds starting motivators + rung from arrival class", () => {
    expect(seedMotivatorsForClass("poor").wealth).toBeLessThan(
      seedMotivatorsForClass("middle").wealth,
    );
    expect(startRungForClass("poor")).toBe(0);
    expect(startRungForClass("middle")).toBe(2);
  });

  it("resolveWaveStart returns the class-seeded motivators + class state for a wave", () => {
    const ireland = content.places.find((p) => p.id === "ireland");
    if (!ireland) throw new Error("missing ireland");
    const start = resolveWaveStart(ireland);
    expect(start.motivators.wealth).toBeLessThan(0); // poor wave
    expect(start.classState.rung).toBe(0);
  });

  it("resolveWaveStart honors the PLAYER's chosen class over the place default (PF-6 root gap)", () => {
    const ireland = content.places.find((p) => p.id === "ireland");
    if (!ireland) throw new Error("missing ireland");
    // Picking MIDDLE must found richer than picking POOR — the choice must reach the founding seam,
    // else poor and middle found identically and the whole class system is invisible in play.
    const poor = resolveWaveStart(ireland, "poor");
    const middle = resolveWaveStart(ireland, "middle");
    expect(poor.cls).toBe("poor");
    expect(middle.cls).toBe("middle");
    expect(middle.motivators.wealth).toBeGreaterThan(poor.motivators.wealth);
    expect(middle.classState.rung).toBeGreaterThan(poor.classState.rung);
  });
});
