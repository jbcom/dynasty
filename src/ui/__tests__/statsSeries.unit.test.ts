import { describe, expect, it } from "vitest";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { applyChoice } from "../../sim/effects";
import { createRng } from "../../sim/rng";
import { initState } from "../../sim/state";
import { buildMeterSeries } from "../statsSeries";

const content = () => buildContent(validRaw());

describe("buildMeterSeries", () => {
  it("includes a starting sample plus one per history step", () => {
    const c = content();
    const born = c.allEvents.find((e) => e.id === "ev_born");
    if (!born) throw new Error("no born");
    let s = initState(c, "seed");
    s = applyChoice(c, s, born, "cry_loud", createRng("seed")).state;

    const series = buildMeterSeries(c, s);
    expect(series.years).toHaveLength(2); // start + 1 step
    expect(series.byMeter.reputation).toHaveLength(2);
    // reputation went 0 → 2 via cry_loud
    expect(series.byMeter.reputation[0]).toBe(0);
    expect(series.byMeter.reputation[1]).toBe(2);
  });

  it("produces a series for every meter", () => {
    const c = content();
    const series = buildMeterSeries(c, initState(c, "seed"));
    for (const m of c.meters) {
      expect(series.byMeter[m.id]).toBeDefined();
      expect(series.byMeter[m.id]).toHaveLength(1);
    }
  });
});
