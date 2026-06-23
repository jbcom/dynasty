/**
 * CORPUS-MINE-INTERSECTIONS — wire the MINED FABRIC into cross-dynasty crossings.
 *
 * The FS-4 mine-fabric pass (mineFabric.ts) distilled the retired 504-cell corpus into a curated index
 * (src/data/saga/fabric/index.json): per recurring family × era, the highest-scored scenes with their
 * SETTINGS + VIGNETTES (the borrowable crossing prose). That index was generated but NEVER read at runtime
 * — resolveThreads wove a rival thread from the family's plain act-opening scene, so the deliberately-mined,
 * higher-quality vignette prose went unused. This module loads the fabric + picks the best vignette for a
 * (wave, tier) crossing, so a cross-dynasty intersection borrows the richest mined fragment.
 *
 * PURE + DETERMINISTIC: the pick is a stable max-by-score (ties broken by sceneId) over static data — same
 * (wave, tier) → same vignette every time, no RNG. The {family_name}/{given_name}/{surname} tokens in the
 * vignette are substituted downstream by the SceneReader, as for any prose.
 */

import fabricIndex from "../../data/saga/fabric/index.json" with { type: "json" };

interface FabricEntry {
  sceneId: string;
  tier: number;
  score: number;
  settings: string[];
  vignettes: string[];
}
type FabricByEra = Record<string, FabricEntry[]>;
const FABRIC = (fabricIndex as { fabric: Record<string, FabricByEra> }).fabric;

/**
 * The best mined vignette for a rival WAVE crossing at (or nearest) a reach TIER — the highest-scored
 * fabric entry across that family's eras, preferring an exact tier match, then the closest tier, with score
 * as the tiebreak and sceneId as the final stable tiebreak. Returns null when the family has no fabric (e.g.
 * a wave the corpus never covered) so the caller keeps its generic fallback. Pure.
 */
export function fabricVignette(wave: string, tier: number): string | null {
  const byEra = FABRIC[wave];
  if (!byEra) return null;
  let best: FabricEntry | null = null;
  let bestKey: [number, number, string] | null = null; // [tier-distance (asc), -score (asc), sceneId]
  for (const entries of Object.values(byEra)) {
    for (const e of entries) {
      if (!e.vignettes?.length) continue;
      const key: [number, number, string] = [Math.abs(e.tier - tier), -e.score, e.sceneId];
      if (bestKey === null || lessThan(key, bestKey)) {
        best = e;
        bestKey = key;
      }
    }
  }
  return best ? (best.vignettes[0] ?? null) : null;
}

/** Lexicographic compare of the [tierDistance, -score, sceneId] sort key. */
function lessThan(a: [number, number, string], b: [number, number, string]): boolean {
  if (a[0] !== b[0]) return a[0] < b[0];
  if (a[1] !== b[1]) return a[1] < b[1];
  return a[2] < b[2];
}
