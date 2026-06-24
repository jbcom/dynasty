/**
 * PLAYTIME-DEPTH-AUDIT — a pure depth metric over the authored saga corpus, used to estimate a single
 * founding→stars lineage run's playtime against the hour+ goal ([[hour-long-depth]]). A lineage plays ONE
 * class-keyed corpus file (a wave × archetype × class) = its 6 acts (reach tiers 0..5). `computeDepth` sums
 * the scenes / prose words / decision beats for a file's scenes; `estPlaytimeMinutes` turns that into an
 * estimate (read pace + decision deliberation). `loadLineageFiles` groups the corpus per file (the run unit).
 *
 * Pure (given the eager glob, like loadSaga) — no Date/Math.random; deterministic over the bundled corpus.
 */

import { SagaFileSchema, type Scene } from "./schema";

/** A scene-depth summary of one lineage run (a corpus file's scenes). */
export interface Depth {
  scenes: number;
  /** Prose paragraphs across all scenes. */
  paragraphs: number;
  /** Prose words across all scenes (whitespace-split). */
  words: number;
  /** Weave beats across all scenes (mid-scene ink diversions). */
  beats: number;
  /** Scenes that carry a terminal decision (the act's pivotal choices). */
  decisions: number;
}

/** Words in a prose paragraph array (whitespace-split, empties dropped). Pure. */
function wordCount(prose: readonly string[]): number {
  return prose.join(" ").split(/\s+/).filter(Boolean).length;
}

/** Sum the scene depth of a lineage run (a file's scenes). Pure. */
export function computeDepth(scenes: readonly Scene[]): Depth {
  const d: Depth = { scenes: 0, paragraphs: 0, words: 0, beats: 0, decisions: 0 };
  for (const s of scenes) {
    d.scenes++;
    d.paragraphs += s.prose.length;
    d.words += wordCount(s.prose);
    d.beats += s.beats.length;
    if (s.decision) d.decisions++;
  }
  return d;
}

/** A normal silent reading pace (words per minute) for narrative prose. */
export const READ_WPM = 220;
/** Deliberation seconds: a weave beat is a quick inline pick; a terminal decision is weighed longer. */
export const SEC_PER_BEAT = 8;
export const SEC_PER_DECISION = 20;

/** Estimate a lineage run's playtime in minutes from its scene depth (read pace + deliberation). Pure. */
export function estPlaytimeMinutes(d: Depth): number {
  const read = d.words / READ_WPM;
  const deliberate = (d.beats * SEC_PER_BEAT + d.decisions * SEC_PER_DECISION) / 60;
  return read + deliberate;
}

interface RawActFile {
  default: unknown;
}

// The corpus files, eagerly bundled (the run unit is one file = one wave×archetype×class lineage path).
const actGlob = import.meta.glob("../../data/saga/**/*.act.json", { eager: true });

/** Load every lineage corpus file's scenes (validated), grouped per file. Pure given the glob. The shared
 *  branch SPINE (spine.act.json) is excluded — it isn't a class-keyed RUN unit (a real run plays a class file
 *  PLUS spine scenes), so counting it as its own lineage would misreport the per-run estimate. */
export function loadLineageFiles(): Array<{ name: string; act: Scene[] }> {
  const out: Array<{ name: string; act: Scene[] }> = [];
  for (const [path, mod] of Object.entries(actGlob)) {
    if (path.endsWith("/spine.act.json")) continue;
    const parsed = SagaFileSchema.safeParse((mod as RawActFile).default);
    if (!parsed.success) throw new Error(`Invalid saga act file ${path}: ${parsed.error.message}`);
    const name = path.split("/").slice(-2).join("/");
    out.push({ name, act: parsed.data.scenes });
  }
  return out;
}

/** One lineage run's depth + playtime estimate. */
export interface LineageRun extends Depth {
  name: string;
  minutes: number;
}

/** Every lineage run (a corpus file), depth-measured + playtime-estimated, sorted shortest→longest. Pure. */
export function lineageRuns(): LineageRun[] {
  return loadLineageFiles()
    .map((f) => {
      const d = computeDepth(f.act);
      return { name: f.name, ...d, minutes: estPlaytimeMinutes(d) };
    })
    .sort((a, b) => a.minutes - b.minutes);
}
