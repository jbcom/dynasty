/**
 * EI-8b — pure derivations of the portrait-key facets that come from LIVE SIM STATE: the subject's
 * LIFE-STAGE (from age) and the line's RUNG TIER (from the rank ladders). These feed the EI-8 composite
 * portrait key alongside the era band (EI-8a) and the archetype/wardrobe (EI-8c). Spec:
 * docs/superpowers/specs/2026-06-23-emergent-infancy-onboarding-design.md §"EI-8 — the portrait-demand MATRIX".
 *
 * Pure + deterministic: no DOM, no Date, no Math.random — the same (age) / (ranks) → the same facet, so a
 * portrait key is stable for a given run state (and the asset cache is reproducible).
 */

import type { RankState } from "../state";

/** The birth→growth→death stages a portrait is keyed on (recurs every generation). */
export type LifeStage = "infant" | "child" | "youth" | "adult" | "elder";

/** Age-band edges (inclusive upper bounds) → life stage. The Epoch-0 emergence walks infant→…→adult; later
 *  generations re-enter the cycle, and elders read distinctly (the cycle's close). */
const LIFE_STAGE_BANDS: ReadonlyArray<{ stage: LifeStage; to: number }> = [
  { stage: "infant", to: 2 },
  { stage: "child", to: 11 },
  { stage: "youth", to: 19 },
  { stage: "adult", to: 64 },
  { stage: "elder", to: Number.POSITIVE_INFINITY },
];

/** The subject's life stage for an age in years (EI-8b). Negative ages clamp to infant. Pure. */
export function lifeStageForAge(age: number): LifeStage {
  for (const b of LIFE_STAGE_BANDS) {
    if (age <= b.to) return b.stage;
  }
  return "elder";
}

/** The wardrobe-scaling tier (the 4 rank ladders are 6 rungs each → 3 tiers). */
export type RungTier = "low" | "mid" | "high";

/** Collapse a single rung index (0..5) to a wardrobe tier: 0–1 low, 2–3 mid, 4–5 high. */
export function rungTierForRung(rung: number): RungTier {
  if (rung <= 1) return "low";
  if (rung <= 3) return "mid";
  return "high";
}

/**
 * The line's rung tier from its rank state (EI-8b): the wardrobe scales with how far the line has CLIMBED,
 * so take the HIGHEST current rung across the ladders (the line's peak standing on any axis) and collapse
 * to a tier. An empty ladder set reads "low" (a line owed nothing). Pure.
 */
export function rungTierForState(ranks: Record<string, RankState>): RungTier {
  let top = 0;
  for (const r of Object.values(ranks)) {
    if (r.rung > top) top = r.rung;
  }
  return rungTierForRung(top);
}
