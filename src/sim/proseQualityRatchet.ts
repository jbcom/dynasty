import type { ProseQualityFinding, ProseQualityReport } from "./proseQuality";

export interface ProseQualityWorstEntry {
  label: string;
  pass: boolean;
  scanScore: number;
  clarityScore: number;
  consistencyScore: number;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  averageSentenceWords: number;
  maxSentenceWords: number;
  findings: ProseQualityFinding[];
}

export interface ProseQualitySummary {
  generated: "prose-quality-audit";
  total: number;
  failed: number;
  passRate: number;
  minScanScore: number;
  minClarityScore: number;
  minConsistencyScore: number;
  maxAverageSentenceWords: number;
  maxLongSentenceRatio: number;
  worst: ProseQualityWorstEntry[];
}

export interface ProseQualityRatchetFinding {
  kind:
    | "failed-count"
    | "pass-rate"
    | "scan-floor"
    | "clarity-floor"
    | "consistency-floor"
    | "sentence-load-ceiling"
    | "long-sentence-ceiling";
  detail: string;
}

export interface ProseQualityRatchetResult {
  baseline: Pick<
    ProseQualitySummary,
    | "total"
    | "failed"
    | "passRate"
    | "minScanScore"
    | "minClarityScore"
    | "minConsistencyScore"
    | "maxAverageSentenceWords"
    | "maxLongSentenceRatio"
  >;
  pass: boolean;
  findings: ProseQualityRatchetFinding[];
}

function round(n: number, places = 3): number {
  const mult = 10 ** places;
  return Math.round(n * mult) / mult;
}

function minOf(reports: ProseQualityReport[], pick: (r: ProseQualityReport) => number): number {
  return reports.length === 0 ? 0 : Math.min(...reports.map(pick));
}

function maxOf(reports: ProseQualityReport[], pick: (r: ProseQualityReport) => number): number {
  return reports.length === 0 ? 0 : Math.max(...reports.map(pick));
}

export function summarizeProseQualityReports(reports: ProseQualityReport[]): ProseQualitySummary {
  const failed = reports.filter((r) => !r.pass);
  const worst = [...reports]
    .sort(
      (a, b) =>
        a.scanScore - b.scanScore ||
        a.clarityScore - b.clarityScore ||
        b.findings.length - a.findings.length,
    )
    .slice(0, 12)
    .map((r) => ({
      label: r.label,
      pass: r.pass,
      scanScore: r.scanScore,
      clarityScore: r.clarityScore,
      consistencyScore: r.consistencyScore,
      fleschReadingEase: r.fleschReadingEase,
      fleschKincaidGrade: r.fleschKincaidGrade,
      averageSentenceWords: r.averageSentenceWords,
      maxSentenceWords: r.maxSentenceWords,
      findings: r.findings,
    }));

  return {
    generated: "prose-quality-audit",
    total: reports.length,
    failed: failed.length,
    passRate: reports.length === 0 ? 1 : round((reports.length - failed.length) / reports.length),
    minScanScore: round(minOf(reports, (r) => r.scanScore)),
    minClarityScore: round(minOf(reports, (r) => r.clarityScore)),
    minConsistencyScore: round(minOf(reports, (r) => r.consistencyScore)),
    maxAverageSentenceWords: round(
      maxOf(reports, (r) => r.averageSentenceWords),
      2,
    ),
    maxLongSentenceRatio: round(maxOf(reports, (r) => r.longSentenceRatio)),
    worst,
  };
}

function below(current: number, baseline: number): boolean {
  return current + 0.000_5 < baseline;
}

function above(current: number, baseline: number): boolean {
  return current > baseline + 0.000_5;
}

export function compareProseQualityToBaseline(
  current: ProseQualitySummary,
  baseline: ProseQualitySummary,
): ProseQualityRatchetResult {
  const findings: ProseQualityRatchetFinding[] = [];
  const add = (kind: ProseQualityRatchetFinding["kind"], detail: string) =>
    findings.push({ kind, detail });

  if (current.failed > baseline.failed) {
    add("failed-count", `failed surfaces ${current.failed} above baseline ${baseline.failed}`);
  }
  if (below(current.passRate, baseline.passRate)) {
    add("pass-rate", `pass rate ${current.passRate} below baseline ${baseline.passRate}`);
  }
  if (below(current.minScanScore, baseline.minScanScore)) {
    add(
      "scan-floor",
      `min scan score ${current.minScanScore} below baseline ${baseline.minScanScore}`,
    );
  }
  if (below(current.minClarityScore, baseline.minClarityScore)) {
    add(
      "clarity-floor",
      `min clarity score ${current.minClarityScore} below baseline ${baseline.minClarityScore}`,
    );
  }
  if (below(current.minConsistencyScore, baseline.minConsistencyScore)) {
    add(
      "consistency-floor",
      `min consistency score ${current.minConsistencyScore} below baseline ${baseline.minConsistencyScore}`,
    );
  }
  if (above(current.maxAverageSentenceWords, baseline.maxAverageSentenceWords)) {
    add(
      "sentence-load-ceiling",
      `max average sentence ${current.maxAverageSentenceWords} above baseline ${baseline.maxAverageSentenceWords}`,
    );
  }
  if (above(current.maxLongSentenceRatio, baseline.maxLongSentenceRatio)) {
    add(
      "long-sentence-ceiling",
      `max long-sentence ratio ${current.maxLongSentenceRatio} above baseline ${baseline.maxLongSentenceRatio}`,
    );
  }

  return {
    baseline: {
      total: baseline.total,
      failed: baseline.failed,
      passRate: baseline.passRate,
      minScanScore: baseline.minScanScore,
      minClarityScore: baseline.minClarityScore,
      minConsistencyScore: baseline.minConsistencyScore,
      maxAverageSentenceWords: baseline.maxAverageSentenceWords,
      maxLongSentenceRatio: baseline.maxLongSentenceRatio,
    },
    pass: findings.length === 0,
    findings,
  };
}
