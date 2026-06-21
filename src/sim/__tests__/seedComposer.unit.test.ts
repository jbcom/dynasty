import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { foundByComposition } from "../founding";
import { tracePlaythrough, validateTrace } from "../harness";
import { getCulture, suggestSurnames } from "../onomastics";
import { dealComposition } from "../places";
import { createRng } from "../rng";
import type { OnomasticsFile } from "../schema";
import { composeSeed, SEED_LANES, seedLane, seedSpaceSize } from "../seedComposer";

/**
 * PL-3 — the diegetic seed composer + culture surname suggestions. The seed is authored
 * by three pre-place choices (never typed, never shown); these tests pin that the
 * composition is pure + deterministic and that the surname bestowal always has options.
 */

describe("PL-3 seed composer", () => {
  it("exposes three lanes, each with a prompt and >=2 evocative word fragments", () => {
    expect(SEED_LANES).toEqual(["first", "second", "third"]);
    for (const key of SEED_LANES) {
      const lane = seedLane(key);
      expect(lane.prompt.length).toBeGreaterThan(10);
      expect(lane.words.length).toBeGreaterThanOrEqual(2);
      for (const w of lane.words) {
        expect(w.word).toMatch(/^[a-z]+$/);
        expect(w.fragment.length).toBeGreaterThan(10);
      }
    }
  });

  it("composes a stable lowercase hyphen-slug seed from the three picks", () => {
    expect(composeSeed(["gilded", "restless", "tide"])).toBe("gilded-restless-tide");
    // Same picks → same seed (the determinism the deterministic deal relies on).
    expect(composeSeed(["iron", "shrewd", "forge"])).toBe(composeSeed(["iron", "shrewd", "forge"]));
  });

  it("rejects the wrong number of words (a programming error, not user input)", () => {
    expect(() => composeSeed(["one", "two"])).toThrow();
    expect(() => composeSeed(["a", "b", "c", "d"])).toThrow();
  });

  it("reports a seed space large enough for varied authored hands", () => {
    expect(seedSpaceSize()).toBeGreaterThanOrEqual(200);
  });
});

describe("PL-3 surname suggestions", () => {
  const onomastics: OnomasticsFile = { cultures: loadContent().onomastics };

  it("offers the requested count of distinct culture-appropriate surnames", () => {
    const culture = getCulture(onomastics, "irish_catholic");
    const offer = suggestSurnames(culture, createRng("seed-1"), 3);
    expect(offer).toHaveLength(3);
    expect(new Set(offer).size).toBe(3); // distinct
    // All come from the Irish pool (the culture has its own surnames authored).
    for (const s of offer) expect(culture.surnames).toContain(s);
  });

  it("is seeded + deterministic (same culture + seed → same offer)", () => {
    const culture = getCulture(onomastics, "bavarian_german");
    const a = suggestSurnames(culture, createRng("xyz"), 3);
    const b = suggestSurnames(culture, createRng("xyz"), 3);
    expect(a).toEqual(b);
  });

  it("never suggests a preset-person surname (the leak invariant holds at the source)", () => {
    const banned = /\b(Trump|Drumpf|Musk|Kennedy)\b/;
    for (const id of Object.keys(onomastics.cultures)) {
      const culture = getCulture(onomastics, id);
      for (const s of suggestSurnames(culture, createRng(`leak-${id}`), 4)) {
        expect(s).not.toMatch(banned);
      }
    }
  });
});

describe("PL-3 onboarding-authored founding (determinism + no leaks)", () => {
  const content = loadContent();

  it("the same three picks → the same composed seed → the same dealt origin", () => {
    const picks = ["gilded", "shrewd", "tower"];
    const seedA = composeSeed(picks);
    const seedB = composeSeed([...picks]);
    expect(seedA).toBe(seedB);
    const a = dealComposition(content.places, content.eras, seedA);
    const b = dealComposition(content.places, content.eras, seedB);
    // Same authored seed → identical place/era/culture/archetype/gender (the determinism
    // the onboarding preview + the founding deal both rely on).
    expect(a).toEqual(b);
  });

  it("an onboarding-authored run founds + traces leak-free (surname bestowed, not typed)", () => {
    const seed = composeSeed(["restless", "ruthless", "wager"]);
    const dealt = dealComposition(content.places, content.eras, seed);
    const culture = getCulture({ cultures: content.onomastics }, dealt.culture);
    const surname = suggestSurnames(culture, createRng(`${seed}::surname-offer`), 3)[0];
    if (!surname) throw new Error("no surname suggestion");
    // Fund the run the way App.birthGame does: deal WITH the bestowed surname.
    const composition = dealComposition(content.places, content.eras, seed, surname);
    const founded = foundByComposition(content, composition).state;
    // The diegetic onboarding pre-sets emerged + named (the in-game birth opens at gender).
    expect(founded.flags).toContain("emerged");
    expect(founded.flags).toContain("named");
    expect(founded.flags).toContain("founded_line");
    // And the whole authored playthrough is leak-free.
    const trace = tracePlaythrough(content, composition);
    expect(validateTrace(trace).filter((f) => f.kind === "leak")).toEqual([]);
    expect(trace.finalName.endsWith(` ${surname}`)).toBe(true);
  });
});
