import { describe, expect, it } from "vitest";
import { DYNASTY_SPINE } from "../../saga/spineAuthored";
import {
  buildCompositePortraitPrompt,
  buildEncounterPortraitPrompt,
  buildPortraitPrompt,
  CHRONICLE_WRAPPER,
  compositePortraitKey,
  encounterPortraitKey,
  eraBandForYear,
  type PortraitFacets,
  portraitKey,
  presentationFor,
  SIGNATURE_STYLE,
} from "../portrait";

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

describe("EI-8a eraBandForYear (fine era bands)", () => {
  it("maps representative years to the right fine band (not the 4 coarse macro-acts)", () => {
    expect(eraBandForYear(1776)).toBe("founding_1700s");
    expect(eraBandForYear(1812)).toBe("federal_1800s");
    expect(eraBandForYear(1875)).toBe("industrial_late1800s");
    expect(eraBandForYear(1925)).toBe("early_1900s");
    expect(eraBandForYear(1960)).toBe("midcentury");
    expect(eraBandForYear(2010)).toBe("digital_modern");
    expect(eraBandForYear(2100)).toBe("near_future");
    expect(eraBandForYear(2500)).toBe("stellar");
  });

  it("places band boundaries on the correct side (inclusive upper bounds)", () => {
    expect(eraBandForYear(1799)).toBe("founding_1700s");
    expect(eraBandForYear(1800)).toBe("federal_1800s");
    expect(eraBandForYear(1859)).toBe("federal_1800s");
    expect(eraBandForYear(1860)).toBe("industrial_late1800s");
    expect(eraBandForYear(2040)).toBe("digital_modern");
    expect(eraBandForYear(2041)).toBe("near_future");
  });

  it("distinguishes a child's era across the centuries (the user's 1790 ≠ 1990 ≠ stars)", () => {
    expect(eraBandForYear(1790)).not.toBe(eraBandForYear(1990));
    expect(eraBandForYear(1990)).not.toBe(eraBandForYear(2300));
  });

  it("the prompt's era register tracks the FINE band, not just the macro-act", () => {
    // g0 (1776) reads colonial; a mid-century generation reads mid-century — distinct registers within
    // what the old 4-band map would have collapsed.
    expect(buildPortraitPrompt(g0, "male")).toMatch(/colonial/i);
    const midcenturyAct = { ...g0, gen: 5, year: 1960, macroAct: "emergence" as const };
    expect(buildPortraitPrompt(midcenturyAct, "male")).toMatch(/mid-century/i);
  });
});

describe("EI-8d composite portrait prompt + key", () => {
  const adultCeo: PortraitFacets = {
    lifeStage: "adult",
    eraBand: "digital_modern",
    archetype: "economic",
    rungTier: "high",
    gender: "male",
  };

  it("rides the chronicle wrapper + folds in the presentation medium, era band, life stage, and wardrobe", () => {
    const p = buildCompositePortraitPrompt(adultCeo);
    expect(p).toContain(CHRONICLE_WRAPPER); // cohesion wrapper, NOT the locked engraving style
    expect(p).not.toContain(SIGNATURE_STYLE); // composite portraits vary their medium by era×station
    expect(p).toMatch(/an adult/i);
    expect(p).toMatch(/magnate|CEO/i); // high economic wardrobe
    expect(p).toMatch(/2030s|contemporary/i); // digital_modern era register
    expect(p).toMatch(/headshot/i); // digital_modern high presentation medium
  });

  it("mutes the wardrobe for the youngest stages (an infant has no station yet)", () => {
    const infant: PortraitFacets = { ...adultCeo, lifeStage: "infant" };
    const p = buildCompositePortraitPrompt(infant);
    expect(p).toMatch(/an infant/i);
    expect(p).toMatch(/child of the household|plain period dress/i);
    expect(p).not.toMatch(/magnate|CEO/i); // station deferred for the infant
  });

  it("keys deterministically on the full facet set (composite cache key)", () => {
    expect(compositePortraitKey(adultCeo)).toBe("portrait:adult:digital_modern:economic:high:m");
    // any facet change → a different key
    expect(compositePortraitKey({ ...adultCeo, rungTier: "low" })).not.toBe(
      compositePortraitKey(adultCeo),
    );
    expect(compositePortraitKey({ ...adultCeo, archetype: "crime" })).toContain(":crime:");
  });
});

describe("EI-8 presentation medium (era × station — user 2026-06-23)", () => {
  it("the Gilded-Age fortune-seeker (low) keeps a worn tintype keepsake; the magnate (high) a gilt-framed oil", () => {
    // The user's examples: a miner's creased tintype of his wife back home vs a robber baron's commissioned oil.
    expect(presentationFor("industrial_late1800s", "low")).toMatch(
      /tintype|carte-de-visite|keepsake/i,
    );
    expect(presentationFor("industrial_late1800s", "high")).toMatch(
      /gilt-framed oil|cabinet card|magnate/i,
    );
  });

  it("the medium tracks era AND station (every era×tier is distinct)", () => {
    const eras = [
      "founding_1700s",
      "federal_1800s",
      "industrial_late1800s",
      "early_1900s",
      "midcentury",
      "digital_modern",
      "near_future",
      "stellar",
    ] as const;
    const all = new Set<string>();
    for (const e of eras) {
      const lo = presentationFor(e, "low");
      const hi = presentationFor(e, "high");
      expect(lo).not.toBe(hi); // station shifts the medium within an era
      all.add(lo);
      all.add(hi);
    }
    expect(all.size, "media are distinct across eras + stations").toBe(eras.length * 2);
  });

  it("extrapolates into the future bands (volumetric / holographic keepsakes)", () => {
    expect(presentationFor("near_future", "high")).toMatch(/volumetric/i);
    expect(presentationFor("stellar", "high")).toMatch(/holographic/i);
    expect(presentationFor("stellar", "low")).toMatch(/hologram|archival/i);
  });

  it("the founding fortune-seeker reads humble (a rough sketch), not a commissioned work", () => {
    expect(presentationFor("founding_1700s", "low")).toMatch(/sketch|charcoal|humble/i);
    expect(presentationFor("founding_1700s", "high")).toMatch(
      /engraving|oil miniature|commissioned/i,
    );
  });
});

describe("EI-8d encounter portrait prompt + key", () => {
  it("characterizes a distinct person by role, era, and age — not the line's archetype", () => {
    const p = buildEncounterPortraitPrompt({
      role: "first friend",
      lifeStage: "child",
      eraBand: "founding_1700s",
      gender: "female",
    });
    expect(p).toContain(CHRONICLE_WRAPPER);
    expect(p).toMatch(/first friend/i);
    expect(p).toMatch(/a child/i);
    expect(p).toMatch(/colonial/i);
  });

  it("keys encounter portraits under a normalized role token", () => {
    expect(
      encounterPortraitKey({
        role: "Rival Head",
        lifeStage: "adult",
        eraBand: "midcentury",
        gender: "male",
      }),
    ).toBe("portrait:enc:rival_head:adult:midcentury:m");
  });
});
