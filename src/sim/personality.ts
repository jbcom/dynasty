/**
 * PERSONALITY → MOTIVATORS adapter (Convergence Saga, SS-1).
 *
 * The old 4-axis personality vector (ideology/grandiosity/outward/inward) is REPLACED by the
 * 8-axis MOTIVATORS model (src/sim/motivators.ts). This module re-exports the motivators model
 * under the historical `Personality` names so the many existing call-sites keep compiling, and
 * provides the derived HUD/ending helpers (tyranny↔utopia spectrum, dominant-archetype label)
 * recomputed from the new axes. Pure — no DOM, no randomness.
 *
 * Axis mapping applied to old content (one-time, by the SS-1 migration script):
 *   ideology → politics ; grandiosity → power ; outward → power (folded) ; inward → (retired).
 */

import {
  applyMotivators,
  axisLabel,
  dominantMotivator,
  initMotivators,
  MOTIVATOR_AXES,
  type MotivatorAxis,
  type MotivatorDelta,
  type Motivators,
} from "./motivators";

/** Historical alias — a line's motivator vector. */
export type Personality = Motivators;
export type PersonalityAxis = MotivatorAxis;
export type PersonalityDelta = MotivatorDelta;
export const PERSONALITY_AXES = MOTIVATOR_AXES;

const MIN = -100;
const MAX = 100;
function clamp(v: number): number {
  return v < MIN ? MIN : v > MAX ? MAX : v;
}

/** Starting motivators: centrist on every axis. */
export function initPersonality(): Personality {
  return initMotivators();
}

/** Apply a delta map; returns a NEW vector (pure), each axis clamped to [-100,100]. */
export function applyPersonality(p: Personality, delta: PersonalityDelta): Personality {
  return applyMotivators(p, delta);
}

/**
 * Coarse archetype label (HUD copy + ending triggers), derived from politics × power. Mirrors
 * the old ideology×grandiosity classification using the migrated axes (ideology→politics,
 * grandiosity→power).
 */
export type Archetype =
  | "communist_visionary" // far left + high power-seeking
  | "social_democrat" // left, low power
  | "dealmaker" // centrist / pragmatic
  | "populist_strongman" // right, high power
  | "megalomaniac_king"; // far right + extreme power

export function archetypeOf(p: Personality): Archetype {
  if (p.politics <= -45) return p.power >= 40 ? "communist_visionary" : "social_democrat";
  if (p.politics >= 45) return p.power >= 55 ? "megalomaniac_king" : "populist_strongman";
  return "dealmaker";
}

/**
 * Where the line sits on the tyranny↔utopia spectrum (world's view). Recomputed from the new
 * motivators: power-seeking + a right lean tilt toward tyranny; community + honor toward utopia.
 * Negative = utopian, positive = tyrannical. Drives the secret First-Contact fork + HUD drift.
 */
export function tyrannyUtopiaAxis(p: Personality): number {
  return clamp(Math.round(p.power * 0.5 + p.politics * 0.2 + p.honor * 0.3));
}

/** Human-readable spectrum label (HUD + reports). */
export function spectrumLabel(p: Personality): string {
  const v = tyrannyUtopiaAxis(p);
  if (v <= -60) return "Utopian";
  if (v <= -20) return "Benevolent";
  if (v < 20) return "Contested";
  if (v < 60) return "Authoritarian";
  return "Tyrannical";
}

/**
 * Self-vs-world divergence gauge. The old inward/outward perception split is retired; we proxy
 * "how extreme is the line's self-image vs. its honor" — the gap between raw power-seeking and
 * its honorable tempering. Kept so existing HUD consumers render; 0 when balanced.
 */
export function perceptionGap(p: Personality): number {
  return clamp(Math.abs(p.power) - Math.abs(p.honor));
}

/** The dominant-lean axis + pole, for tone/ending coloring. Re-exported from motivators. */
export { axisLabel, dominantMotivator };
