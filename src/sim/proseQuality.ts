import readability from "text-readability";

/**
 * PROSE QUALITY (KP-1) — library-backed scannability/clarity/consistency signals for the narrative
 * surfaces. This does not replace editorial review; it gives the repo a deterministic gate for the
 * failure modes that make a text-heavy game exhausting: long sentence runs, overly dense grade level,
 * repetitive openings, and uneven paragraph load.
 */

export interface ProseQualityThresholds {
  minFleschReadingEase: number;
  maxFleschKincaidGrade: number;
  maxAverageSentenceWords: number;
  maxLongSentenceRatio: number;
  maxRepeatedLeadRatio: number;
  minScanScore: number;
  minClarityScore: number;
  minConsistencyScore: number;
}

export interface ProseQualityFinding {
  kind:
    | "readability"
    | "grade"
    | "sentence-load"
    | "long-sentence-ratio"
    | "repeated-leads"
    | "scan-score"
    | "clarity-score"
    | "consistency-score";
  detail: string;
}

export interface ProseQualityReport {
  label: string;
  sentenceCount: number;
  wordCount: number;
  averageSentenceWords: number;
  maxSentenceWords: number;
  longSentenceRatio: number;
  repeatedLeadRatio: number;
  paragraphWordCounts: number[];
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFog: number;
  automatedReadabilityIndex: number;
  difficultWordRatio: number;
  scanScore: number;
  clarityScore: number;
  consistencyScore: number;
  findings: ProseQualityFinding[];
  pass: boolean;
}

export const DEFAULT_PROSE_QUALITY_THRESHOLDS: ProseQualityThresholds = {
  // Literary prose can be denser than UI microcopy, but below this it becomes a slog in repeated play.
  minFleschReadingEase: 22,
  maxFleschKincaidGrade: 15.5,
  maxAverageSentenceWords: 32,
  maxLongSentenceRatio: 0.36,
  maxRepeatedLeadRatio: 0.25,
  minScanScore: 0.45,
  minClarityScore: 0.45,
  minConsistencyScore: 0.45,
};

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "of",
  "to",
  "in",
  "on",
  "at",
  "for",
  "with",
  "as",
  "by",
  "from",
  "that",
  "this",
  "was",
  "were",
  "is",
  "are",
  "be",
  "it",
  "its",
  "his",
  "her",
  "their",
  "your",
  "you",
  "they",
]);

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function safeMetric(fn: (text: string) => number, text: string): number {
  const n = fn(text);
  return Number.isFinite(n) ? n : 0;
}

function cleanText(parts: string[]): string {
  return parts
    .join("\n\n")
    .replace(/\{(?:given_name|surname|full_name|family_name|birth_date)\}/g, "family")
    .replace(/\s+/g, " ")
    .trim();
}

function wordsOf(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? []).filter(Boolean);
}

function sentenceTexts(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function repeatedLeadRatio(sentences: string[]): number {
  const leads = sentences
    .map((s) =>
      wordsOf(s)
        .filter((w) => !STOP.has(w))
        .slice(0, 3)
        .join(" "),
    )
    .filter(Boolean);
  if (leads.length === 0) return 0;
  return (leads.length - new Set(leads).size) / leads.length;
}

function round(n: number, places = 3): number {
  const mult = 10 ** places;
  return Math.round(n * mult) / mult;
}

export function auditProseQuality(
  label: string,
  parts: string[],
  thresholds: ProseQualityThresholds = DEFAULT_PROSE_QUALITY_THRESHOLDS,
): ProseQualityReport {
  const text = cleanText(parts);
  const sentences = sentenceTexts(text);
  const sentenceWordCounts = sentences.map((s) => wordsOf(s).length).filter((n) => n > 0);
  const wordCount = safeMetric((t) => readability.lexiconCount(t), text) || wordsOf(text).length;
  const sentenceCount =
    safeMetric((t) => readability.sentenceCount(t), text) || Math.max(1, sentences.length);
  const averageSentenceWords = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const maxSentenceWords = Math.max(0, ...sentenceWordCounts);
  const longSentenceRatio =
    sentenceWordCounts.length === 0
      ? 0
      : sentenceWordCounts.filter((n) => n >= 36).length / sentenceWordCounts.length;
  const paragraphWordCounts = parts.map((p) => wordsOf(p).length);
  const paragraphMean = mean(paragraphWordCounts);
  const paragraphCv = paragraphMean === 0 ? 0 : stdev(paragraphWordCounts) / paragraphMean;
  const repeatedLeads = repeatedLeadRatio(sentences);

  const fleschReadingEase = safeMetric((t) => readability.fleschReadingEase(t), text);
  const fleschKincaidGrade = safeMetric((t) => readability.fleschKincaidGrade(t), text);
  const gunningFog = safeMetric((t) => readability.gunningFog(t), text);
  const automatedReadabilityIndex = safeMetric(
    (t) => readability.automatedReadabilityIndex(t),
    text,
  );
  const difficultWords = safeMetric((t) => readability.difficultWords(t), text);
  const difficultWordRatio = wordCount > 0 ? difficultWords / wordCount : 0;

  const readabilityScore = clamp01((fleschReadingEase - 12) / 58);
  const gradeScore = clamp01((18 - fleschKincaidGrade) / 10);
  const sentenceLoadScore = clamp01((38 - averageSentenceWords) / 22);
  const maxSentenceScore = clamp01((64 - maxSentenceWords) / 38);
  const longSentenceScore = clamp01(1 - longSentenceRatio * 1.8);
  const difficultWordScore = clamp01((0.28 - difficultWordRatio) / 0.28);
  const repetitionScore = clamp01(1 - repeatedLeads * 2.2);
  const paragraphScore = clamp01(1 - Math.max(0, paragraphCv - 0.35) / 0.85);

  const scanScore = mean([readabilityScore, gradeScore, sentenceLoadScore, longSentenceScore]);
  const clarityScore = mean([sentenceLoadScore, maxSentenceScore, difficultWordScore]);
  const consistencyScore = mean([repetitionScore, paragraphScore]);

  const findings: ProseQualityFinding[] = [];
  const add = (kind: ProseQualityFinding["kind"], detail: string) =>
    findings.push({ kind, detail });
  if (fleschReadingEase < thresholds.minFleschReadingEase) {
    add(
      "readability",
      `Flesch reading ease ${round(fleschReadingEase, 1)} below ${thresholds.minFleschReadingEase}`,
    );
  }
  if (fleschKincaidGrade > thresholds.maxFleschKincaidGrade) {
    add(
      "grade",
      `Flesch-Kincaid grade ${round(fleschKincaidGrade, 1)} above ${thresholds.maxFleschKincaidGrade}`,
    );
  }
  if (averageSentenceWords > thresholds.maxAverageSentenceWords) {
    add(
      "sentence-load",
      `average sentence ${round(averageSentenceWords, 1)} words above ${thresholds.maxAverageSentenceWords}`,
    );
  }
  if (longSentenceRatio > thresholds.maxLongSentenceRatio) {
    add(
      "long-sentence-ratio",
      `${round(longSentenceRatio * 100, 1)}% long sentences above ${round(thresholds.maxLongSentenceRatio * 100, 1)}%`,
    );
  }
  if (repeatedLeads > thresholds.maxRepeatedLeadRatio) {
    add(
      "repeated-leads",
      `${round(repeatedLeads * 100, 1)}% repeated sentence leads above ${round(thresholds.maxRepeatedLeadRatio * 100, 1)}%`,
    );
  }
  if (scanScore < thresholds.minScanScore) {
    add("scan-score", `scan score ${round(scanScore)} below ${thresholds.minScanScore}`);
  }
  if (clarityScore < thresholds.minClarityScore) {
    add(
      "clarity-score",
      `clarity score ${round(clarityScore)} below ${thresholds.minClarityScore}`,
    );
  }
  if (consistencyScore < thresholds.minConsistencyScore) {
    add(
      "consistency-score",
      `consistency score ${round(consistencyScore)} below ${thresholds.minConsistencyScore}`,
    );
  }

  return {
    label,
    sentenceCount,
    wordCount,
    averageSentenceWords: round(averageSentenceWords, 2),
    maxSentenceWords,
    longSentenceRatio: round(longSentenceRatio),
    repeatedLeadRatio: round(repeatedLeads),
    paragraphWordCounts,
    fleschReadingEase: round(fleschReadingEase, 1),
    fleschKincaidGrade: round(fleschKincaidGrade, 1),
    gunningFog: round(gunningFog, 1),
    automatedReadabilityIndex: round(automatedReadabilityIndex, 1),
    difficultWordRatio: round(difficultWordRatio),
    scanScore: round(scanScore),
    clarityScore: round(clarityScore),
    consistencyScore: round(consistencyScore),
    findings,
    pass: findings.length === 0,
  };
}
