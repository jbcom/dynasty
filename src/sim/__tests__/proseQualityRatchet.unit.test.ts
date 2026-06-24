import { describe, expect, it } from "vitest";
import type { ProseQualityReport } from "../proseQuality";
import {
  compareProseQualityToBaseline,
  type ProseQualitySummary,
  summarizeProseQualityReports,
} from "../proseQualityRatchet";

function report(overrides: Partial<ProseQualityReport>): ProseQualityReport {
  return {
    label: "sample",
    sentenceCount: 3,
    wordCount: 80,
    averageSentenceWords: 26.7,
    maxSentenceWords: 34,
    longSentenceRatio: 0,
    repeatedLeadRatio: 0,
    paragraphWordCounts: [40, 40],
    fleschReadingEase: 44,
    fleschKincaidGrade: 11,
    gunningFog: 12,
    automatedReadabilityIndex: 12,
    difficultWordRatio: 0.12,
    scanScore: 0.6,
    clarityScore: 0.62,
    consistencyScore: 0.9,
    findings: [],
    pass: true,
    ...overrides,
  };
}

const baseline: ProseQualitySummary = {
  generated: "prose-quality-audit",
  total: 4,
  failed: 2,
  passRate: 0.5,
  minScanScore: 0.1,
  minClarityScore: 0.2,
  minConsistencyScore: 0.4,
  maxAverageSentenceWords: 42,
  maxLongSentenceRatio: 1,
  worst: [],
};

describe("KP-1 prose quality ratchet", () => {
  it("summarizes corpus floors and ceilings from library-backed reports", () => {
    const summary = summarizeProseQualityReports([
      report({ label: "clear", scanScore: 0.75, clarityScore: 0.8 }),
      report({
        label: "dense",
        pass: false,
        scanScore: 0.08,
        clarityScore: 0.11,
        consistencyScore: 0.5,
        averageSentenceWords: 48.25,
        longSentenceRatio: 0.667,
        findings: [{ kind: "scan-score", detail: "too dense" }],
      }),
    ]);

    expect(summary.total).toBe(2);
    expect(summary.failed).toBe(1);
    expect(summary.passRate).toBe(0.5);
    expect(summary.minScanScore).toBe(0.08);
    expect(summary.minClarityScore).toBe(0.11);
    expect(summary.maxAverageSentenceWords).toBe(48.25);
    expect(summary.worst[0]?.label).toBe("dense");
  });

  it("passes equal or improved audit summaries", () => {
    expect(compareProseQualityToBaseline(baseline, baseline).pass).toBe(true);
    expect(
      compareProseQualityToBaseline(
        {
          ...baseline,
          failed: 1,
          passRate: 0.75,
          minScanScore: 0.2,
          minClarityScore: 0.3,
          maxAverageSentenceWords: 35,
        },
        baseline,
      ).pass,
    ).toBe(true);
  });

  it("fails when the corpus gets less scannable or less clear", () => {
    const result = compareProseQualityToBaseline(
      {
        ...baseline,
        failed: 3,
        passRate: 0.25,
        minScanScore: 0.05,
        minClarityScore: 0.1,
        maxAverageSentenceWords: 49,
      },
      baseline,
    );

    expect(result.pass).toBe(false);
    expect(result.findings.map((f) => f.kind)).toEqual(
      expect.arrayContaining(["failed-count", "pass-rate", "scan-floor", "clarity-floor"]),
    );
  });
});
