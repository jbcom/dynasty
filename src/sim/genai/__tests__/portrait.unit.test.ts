import { describe, expect, it } from "vitest";
import { DYNASTY_SPINE } from "../../saga/spineAuthored";
import { buildPortraitPrompt, portraitKey, SIGNATURE_STYLE } from "../portrait";

/**
 * VL-2: the portrait prompt pass. The signature style must ride EVERY prompt verbatim (cohesion), the
 * era register must track the generation, and the key must be deterministic + unique per gen×gender.
 */

const g0 = DYNASTY_SPINE[0]!; // founding
const gStellar = DYNASTY_SPINE.at(-1)!; // interstellar

describe("portrait prompts (VL-2)", () => {
  it("rides the locked SIGNATURE STYLE on every prompt (cohesion)", () => {
    expect(buildPortraitPrompt(g0, "male")).toContain(SIGNATURE_STYLE);
    expect(buildPortraitPrompt(gStellar, "female")).toContain(SIGNATURE_STYLE);
  });

  it("steers away from cartoon/3D/photo (NOT procedural, NOT cartoony)", () => {
    const p = buildPortraitPrompt(g0, "male");
    expect(p).toMatch(/NOT cartoon/i);
    expect(p).toMatch(/NOT 3D render|NOT 3D\/CGI/i);
    expect(p).toMatch(/engraving/i);
  });

  it("tracks the era's visual register per generation", () => {
    expect(buildPortraitPrompt(g0, "male")).toMatch(/colonial/i); // founding = 1700s colonial
    // the terminal stellar act reads retro-futurist, not chrome sci-fi.
    const stellar = buildPortraitPrompt(gStellar, "male");
    expect(stellar).toMatch(/retro-futurist|future/i);
    expect(stellar).toMatch(/NOT chrome/i);
  });

  it("frames a dignified bust per the era's power bearing, not a smile", () => {
    const p = buildPortraitPrompt(g0, "female");
    expect(p).toMatch(/BUST|half-figure/);
    expect(p).toMatch(/not a smile/i);
    expect(p).toContain("a woman");
  });

  it("keys deterministically + uniquely per generation × gender", () => {
    expect(portraitKey(g0, "male")).toBe("spine_g0_male");
    expect(portraitKey(g0, "female")).not.toBe(portraitKey(g0, "male"));
    expect(portraitKey(gStellar, "male")).toContain(`g${gStellar.gen}`);
  });
});
