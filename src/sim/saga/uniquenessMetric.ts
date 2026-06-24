/**
 * CONTENT-UNIQUENESS-AUDIT — a pure metric over the saga corpus quantifying STRUCTURAL SAMENESS, the
 * highest-order standing concern ([[uniqueness-genuine-intersections]] / [[craft-spines-not-generator]]): a
 * prior audit found the acts share ONE skeleton. This measures it concretely so the sameness is tracked, not
 * vibes — and so the eventual rewrite has a number to move.
 *
 * Each lineage file (a wave×archetype×class run) gets a STRUCTURAL FINGERPRINT — the shape of its acts,
 * independent of prose: per scene, its SENSE + its beat-count + whether it carries a decision. Two files with
 * the same fingerprint are structurally identical (the skeleton was stamped, not crafted). The headline metric
 * is the DISTINCT-fingerprint RATIO: distinctFingerprints / files (1.0 = every run is structurally unique;
 * near 0 = one skeleton everywhere).
 *
 * Pure (given the eager glob, like loadSaga) — no Date/Math.random; deterministic over the bundled corpus.
 */

import { loadLineageFiles } from "./playtimeDepth";
import type { Scene } from "./schema";

/** The per-scene structural token: sense + beat-count + decision flag (prose-independent). */
function sceneToken(s: Scene): string {
  return `${s.sense}:${s.beats.length}${s.decision ? "D" : ""}`;
}

/** The structural fingerprint of a lineage run — its scenes' shape, prose stripped out. Pure. */
export function structuralFingerprint(scenes: readonly Scene[]): string {
  return scenes.map(sceneToken).join("|");
}

/** The corpus's structural-sameness report. */
export interface UniquenessReport {
  files: number;
  distinctFingerprints: number;
  /** distinctFingerprints / files — 1.0 = all structurally unique; →0 = one skeleton stamped everywhere. */
  distinctRatio: number;
  /** The fingerprint clusters, largest first: how many files share each structural shape. */
  clusters: Array<{ count: number; fingerprint: string }>;
  /** The size of the single largest cluster (how many runs share the most-common skeleton). */
  largestCluster: number;
}

/** Compute the structural-uniqueness report over every lineage corpus file. Pure (given the glob). */
export function uniquenessReport(): UniquenessReport {
  const files = loadLineageFiles();
  const counts = new Map<string, number>();
  for (const f of files) {
    const fp = structuralFingerprint(f.act);
    counts.set(fp, (counts.get(fp) ?? 0) + 1);
  }
  const clusters = [...counts.entries()]
    .map(([fingerprint, count]) => ({ count, fingerprint }))
    .sort((a, b) => b.count - a.count);
  const n = files.length;
  return {
    files: n,
    distinctFingerprints: counts.size,
    distinctRatio: n > 0 ? counts.size / n : 0,
    clusters,
    largestCluster: clusters[0]?.count ?? 0,
  };
}
