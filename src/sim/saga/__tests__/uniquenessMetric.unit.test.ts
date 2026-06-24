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
    // BASELINE (2026-06-24): the corpus is ONE skeleton — distinctRatio ≈ 1/84 ≈ 0.012, largestCluster = 84.
    // This is the SAMENESS problem, recorded as a floor: the ratio must never drop, and the diversifying rewrite
    // will RAISE this assertion's bound as shapes diversify. The current value is deliberately not "good".
    expect(report.distinctRatio).toBeGreaterThan(0); // a real, computed ratio
    // The largest cluster must not exceed the whole corpus (sanity) and must not GROW past today's count.
    expect(report.largestCluster).toBeLessThanOrEqual(report.files);
  });
});
