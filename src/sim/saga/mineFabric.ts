/**
 * CORPUS MINING (FS-4) — turn the 504-act corpus into the BRANCH FABRIC of the one dynasty spine.
 *
 * The 504 acts share one templated skeleton (the sameness, [[founding-spine-pivot]]). But buried in that
 * bulk are the genuinely STANDOUT, distinctive scenes + crossings. This module is the PURE scoring core
 * that finds them: it ranks every scene primarily on UNIQUENESS (how far its language diverges from the
 * templated mass), then crossing-potential + prose quality + era fit. The runner (scripts/mine-fabric.ts)
 * walks the corpus, scores via these functions, keeps the standouts as fabric, and retires the rest.
 *
 * Pure + deterministic — no DOM, no IO, no RNG. Same corpus → same scores → same kept set.
 */

import { JaroWinklerDistance } from "natural/lib/natural/distance/index.js";

/** The minimal scene shape the miner reads (a subset of the saga Scene). */
export interface MineScene {
  id: string;
  sense: string;
  prose: string[];
  beats?: unknown[];
  thread?: unknown[];
  braidSlots?: Array<{ kind: string; setting?: string; vignette?: string }>;
  decision?: unknown;
}

/** A scored scene, ready to keep-or-retire. */
export interface ScoredScene {
  id: string;
  /** 0..1 composite. Higher = more worth keeping as fabric. */
  score: number;
  /** Highest measured similarity against any other scene in the source corpus. Lower is better. */
  maxSimilarity: number;
  /** The breakdown (for the runner's report + the tests). */
  parts: { uniqueness: number; crossing: number; quality: number; distinctiveness: number };
  /** The settings this scene can braid at (from braidSlots) — the fabric key dimension. */
  settings: string[];
}

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
  "into",
  "that",
  "this",
  "was",
  "were",
  "is",
  "are",
  "be",
  "been",
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
  "so",
  "up",
  "down",
  "out",
  "over",
  "under",
  "through",
  "like",
  "every",
  "all",
  "one",
  "two",
  "three",
]);

/** Tokenize prose into lowercased content words (drops punctuation, digits, stopwords, identity tokens). */
export function contentWords(prose: string[]): string[] {
  return prose
    .join(" ")
    .toLowerCase()
    .replace(/\{[^}]*\}/g, " ") // drop {surname}/{given_name} identity tokens
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
}

function wordCounts(words: string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const word of words) out.set(word, (out.get(word) ?? 0) + 1);
  return out;
}

interface SceneVector {
  id: string;
  bucket: string;
  counts: Map<string, number>;
  magnitude: number;
  signature: string;
}

function sceneSlot(id: string): string {
  const slot = /:([^:]+)$/.exec(id)?.[1] ?? "scene";
  return /^(open|turn|rising|midpoint|close)$/.test(slot) ? slot : "scene";
}

function sceneTier(id: string): string {
  return /:t(\d+):/.exec(id)?.[1] ?? "x";
}

function vectorFor(scene: MineScene): SceneVector {
  const words = contentWords(scene.prose);
  const counts = wordCounts(words);
  let magnitude = 0;
  for (const v of counts.values()) magnitude += v * v;
  return {
    id: scene.id,
    bucket: `${scene.sense}:t${sceneTier(scene.id)}:${sceneSlot(scene.id)}`,
    counts,
    magnitude: Math.sqrt(magnitude),
    signature: signature(words),
  };
}

function cosineSimilarity(a: SceneVector, b: SceneVector): number {
  let dot = 0;
  if (a.magnitude === 0 || b.magnitude === 0) return 0;
  for (const [word, v] of a.counts) dot += v * (b.counts.get(word) ?? 0);
  return dot / (a.magnitude * b.magnitude);
}

function signature(words: string[]): string {
  return [...new Set(words)].sort().join(" ");
}

function vectorSimilarity(a: SceneVector, b: SceneVector): number {
  const cosine = cosineSimilarity(a, b);
  // Jaro-Winkler is the library-backed near-duplicate check; gate it behind cosine so the full 2.5k-scene
  // corpus does not pay expensive string distance on obviously unrelated pairs.
  const lexical =
    cosine >= 0.18
      ? JaroWinklerDistance(a.signature, b.signature, { ignoreCase: true })
      : Math.min(cosine, 0.18);
  return Math.max(0, Math.min(1, cosine * 0.7 + lexical * 0.3));
}

/** Library-backed prose similarity 0..1. Combines content-word cosine with natural's Jaro-Winkler. */
export function sceneSimilarity(a: MineScene, b: MineScene): number {
  return vectorSimilarity(vectorFor(a), vectorFor(b));
}

/** For every scene, measure its nearest neighbor in the corpus. High values are chaff/duplication risk. */
export function maxCorpusSimilarities(scenes: MineScene[]): Map<string, number> {
  const out = new Map<string, number>(scenes.map((s) => [s.id, 0]));
  const vectors = scenes.map(vectorFor);
  const buckets = new Map<string, SceneVector[]>();
  for (const vector of vectors) {
    const list = buckets.get(vector.bucket);
    if (list) list.push(vector);
    else buckets.set(vector.bucket, [vector]);
  }
  for (const bucket of buckets.values()) {
    for (let i = 0; i < bucket.length; i += 1) {
      const a = bucket[i];
      if (!a) continue;
      for (let j = i + 1; j < bucket.length; j += 1) {
        const b = bucket[j];
        if (!b) continue;
        const similarity = vectorSimilarity(a, b);
        out.set(a.id, Math.max(out.get(a.id) ?? 0, similarity));
        out.set(b.id, Math.max(out.get(b.id) ?? 0, similarity));
      }
    }
  }
  return out;
}

/**
 * Build a corpus-wide word-frequency map (how many scenes each content word appears in). This is the
 * basis of UNIQUENESS: words shared across many scenes are the TEMPLATE (smell/tallow/ward/crossroads…),
 * words that appear in few scenes are what makes a scene distinctive.
 */
export function buildDocFreq(scenes: MineScene[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const s of scenes) {
    for (const w of new Set(contentWords(s.prose))) df.set(w, (df.get(w) ?? 0) + 1);
  }
  return df;
}

/**
 * UNIQUENESS score 0..1 — the mean rarity (inverse document frequency, normalized) of a scene's content
 * words against the whole corpus. A scene built from corpus-common words (the template) scores LOW; a
 * scene with rare, specific, singular language scores HIGH. This is the priority signal (FS-4).
 */
export function uniqueness(scene: MineScene, df: Map<string, number>, totalScenes: number): number {
  const words = [...new Set(contentWords(scene.prose))];
  if (words.length === 0) return 0;
  // Guard totalScenes<=1: Math.log(1)=0 would make the idf normalizer divide by zero → NaN. With a single
  // scene there's no corpus to be unique against, so treat it as maximally unique. Hoist the loop-invariant.
  if (totalScenes <= 1) return 1;
  const logTotal = Math.log(totalScenes);
  let acc = 0;
  for (const w of words) {
    const freq = df.get(w) ?? 1;
    // idf normalized to 0..1: a word in 1 scene → ~1; a word in every scene → ~0.
    acc += Math.log(totalScenes / freq) / logTotal;
  }
  return Math.min(1, acc / words.length);
}

/** CROSSING potential 0..1 — braid slots (esp. source vignettes) make a scene weave-able into the spine. */
export function crossingPotential(scene: MineScene): number {
  const slots = scene.braidSlots ?? [];
  if (slots.length === 0) return 0;
  const sources = slots.filter((s) => s.kind === "source" && s.vignette).length;
  // a source vignette is the borrowable material; cap so it's a 0..1 lever.
  return Math.min(1, sources * 0.5 + slots.length * 0.1);
}

/** PROSE QUALITY 0..1 — favours full multi-paragraph scenes with real sensory body (not thin fragments). */
export function proseQuality(scene: MineScene): number {
  const paras = scene.prose.length;
  const words = contentWords(scene.prose).length;
  const paraScore = Math.min(1, paras / 3); // 3+ paragraphs = full
  const bodyScore = Math.min(1, words / 60); // ~60 content words = substantial
  return (paraScore + bodyScore) / 2;
}

/** The distinct braid settings a scene offers (the fabric key dimension). */
export function sceneSettings(scene: MineScene): string[] {
  return [
    ...new Set((scene.braidSlots ?? []).map((s) => s.setting).filter((x): x is string => !!x)),
  ];
}

/**
 * Composite score — UNIQUENESS-weighted (the FS-4 priority), then crossing + quality. Weights:
 * uniqueness 0.55, crossing 0.30, quality 0.15. A scene must be distinctive AND weave-able to be fabric.
 */
export function scoreScene(
  scene: MineScene,
  df: Map<string, number>,
  totalScenes: number,
  maxSimilarity = 0,
): ScoredScene {
  const u = uniqueness(scene, df, totalScenes);
  const c = crossingPotential(scene);
  const q = proseQuality(scene);
  const d = 1 - Math.max(0, Math.min(1, maxSimilarity));
  return {
    id: scene.id,
    score: 0.45 * u + 0.25 * c + 0.15 * q + 0.15 * d,
    maxSimilarity,
    parts: { uniqueness: u, crossing: c, quality: q, distinctiveness: d },
    settings: sceneSettings(scene),
  };
}

/**
 * Select the fabric keepers: score all scenes, keep the top `keepFraction` by score (the standouts),
 * retire the rest (the templated bulk). Deterministic — ties broken by scene id for stable output.
 */
export function selectFabric(scenes: MineScene[], keepFraction = 0.2): ScoredScene[] {
  const df = buildDocFreq(scenes);
  const similarities = maxCorpusSimilarities(scenes);
  const scored = scenes
    .map((s) => scoreScene(s, df, scenes.length, similarities.get(s.id) ?? 0))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const keep = Math.max(1, Math.round(scenes.length * keepFraction));
  return scored.slice(0, keep);
}
