/**
 * Personality vector — the axis tracking *what kind of man he becomes*, layered
 * on the six meters. Two scalars plus a perception split:
 *
 *  - ideology     : -100 (collectivist / left / "stayed a liberal Democrat →
 *                   communist utopia") … +100 (autocratic / right / strongman).
 *  - grandiosity  : -100 (humble / self-effacing) … +100 (megalomaniacal king).
 *  - outward      : how the WORLD perceives him on the tyranny↔utopia spectrum
 *                   (-100 beloved liberator … +100 feared tyrant).
 *  - inward       : how he perceives HIMSELF on the same spectrum.
 *
 * outward and inward can diverge (e.g. a tyrant who believes he's a savior).
 * Pure data + pure helpers — no DOM, no randomness.
 */

export interface Personality {
  ideology: number;
  grandiosity: number;
  outward: number;
  inward: number;
}

export const PERSONALITY_AXES = ["ideology", "grandiosity", "outward", "inward"] as const;
export type PersonalityAxis = (typeof PERSONALITY_AXES)[number];

/** A partial map of axis → delta applied by a choice. */
export type PersonalityDelta = Partial<Record<PersonalityAxis, number>>;

const MIN = -100;
const MAX = 100;

function clamp(v: number): number {
  return v < MIN ? MIN : v > MAX ? MAX : v;
}

/** Starting personality: ideologically neutral, modestly grandiose, unknown to the world. */
export function initPersonality(): Personality {
  return { ideology: 0, grandiosity: 10, outward: 0, inward: 0 };
}

/** Apply a delta map; returns a NEW Personality (pure), each axis clamped to [-100,100]. */
export function applyPersonality(p: Personality, delta: PersonalityDelta): Personality {
  return {
    ideology: clamp(p.ideology + (delta.ideology ?? 0)),
    grandiosity: clamp(p.grandiosity + (delta.grandiosity ?? 0)),
    outward: clamp(p.outward + (delta.outward ?? 0)),
    inward: clamp(p.inward + (delta.inward ?? 0)),
  };
}

/**
 * The man's current archetype — a coarse classification used by the HUD copy and
 * by ending triggers. Derived from ideology × grandiosity.
 */
export type Archetype =
  | "communist_visionary" // far left + grandiose
  | "social_democrat" // left, humble
  | "dealmaker" // centrist / pragmatic
  | "populist_strongman" // right, grandiose
  | "megalomaniac_king"; // far right + extreme grandiosity

export function archetypeOf(p: Personality): Archetype {
  if (p.ideology <= -45) return p.grandiosity >= 40 ? "communist_visionary" : "social_democrat";
  if (p.ideology >= 45) return p.grandiosity >= 55 ? "megalomaniac_king" : "populist_strongman";
  return "dealmaker";
}

/**
 * Where the run sits on the tyranny↔utopia spectrum, from the WORLD's view.
 * Blends outward perception with the autocratic lean. Negative = utopian,
 * positive = tyrannical. Used to fork the secret First-Contact ending and to
 * drive the HUD's ambient drift signal.
 */
export function tyrannyUtopiaAxis(p: Personality): number {
  return clamp(Math.round(p.outward * 0.6 + p.ideology * 0.25 + p.grandiosity * 0.15));
}

/** Human-readable label for the spectrum position (HUD + reports). */
export function spectrumLabel(p: Personality): string {
  const v = tyrannyUtopiaAxis(p);
  if (v <= -60) return "Utopian";
  if (v <= -20) return "Benevolent";
  if (v < 20) return "Contested";
  if (v < 60) return "Authoritarian";
  return "Tyrannical";
}

/** How far outward and inward perception diverge (self-delusion gauge). */
export function perceptionGap(p: Personality): number {
  return Math.abs(p.outward - p.inward);
}
