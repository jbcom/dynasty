import type { Rng } from "../rng";
import type { Ripple } from "../schema";
import type { RippleField } from "../state";

/**
 * The CHAOS field (butterfly engine, part C): seeded weighted ripples that
 * perturb future event weights so timelines diverge across playthroughs while
 * staying fully reproducible per seed.
 */

/** Apply a choice's ripples into the ripple field, jittered by a seeded RNG. */
export function applyRipples(field: RippleField, ripples: readonly Ripple[], rng: Rng): RippleField {
  if (ripples.length === 0) return { ...field };
  const next: RippleField = { ...field };
  for (const r of ripples) {
    // Seeded jitter (0.5..1.0 of the nominal weight) so identical choices still
    // diverge across runs while staying fully reproducible per seed.
    const jitter = 0.5 + rng.next() * 0.5;
    const delta = r.weight * r.polarity * jitter;
    next[r.to] = (next[r.to] ?? 0) + delta;
  }
  return next;
}
