import { describe, expect, it } from "vitest";
import { structuralFingerprint, uniquenessReport } from "../uniquenessMetric";

/**
 * CONTENT-UNIQUENESS-AUDIT — the structural-sameness metric + a RATCHET on the current corpus.
 *
 * The corpus today is structurally UNIFORM: a prior audit found one skeleton stamped across the acts, and this
 * metric quantifies it (all lineage files share the same per-scene sense/beat/decision shape). These tests:
 *  1. prove the fingerprint + report math is correct, and
 *  2. record the (bad) baseline as a RATCHET — the distinct-fingerprint ratio must not get WORSE, and the
 *     eventual diversifying rewrite will RAISE this floor as it lands. (We assert a floor, not goodness — the
 *     corpus is NOT yet diverse; pretending otherwise would hide the very problem this milestone surfaces.)
 */

const report = uniquenessReport();

describe("structural uniqueness metric", () => {
  it("structuralFingerprint is prose-INDEPENDENT (same shape, different words → same fingerprint)", () => {
    const shapeA = [
      { id: "a", sense: "smell", prose: ["putrid hold, tallow and brine"], beats: [] },
      {
        id: "b",
        sense: "sight",
        prose: ["the new shore"],
        beats: [{}],
        decision: { prompt: "?", options: [] },
      },
    ] as unknown as Parameters<typeof structuralFingerprint>[0];
    const shapeB = [
      { id: "x", sense: "smell", prose: ["salt-rot and cabbage steam"], beats: [] },
      {
        id: "y",
        sense: "sight",
        prose: ["a different coast"],
        beats: [{}],
        decision: { prompt: "!", options: [] },
      },
    ] as unknown as Parameters<typeof structuralFingerprint>[0];
    // Identical SHAPE (sense + beat-count + decision flag), different PROSE → identical fingerprint (the sameness
    // this metric is designed to catch — varied words can't hide a stamped skeleton).
    expect(structuralFingerprint(shapeA)).toBe(structuralFingerprint(shapeB));
    expect(structuralFingerprint(shapeA)).toBe("smell:0|sight:1D");

    // A genuinely different shape (sense order / beat count) → a different fingerprint.
    const shapeC = [
      { id: "p", sense: "sound", prose: ["x"], beats: [{}, {}] },
      { id: "q", sense: "smell", prose: ["y"], beats: [] },
    ] as unknown as Parameters<typeof structuralFingerprint>[0];
    expect(structuralFingerprint(shapeC)).not.toBe(structuralFingerprint(shapeA));
  });

  it("the report sums files, distinct fingerprints, the ratio, and the largest cluster", () => {
    expect(report.files).toBeGreaterThan(0);
    expect(report.distinctFingerprints).toBeGreaterThan(0);
    expect(report.distinctFingerprints).toBeLessThanOrEqual(report.files);
    expect(report.distinctRatio).toBeCloseTo(report.distinctFingerprints / report.files, 5);
    expect(report.largestCluster).toBe(report.clusters[0]?.count);
    // Cluster counts sum to the file total (every file lands in exactly one cluster).
    expect(report.clusters.reduce((s, c) => s + c.count, 0)).toBe(report.files);
  });

  it("RATCHET: structural diversity must not regress below today's baseline (and should RISE with the rewrite)", () => {
    // BASELINE (2026-06-24): the corpus is ONE skeleton — distinctRatio = 1/84 ≈ 0.0119, largestCluster = 84.
    // Recorded as a real FLOOR (not a tautology): the ratio must never DROP, so adding more stamped files OR
    // collapsing fingerprints both fail here. The diversifying rewrite (SHAPE-DIVERSIFY-1) RAISES this floor as
    // shapes diverge — this number is deliberately terrible today and asserting >= it guards against regress.
    const BASELINE_RATIO = 0.0119; // = 1/84; bump UP as the rewrite diversifies shapes
    expect(report.distinctRatio).toBeGreaterThanOrEqual(BASELINE_RATIO);
    // The dominant skeleton must not SPREAD to more files than today (84). A regression that re-stamps files
    // onto one shape would push this above 84 only if files were added — and the ratio floor already catches
    // that — but pinning the absolute count makes the "one skeleton must shrink, never grow" intent explicit.
    expect(report.largestCluster).toBeLessThanOrEqual(84);
  });
});
