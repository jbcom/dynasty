/**
 * EI-8b — pure derivations of the portrait-key facets that come from LIVE SIM STATE: the subject's
 * LIFE-STAGE (from age) and the line's RUNG TIER (from the rank ladders). These feed the EI-8 composite
 * portrait key alongside the era band (EI-8a) and the archetype/wardrobe (EI-8c). Spec:
 * docs/superpowers/specs/2026-06-23-emergent-infancy-onboarding-design.md §"EI-8 — the portrait-demand MATRIX".
 *
 * Pure + deterministic: no DOM, no Date, no Math.random — the same (age) / (ranks) → the same facet, so a
 * portrait key is stable for a given run state (and the asset cache is reproducible).
 */

import type { Archetype } from "../slots";
import type { GameState, RankState } from "../state";

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

/**
 * EI-9c — the life stage a given EMERGENCE (Epoch-0 opening) scene depicts, so the OpeningScreen can show a
 * life-stage portrait that grows with the progenitor. The mapping is intentionally TOTAL over the authored
 * opening (every scene `buildEpoch0Opening` emits is covered):
 *   - `epoch0:birth`, `epoch0:naming`                                   → infant
 *   - `epoch0:childhood`, `epoch0:formative`, `epoch0:schooling`        → child
 *   - `epoch0:betrayal`, `epoch0:loss`, `epoch0:romance`               → youth (the threshold to adulthood)
 *
 * DEFAULT (by design): any UNMAPPED id falls back to "child" — the safe middle of the emergence, so a future
 * opening scene added without updating this map degrades gracefully to a plausible portrait rather than
 * throwing or showing an out-of-range stage. This function is ONLY called with Epoch-0 opening scene ids
 * (the OpeningScreen drives it); it is not a general scene→stage resolver (play-surface stages come from
 * `lifeStageForAge`). Pure.
 */
export function lifeStageForOpeningScene(sceneId: string): LifeStage {
  const beat = sceneId.startsWith("epoch0:") ? sceneId.slice("epoch0:".length) : sceneId;
  if (beat === "birth" || beat === "naming") return "infant";
  if (beat === "childhood" || beat === "formative" || beat === "schooling") return "child";
  if (beat === "betrayal" || beat === "loss" || beat === "romance") return "youth";
  // Unmapped → "child" by design (see JSDoc): graceful degradation for any future/unknown opening scene.
  return "child";
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

/** The binary portrait matrix currently generated for lineage subjects. */
export type PortraitGender = "male" | "female";

/**
 * Current protagonist gender for the portrait matrix. The founder's selected gender is only the bootstrap
 * fallback; once a live family exists, the portrait must follow the member the player is steering after
 * succession. Pure + tolerant of older saves/lean test fixtures with incomplete family records.
 */
export function portraitGenderForState(
  state: Pick<GameState, "family" | "founding">,
): PortraitGender {
  const family = state.family;
  const protagonist = family?.members.find((m) => m.id === family.protagonistId);
  return protagonist?.sex ?? state.founding?.gender ?? "male";
}

/**
 * EI-8c — the PORTRAIT archetype: the 6 sim power-base archetypes (slots.ts) PLUS `crime`. Crime is a local
 * PORTRAIT-LAYER superset here — the full crime POWER AXIS is its own sim milestone ([[crime-power-axis]]);
 * this lets the visual demand matrix (and wardrobe table) be COMPLETE without half-wiring crime through every
 * `Record<Archetype>` in the sim. When the crime axis lands, it folds into the sim `Archetype` and this
 * superset collapses to it.
 */
export type PortraitArchetype = Archetype | "crime";

/**
 * EI-8c — the WARDROBE register per (archetype × rung tier): the portrait reflects WHO the line has become,
 * and the look DEEPENS as it climbs. 7 archetypes × 3 tiers = 21 registers. The strings are dress/bearing
 * cues folded into the portrait prompt (alongside the era band + life stage). "cult-leader" reads as the
 * religious path's high-rung extreme; the crime path scales corner-soldier → made operator → boss/sovereign.
 */
const WARDROBE: Record<PortraitArchetype, Record<RungTier, string>> = {
  economic: {
    low: "the plain working dress of a tradesman",
    mid: "the respectable coat of an established merchant",
    high: "the commanding tailoring of a magnate / industrial CEO",
  },
  political: {
    low: "the modest dress of a ward heeler working the wards",
    mid: "the sober attire of a seated official",
    high: "the formal regalia of a statesman / ruler",
  },
  technological: {
    low: "the work clothes of an apprentice at the bench",
    mid: "the practical dress of a working engineer",
    high: "the assured bearing of a visionary industrialist",
  },
  religious: {
    low: "the plain garb of the lay devout",
    mid: "the vestments of the ordained",
    high: "the heavy ceremonial vestments of a prelate / cult-leader, an aura of authority",
  },
  entertainment: {
    low: "the threadbare clothes of a street busker",
    mid: "the stage dress of a working performer",
    high: "the unmistakable dress of a celebrity / icon",
  },
  athletic: {
    low: "the simple kit of a striver in training",
    mid: "the gear of a serious competitor",
    high: "the laureled bearing of a champion",
  },
  crime: {
    low: "the guarded street dress of a corner soldier",
    mid: "the sharp, deliberate attire of a made operator",
    high: "the imperial bearing of a crime boss / sovereign of a criminal order",
  },
};

/** The wardrobe register for an (archetype, rung tier) — EI-8c. Pure. */
export function wardrobeFor(archetype: PortraitArchetype, tier: RungTier): string {
  return WARDROBE[archetype][tier];
}
