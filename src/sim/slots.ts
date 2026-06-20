import type { BranchKey } from "./branch";
import type { Slot, SlotResolution } from "./schema";

/**
 * SLOT-EVENT resolution (alt-history consistency, AH7).
 *
 * An archetypal slot (e.g. "leader_assassination") resolves to a concrete event
 * for the run's active timeline. Resolution precedence, most-specific first:
 *   1. dynasty[<activeDynasty>]  — the gear (trump | musk | kennedy) filling the
 *      archetype its own way (Fred Trump's martyrdom vs JFK's).
 *   2. <branch>                  — the backdrop's resolution (Nazi → a Commissar
 *      purge, since there is no presidency to assassinate).
 *   3. default                   — our-history resolution (always present).
 * Pure and deterministic; used by the timeline compiler when filling slots.
 */

/** Which dynastic gear is the protagonist this run. */
export type DynastyKey = "trump" | "musk" | "kennedy";

/** Resolve one slot to the concrete event for this branch + dynasty. */
export function resolveSlot(
  slot: Slot,
  branch: BranchKey,
  dynasty: DynastyKey = "trump",
): SlotResolution {
  const byDynasty = slot.dynasty[dynasty];
  if (byDynasty) return byDynasty;
  if (branch !== "default" && slot[branch]) return slot[branch] as SlotResolution;
  return slot.default;
}

/** Resolve every slot to its concrete event id for this branch + dynasty. */
export function resolveSlots(
  slots: readonly Slot[],
  branch: BranchKey,
  dynasty: DynastyKey = "trump",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const slot of slots) out[slot.id] = resolveSlot(slot, branch, dynasty).event;
  return out;
}
