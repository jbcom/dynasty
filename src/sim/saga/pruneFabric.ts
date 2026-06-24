import { auditProseQuality, type ProseQualityReport } from "../proseQuality";

export type PruneMode = "one" | "n" | "auto" | "all";

export interface FabricEntry {
  sceneId: string;
  tier: number;
  score: number;
  maxSimilarity?: number;
  settings: string[];
  vignettes: string[];
}

export interface FabricIndex {
  generated: string;
  keepFraction: number;
  totalScenes: number;
  keptScenes: number;
  byEra: Record<string, number>;
  fabric: Record<string, Record<string, FabricEntry[]>>;
  [key: string]: unknown;
}

export interface CheapPruneSignals {
  wordCount: number;
  averageSentenceWords: number;
  maxSentenceWords: number;
  longSentenceRatio: number;
  emptySettings: boolean;
  maxSimilarity: number;
  duplicateLeadCount: number;
}

export interface PruneCandidate {
  wave: string;
  era: string;
  index: number;
  entry: FabricEntry;
  cheapScore: number;
  cheapSignals: CheapPruneSignals;
}

export interface AuditedPruneCandidate extends PruneCandidate {
  report: ProseQualityReport;
}

export interface PruneTransaction {
  ts: string;
  type: `fabric-prune-${PruneMode}`;
  sceneId: string;
  wave: string;
  era: string;
  tier: number;
  reason: string;
  gap: string;
  source: string;
}

export interface PruneSelectionOptions {
  autoCandidatePoolSize?: number;
}

export const PRUNE_AUTO_CANDIDATE_POOL_SIZE = 64;
export const PRUNE_ALL_SCAN_SCORE_THRESHOLD = 0.2;
export const PRUNE_ALL_AVG_SENTENCE_WORDS_THRESHOLD = 40;
export const PRUNE_ALL_CHEAP_SCORE_THRESHOLD = 1.1;

const CHEAP_SCORE_AVG_SENTENCE_WORDS_THRESHOLD = 32;
const CHEAP_SCORE_AVG_SENTENCE_WORDS_SCALE = 28;
const CHEAP_SCORE_LONG_SENTENCE_WORD_COUNT = 36;
const CHEAP_SCORE_MAX_SENTENCE_WORDS_THRESHOLD = 48;
const CHEAP_SCORE_MAX_SENTENCE_WORDS_SCALE = 40;
const CHEAP_SCORE_WORD_COUNT_THRESHOLD = 120;
const CHEAP_SCORE_WORD_COUNT_SCALE = 160;
const CHEAP_SCORE_EMPTY_SETTINGS_PENALTY = 0.25;
const CHEAP_SCORE_SIMILARITY_THRESHOLD = 0.72;
const CHEAP_SCORE_SIMILARITY_SCALE = 0.28;
const CHEAP_SCORE_DUPLICATE_LEAD_PENALTY = 0.18;
const CHEAP_SCORE_DUPLICATE_LEAD_CAP = 0.54;

const LEAD_STOP = new Set([
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
  "into",
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
  "he",
  "she",
  "had",
  "has",
  "have",
  "not",
  "no",
]);

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
}

function sentenceWordCounts(text: string): number[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => words(sentence).length)
    .filter((count) => count > 0);
}

function round(n: number, places = 3): number {
  const mult = 10 ** places;
  return Math.round(n * mult) / mult;
}

function entryText(entry: FabricEntry): string {
  return entry.vignettes.join(" ");
}

function leadKey(entry: FabricEntry): string {
  return words(entryText(entry))
    .filter((word) => !LEAD_STOP.has(word))
    .slice(0, 3)
    .join(" ");
}

function compareCheapPruneCandidates(a: PruneCandidate, b: PruneCandidate): number {
  return b.cheapScore - a.cheapScore || a.entry.sceneId.localeCompare(b.entry.sceneId);
}

export function cheapPruneSignals(entry: FabricEntry, duplicateLeadCount = 1): CheapPruneSignals {
  const text = entryText(entry);
  const counts = sentenceWordCounts(text);
  const wordCount = words(text).length;
  const averageSentenceWords = counts.length
    ? counts.reduce((sum, count) => sum + count, 0) / counts.length
    : wordCount;
  const maxSentenceWords = Math.max(0, ...counts);
  const longSentenceRatio = counts.length
    ? counts.filter((count) => count >= CHEAP_SCORE_LONG_SENTENCE_WORD_COUNT).length / counts.length
    : 0;
  return {
    wordCount,
    averageSentenceWords,
    maxSentenceWords,
    longSentenceRatio,
    emptySettings: entry.settings.length === 0,
    maxSimilarity: entry.maxSimilarity ?? 0,
    duplicateLeadCount,
  };
}

export function cheapPruneScore(signals: CheapPruneSignals): number {
  return (
    Math.max(0, signals.averageSentenceWords - CHEAP_SCORE_AVG_SENTENCE_WORDS_THRESHOLD) /
      CHEAP_SCORE_AVG_SENTENCE_WORDS_SCALE +
    Math.max(0, signals.maxSentenceWords - CHEAP_SCORE_MAX_SENTENCE_WORDS_THRESHOLD) /
      CHEAP_SCORE_MAX_SENTENCE_WORDS_SCALE +
    signals.longSentenceRatio +
    Math.max(0, signals.wordCount - CHEAP_SCORE_WORD_COUNT_THRESHOLD) /
      CHEAP_SCORE_WORD_COUNT_SCALE +
    (signals.emptySettings ? CHEAP_SCORE_EMPTY_SETTINGS_PENALTY : 0) +
    Math.max(0, signals.maxSimilarity - CHEAP_SCORE_SIMILARITY_THRESHOLD) /
      CHEAP_SCORE_SIMILARITY_SCALE +
    Math.min(
      CHEAP_SCORE_DUPLICATE_LEAD_CAP,
      Math.max(0, signals.duplicateLeadCount - 1) * CHEAP_SCORE_DUPLICATE_LEAD_PENALTY,
    )
  );
}

export function collectPruneCandidates(index: FabricIndex): PruneCandidate[] {
  const base: Array<Omit<PruneCandidate, "cheapScore" | "cheapSignals">> = [];
  const leadCounts = new Map<string, number>();
  for (const [wave, eras] of Object.entries(index.fabric)) {
    for (const [era, list] of Object.entries(eras)) {
      for (let i = 0; i < list.length; i += 1) {
        const entry = list[i];
        if (!entry || entry.vignettes.length === 0) continue;
        base.push({ wave, era, index: i, entry });
        const key = leadKey(entry);
        if (key) leadCounts.set(key, (leadCounts.get(key) ?? 0) + 1);
      }
    }
  }

  return base.map((candidate) => {
    const key = leadKey(candidate.entry);
    const signals = cheapPruneSignals(candidate.entry, key ? (leadCounts.get(key) ?? 1) : 1);
    return {
      ...candidate,
      cheapSignals: signals,
      cheapScore: round(cheapPruneScore(signals)),
    };
  });
}

export function auditPruneCandidate(candidate: PruneCandidate): AuditedPruneCandidate {
  return {
    ...candidate,
    report: auditProseQuality(
      `fabric:${candidate.wave}:${candidate.era}:${candidate.entry.sceneId}`,
      candidate.entry.vignettes,
    ),
  };
}

export function compareAuditedPruneCandidates(
  a: AuditedPruneCandidate,
  b: AuditedPruneCandidate,
): number {
  return (
    Number(a.report.pass) - Number(b.report.pass) ||
    a.report.scanScore - b.report.scanScore ||
    a.report.clarityScore - b.report.clarityScore ||
    a.report.consistencyScore - b.report.consistencyScore ||
    b.cheapSignals.maxSimilarity - a.cheapSignals.maxSimilarity ||
    b.cheapScore - a.cheapScore ||
    b.report.averageSentenceWords - a.report.averageSentenceWords ||
    a.entry.sceneId.localeCompare(b.entry.sceneId)
  );
}

export function selectPruneCandidates(
  index: FabricIndex,
  mode: PruneMode,
  count = 1,
  options: PruneSelectionOptions = {},
): AuditedPruneCandidate[] {
  let candidates = collectPruneCandidates(index);
  if (mode === "auto") {
    const poolSize = options.autoCandidatePoolSize ?? PRUNE_AUTO_CANDIDATE_POOL_SIZE;
    candidates = candidates
      .sort(compareCheapPruneCandidates)
      .slice(0, Math.min(poolSize, candidates.length));
  }

  const audited = candidates.map(auditPruneCandidate).sort(compareAuditedPruneCandidates);
  if (mode === "all") {
    return audited.filter(
      (candidate) =>
        !candidate.report.pass &&
        (candidate.report.scanScore < PRUNE_ALL_SCAN_SCORE_THRESHOLD ||
          candidate.report.averageSentenceWords > PRUNE_ALL_AVG_SENTENCE_WORDS_THRESHOLD ||
          candidate.cheapScore >= PRUNE_ALL_CHEAP_SCORE_THRESHOLD),
    );
  }

  return audited.slice(0, Math.max(1, count));
}

function recomputeCounts(fabric: FabricIndex["fabric"]): {
  keptScenes: number;
  byEra: Record<string, number>;
} {
  const byEra: Record<string, number> = {};
  let keptScenes = 0;
  for (const eras of Object.values(fabric)) {
    for (const [era, list] of Object.entries(eras)) {
      byEra[era] = (byEra[era] ?? 0) + list.length;
      keptScenes += list.length;
    }
  }
  return { keptScenes, byEra };
}

export function applyPruneToIndex(
  index: FabricIndex,
  picked: AuditedPruneCandidate[],
): FabricIndex {
  const pickedIds = new Set(picked.map((candidate) => candidate.entry.sceneId));
  const fabric: FabricIndex["fabric"] = {};
  for (const [wave, eras] of Object.entries(index.fabric)) {
    const waveFabric: Record<string, FabricEntry[]> = {};
    fabric[wave] = waveFabric;
    for (const [era, list] of Object.entries(eras)) {
      waveFabric[era] = list.filter((entry) => !pickedIds.has(entry.sceneId));
    }
  }

  const counts = recomputeCounts(fabric);
  return {
    ...index,
    keptScenes: counts.keptScenes,
    byEra: Object.fromEntries(
      [...new Set([...Object.keys(index.byEra ?? {}), ...Object.keys(counts.byEra)])].map((era) => [
        era,
        counts.byEra[era] ?? 0,
      ]),
    ),
    fabric,
  };
}

function sourceForMode(mode: PruneMode, count?: number): string {
  if (mode === "n") return `scripts/mine-fabric.ts --prune-n ${count ?? 1}`;
  return `scripts/mine-fabric.ts --prune-${mode}`;
}

export function buildPruneTransactions(
  mode: PruneMode,
  picked: AuditedPruneCandidate[],
  timestamp: string,
  count?: number,
): PruneTransaction[] {
  return picked.map((pick) => ({
    ts: timestamp,
    type: `fabric-prune-${mode}`,
    sceneId: pick.entry.sceneId,
    wave: pick.wave,
    era: pick.era,
    tier: pick.entry.tier,
    reason: [
      "Removed played-fabric item",
      `scanScore ${pick.report.scanScore}`,
      `clarityScore ${pick.report.clarityScore}`,
      `Flesch reading ease ${pick.report.fleschReadingEase}`,
      `Flesch-Kincaid ${pick.report.fleschKincaidGrade}`,
      `average sentence ${pick.report.averageSentenceWords} words`,
      `maxSimilarity ${round(pick.cheapSignals.maxSimilarity)}`,
      `duplicate lead count ${pick.cheapSignals.duplicateLeadCount}`,
      `cheap pre-read score ${pick.cheapScore}`,
    ].join("; "),
    gap: `${pick.era} ${pick.wave} tier-${pick.entry.tier} ${pick.entry.sceneId} needs a rewritten non-first-person replacement that serves the one-dynasty spine without dense or duplicative legacy prose.`,
    source: sourceForMode(mode, count),
  }));
}
