import type { PersonalityDelta } from "./personality";
import type { Axis, AxisKind, AxisOption, MeterDelta, WorldStack } from "./schema";

/**
 * CP-4 — pure EPOCH-0 AXIS resolver. A founding axis choice (faith/ideology/
 * sociology/tech) lands with a magnitude SCALED by the founding place×era stack's
 * intensity on that axis: rejecting the faith in 1847 Catholic Ireland (high faith
 * intensity) hits hard; on a secular frontier it barely registers. The flags it
 * sets are NOT scaled (a stance is a stance). Pure + deterministic — intensity is
 * a data lookup, the scaling is arithmetic; no rng.
 */

/** The place×era axis intensity, defaulting to 0.5 when the stack omits it. */
export function axisIntensityFor(stack: WorldStack | undefined, axis: AxisKind): number {
  const v = stack?.axisIntensity?.[axis];
  return v === undefined ? 0.5 : v;
}

/** Find an axis definition by kind. */
export function axisByKind(axes: readonly Axis[], kind: AxisKind): Axis | undefined {
  return axes.find((a) => a.axis === kind);
}

/** The resolved consequence of an axis choice: scaled deltas + the (unscaled) flags. */
export interface ResolvedAxisChoice {
  setFlags: string[];
  effects: MeterDelta;
  personality: PersonalityDelta;
}

function scaleDelta<K extends string>(
  base: Partial<Record<K, number>>,
  intensity: number,
): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  for (const [k, v] of Object.entries(base) as [K, number][]) {
    // Round so meters/personality stay integers; intensity 0..1 scales magnitude.
    out[k] = Math.round(v * intensity);
  }
  return out;
}

/**
 * Resolve one axis OPTION at the given place×era intensity. Returns the flags it
 * sets (unscaled) and its meter/personality deltas scaled by intensity. Pure.
 */
export function resolveAxisChoice(option: AxisOption, intensity: number): ResolvedAxisChoice {
  return {
    setFlags: [...option.setFlags],
    effects: scaleDelta(option.effects, intensity),
    personality: scaleDelta(option.personality, intensity),
  };
}

/** Look up an option within an axis by id. */
export function axisOptionById(axis: Axis, optionId: string): AxisOption | undefined {
  return axis.options.find((o) => o.id === optionId);
}
