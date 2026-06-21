import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { foundByComposition } from "../founding";
import { type Trace, tracePlaythrough, validateTrace } from "../harness";

/**
 * SS-15 — the Convergence-Saga ACCEPTANCE GATE. A representative full playthrough must:
 *  (1) fire a substantial beat count (an hour+ of narrative at a reading pace),
 *  (2) replay BIT-IDENTICALLY from the same seed + composition (incl. determinism end to end),
 *  (3) carry 0 preset-person leaks.
 * We measure the LONGEST trace across the wave roster (a line that survives + climbs) — short
 * runs (early death / line failure) are valid short tragedies, not the hour-target case.
 */

const content = loadContent();

/** The wave starting lines (playable origins). */
const waves = content.places.filter((p) => p.kind !== "destination");

function comp(placeId: string, seed: string) {
  const def = content.places.find((p) => p.id === placeId);
  if (!def) throw new Error(`no place ${placeId}`);
  return {
    place: placeId,
    era: def.validEras[0] ?? "origins",
    culture: def.defaultCulture,
    year: 1885,
    archetype: "economic" as const,
    gender: "male" as const,
    surname: "Acceptance",
    seed,
    originId: `composed:${placeId}:origins`,
  };
}

describe("SS-15 acceptance gate", () => {
  it("a representative full playthrough fires an hour+ of beats (>= 80)", () => {
    // The deepest run across the roster represents a line that survives + climbs — the hour case.
    let best = 0;
    for (const w of waves) {
      const trace: Trace = tracePlaythrough(content, comp(w.id, `accept-${w.id}`));
      best = Math.max(best, trace.beats.length);
    }
    // ~80+ beats at a narrative reading pace (~30-45s/beat) clears an hour.
    expect(best).toBeGreaterThanOrEqual(80);
  });

  it("every wave founds + traces with ZERO preset-person leaks", () => {
    for (const w of waves) {
      const trace = tracePlaythrough(content, comp(w.id, `leak-${w.id}`));
      expect(
        validateTrace(trace).filter((f) => f.kind === "leak"),
        w.id,
      ).toEqual([]);
    }
  });

  it("replays bit-identically from the same seed + composition (determinism)", () => {
    const c = comp("ireland", "determinism-seed");
    const a = tracePlaythrough(content, c);
    const b = tracePlaythrough(content, c);
    expect(a.beats.map((x) => x.eventId ?? x)).toEqual(b.beats.map((x) => x.eventId ?? x));
    expect(a.finalName).toBe(b.finalName);
    // founding is deterministic too.
    expect(foundByComposition(content, c).state.flags).toEqual(
      foundByComposition(content, c).state.flags,
    );
  });
});
