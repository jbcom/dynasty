import { describe, expect, it } from "vitest";
import { allMapJobs, buildMapPrompt, MAP_STYLE, mapKey } from "../mapArt";
import { ERA_BAND_ORDER } from "../portrait";

describe("mapArt (GA-MAP-ART GM-1)", () => {
  it("mapKey is the stable map:<eraBand> composite", () => {
    expect(mapKey("founding_1700s")).toBe("map:founding_1700s");
    expect(mapKey("stellar")).toBe("map:stellar");
  });

  it("buildMapPrompt is era-specific and carries the locked MAP_STYLE", () => {
    const founding = buildMapPrompt("founding_1700s");
    const stellar = buildMapPrompt("stellar");
    expect(founding).not.toBe(stellar);
    // Period registers come through (a colonial chart vs. a star-chart).
    expect(founding).toMatch(/colonial|coast|republic/i);
    expect(stellar).toMatch(/star|stellar|cosmos/i);
    // Every prompt locks the chronicle-atlas style + the "base only, no route lines/text" guard.
    expect(founding).toContain(MAP_STYLE);
    expect(stellar).toContain(MAP_STYLE);
    expect(MAP_STYLE).toMatch(/no route lines/i);
    expect(MAP_STYLE).toMatch(/no on-screen text/i);
  });

  it("allMapJobs covers every era band exactly once, keyed and prompted", () => {
    const jobs = allMapJobs();
    expect(jobs.map((j) => j.eraBand)).toEqual([...ERA_BAND_ORDER]);
    for (const j of jobs) {
      expect(j.key).toBe(mapKey(j.eraBand));
      expect(j.prompt).toBe(buildMapPrompt(j.eraBand));
    }
  });
});
