import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { foundByComposition } from "../founding";
import { tracePlaythrough, validateTrace } from "../harness";
import { getCulture, suggestSurnames } from "../onomastics";
import { dealComposition } from "../places";
import { createRng } from "../rng";
import type { OnomasticsFile } from "../schema";

/**
 * Onboarding founding (OB rework). The run seed is now a plain hidden value (no composed
 * adj/adj/noun phrase). These tests pin the invariants the founding seam keeps regardless of
 * how the seed is produced: surname suggestions are culture-appropriate + leak-free, and a
 * founded run traces with ZERO preset-person leaks.
 */

describe("onboarding surname suggestions", () => {
  const onomastics: OnomasticsFile = { cultures: loadContent().onomastics };

  it("offers the requested count of distinct culture-appropriate surnames", () => {
    const culture = getCulture(onomastics, "irish_catholic");
    const offer = suggestSurnames(culture, createRng("seed-1"), 3);
    expect(offer).toHaveLength(3);
    expect(new Set(offer).size).toBe(3);
    for (const s of offer) expect(culture.surnames).toContain(s);
  });

  it("is seeded + deterministic (same culture + seed → same offer)", () => {
    const culture = getCulture(onomastics, "bavarian_german");
    expect(suggestSurnames(culture, createRng("xyz"), 3)).toEqual(
      suggestSurnames(culture, createRng("xyz"), 3),
    );
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

describe("onboarding founding (determinism + no leaks)", () => {
  const content = loadContent();

  it("the same seed → the same dealt origin (deterministic deal)", () => {
    const a = dealComposition(content.places, content.eras, "fixed-seed");
    const b = dealComposition(content.places, content.eras, "fixed-seed");
    expect(a).toEqual(b);
  });

  it("a founded run with a bestowed surname traces leak-free", () => {
    const seed = "ob-found-seed";
    const dealt = dealComposition(content.places, content.eras, seed);
    const culture = getCulture({ cultures: content.onomastics }, dealt.culture);
    const surname = suggestSurnames(culture, createRng(`${seed}::surname-offer`), 3)[0];
    if (!surname) throw new Error("no surname suggestion");
    const composition = dealComposition(content.places, content.eras, seed, surname);
    const founded = foundByComposition(content, composition).state;
    expect(founded.flags).toContain("founded_line");
    const trace = tracePlaythrough(content, composition);
    expect(validateTrace(trace).filter((f) => f.kind === "leak")).toEqual([]);
    expect(trace.finalName.endsWith(` ${surname}`)).toBe(true);
  });
});

describe("OB-5 authored-Epoch-0 self-exclusion (single flag, no per-place list)", () => {
  const content = loadContent();

  const found = (place: string) =>
    foundByComposition(content, {
      place,
      era: "origins",
      culture: content.places.find((p) => p.id === place)?.defaultCulture ?? "scots_irish",
      year: 1885,
      archetype: "economic",
      gender: "male",
      surname: "Testfounder",
      seed: "ob5-seed",
      originId: `composed:${place}:origins`,
    }).state;

  it("derives the authored-Epoch-0 places from content (each opens on its own birth beat)", () => {
    // Every place with an authored birth beat must be in the derived set.
    for (const place of ["ireland", "bavaria", "south_africa", "west_coast"]) {
      expect(content.authoredEpoch0Places.has(place)).toBe(true);
    }
  });

  it("stamps has_authored_epoch0 ONLY for places that ship an authored Epoch-0", () => {
    for (const place of content.authoredEpoch0Places) {
      expect(found(place).flags).toContain("has_authored_epoch0");
    }
    // A place WITHOUT an authored Epoch-0 falls back to the generic beats — no flag.
    const generic = [...content.places.map((p) => p.id)].find(
      (id) => !content.authoredEpoch0Places.has(id),
    );
    if (generic) expect(found(generic).flags).not.toContain("has_authored_epoch0");
  });

  it("the authored places each carry a six-archetype crystallization (no calling dead-ends)", () => {
    const SIX = [
      "athletic",
      "economic",
      "entertainment",
      "political",
      "religious",
      "technological",
    ];
    for (const place of content.authoredEpoch0Places) {
      const calling = content.epoch0Events.find(
        (e) => e.place === place && e.id.includes("calling_crystall"),
      );
      if (!calling) continue; // not every authored place has reached the calling beat yet
      const archetypes = calling.choices
        .map((c) => c.setsArchetype)
        .filter((a) => Boolean(a))
        .sort();
      expect(archetypes).toEqual(SIX);
    }
  });
});
