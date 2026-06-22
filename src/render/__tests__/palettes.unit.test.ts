import { describe, expect, it } from "vitest";
import type { Sense } from "../../sim/saga/schema";
import { accentForSense, rampForEra } from "../palettes";

/**
 * RB-8 palettes — the procedural scene-wash ramp (era → gradient) and sense → accent, the visual twins
 * of the audio era cues. Pure + deterministic: same era-id/sense → identical output, and the era arc
 * runs origins → stars so the atmosphere deepens across the saga the way chordForEra does.
 */

describe("rampForEra (RB-8)", () => {
  it("matches each era band by its id keywords", () => {
    expect(rampForEra("origins").id).toBe("origins");
    expect(rampForEra("mogul-1964").id).toBe("mogul");
    expect(rampForEra("primetime-brand").id).toBe("ascent");
    expect(rampForEra("mars-interregnum").id).toBe("interregnum");
    expect(rampForEra("interstellar-contact").id).toBe("stars");
  });

  it("also matches macro-act titles (they carry the same keywords)", () => {
    // SagaView.macroActTitle strings flow in as era ids too.
    expect(rampForEra("Ascension").id).toBe("stars");
  });

  it("falls back to the rooted origins ground for an unknown era", () => {
    const r = rampForEra("some-unmapped-period");
    expect(r.id).toBe("origins");
    expect(r.top).toBe("#2a2018");
  });

  it("is deterministic — same era id yields an identical ramp", () => {
    expect(rampForEra("stars")).toEqual(rampForEra("stars"));
  });

  it("ramps from warm earth at origins toward a cool luminous deep at the stars", () => {
    // A coarse arc check: origins is warm (red channel dominant), stars is cool (blue channel dominant).
    const origins = rampForEra("origins");
    const stars = rampForEra("stars");
    const red = (hex: string) => Number.parseInt(hex.slice(1, 3), 16);
    const blue = (hex: string) => Number.parseInt(hex.slice(5, 7), 16);
    expect(red(origins.top)).toBeGreaterThan(blue(origins.top)); // warm
    expect(blue(stars.top)).toBeGreaterThan(red(stars.top)); // cool
  });
});

describe("accentForSense (RB-8)", () => {
  it("maps every sense to a colour matching SceneReader's --sense-accent", () => {
    const senses: Sense[] = ["smell", "taste", "touch", "sound", "sight"];
    for (const s of senses) expect(accentForSense(s)).toMatch(/^#[0-9a-f]{6}$/);
    expect(accentForSense("taste")).toBe("#a4564d");
    expect(accentForSense("touch")).toBe("#6f7d8c");
  });
});
