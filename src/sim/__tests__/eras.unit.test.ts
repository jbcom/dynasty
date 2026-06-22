import { describe, expect, it } from "vitest";
import { bandForEra, DEFAULT_ERA_BAND, ERA_BANDS } from "../eras";

/**
 * RB-10 era bands — the single source the audio chord + visual wash both read. Pure + deterministic:
 * the table is ordered origins → stars, every band carries both cues, and bandForEra resolves by the
 * era-id keyword family (default = origins). The chord↔ramp agreement invariant (that chordForEra and
 * rampForEra resolve to the SAME band) is asserted in sound/palettes tests once they read this table.
 */

describe("ERA_BANDS (RB-10)", () => {
  it("is ordered origins → stars and every band carries both a chord and a ramp", () => {
    expect(ERA_BANDS.map((b) => b.id)).toEqual([
      "origins",
      "mogul",
      "ascent",
      "interregnum",
      "stars",
    ]);
    for (const b of ERA_BANDS) {
      expect(b.chord.length).toBeGreaterThan(0);
      expect(b.ramp.top).toMatch(/^#[0-9a-f]{6}$/);
      expect(b.ramp.bottom).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("matches each band by its era-id keyword family", () => {
    expect(bandForEra("origins").id).toBe("origins");
    expect(bandForEra("mogul-1964").id).toBe("mogul");
    expect(bandForEra("primetime-brand").id).toBe("ascent");
    expect(bandForEra("mars-interregnum").id).toBe("interregnum");
    expect(bandForEra("interstellar-contact").id).toBe("stars");
    // Macro-act titles carry the same keywords.
    expect(bandForEra("Ascension").id).toBe("stars");
  });

  it("falls back to the rooted origins band for an unknown era", () => {
    expect(bandForEra("some-unmapped-period")).toBe(DEFAULT_ERA_BAND);
    expect(DEFAULT_ERA_BAND.id).toBe("origins");
  });

  it("is deterministic — same era id yields the same band", () => {
    expect(bandForEra("stars")).toBe(bandForEra("stars"));
  });

  it("ramps from warm earth at origins toward a cool luminous deep at the stars", () => {
    const red = (hex: string) => Number.parseInt(hex.slice(1, 3), 16);
    const blue = (hex: string) => Number.parseInt(hex.slice(5, 7), 16);
    expect(red(bandForEra("origins").ramp.top)).toBeGreaterThan(
      blue(bandForEra("origins").ramp.top),
    );
    expect(blue(bandForEra("stars").ramp.top)).toBeGreaterThan(red(bandForEra("stars").ramp.top));
  });
});
