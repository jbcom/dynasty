import type { Calling, GameEvent } from "./schema";
import type { LiveMember } from "./state";

/**
 * CP-2 — pure CALLING resolver. A founding calling is a durable generational lens:
 * its traitDrift biases each begotten child's inherited traits, and its
 * tropeWeights multiply the selection weight of events carrying matching `trope:`
 * tags. Pure + deterministic — drift is a fixed add (no rng), the weight is a
 * lookup; replay is unaffected. The resolver is a no-op for a run without a
 * calling.
 */

/** Find a calling by id, or undefined when the run has none / it's unknown. */
export function callingById(
  callings: readonly Calling[],
  id: string | undefined,
): Calling | undefined {
  if (!id) return undefined;
  return callings.find((c) => c.id === id);
}

/** Apply a calling's per-beget trait drift to a child's trait vector (clamped 0..100). */
export function applyCallingDrift(
  traits: LiveMember["traits"],
  calling: Calling | undefined,
): LiveMember["traits"] {
  if (!calling) return traits;
  const out = { ...traits };
  for (const [k, delta] of Object.entries(calling.traitDrift) as [
    keyof LiveMember["traits"],
    number,
  ][]) {
    const v = out[k] + delta;
    out[k] = v < 0 ? 0 : v > 100 ? 100 : v;
  }
  return out;
}

/**
 * The calling's selection-weight multiplier for an event: the product of the
 * weights for every `trope:<id>` tag the event carries that the calling weights.
 * 1 (neutral) when the calling is absent or the event matches no weighted trope.
 */
export function callingWeight(calling: Calling | undefined, ev: GameEvent): number {
  if (!calling) return 1;
  let mult = 1;
  for (const tag of ev.tags) {
    if (!tag.startsWith("trope:")) continue;
    const id = tag.slice("trope:".length);
    const w = calling.tropeWeights[id];
    if (w !== undefined) mult *= w;
  }
  return mult;
}
