import type { BranchKey } from "./branch";
import type { Slot, SlotResolution } from "./schema";

/**
 * SLOT-EVENT resolution (alt-history consistency, AH7).
 *
 * An archetypal slot (e.g. "leader_assassination") resolves to a concrete event
 * for the run's active timeline. Resolution precedence, most-specific first:
 *   1. dynasty[<archetype>]  — the run's ARCHETYPE filling the archetype its own
 *      way (a political line's leader-martyrdom vs an economic line's crash).
 *   2. <branch>              — the backdrop's resolution (Nazi → a Commissar purge).
 *   3. default               — our-history resolution (always present).
 * Pure and deterministic; used by the timeline compiler when filling slots.
 *
 * IDENTITY (FD-3.5): a run is identified by its power ARCHETYPE, not a literal
 * preset family. The former literal gears (trump/kennedy/musk) are dissolved; a
 * founded line carries one of the four archetypes set by its start-moment.
 */

/** The four power-archetypes — the run's dynastic identity axis. */
export type Archetype = "economic" | "political" | "technological" | "religious";
export const ARCHETYPES: readonly Archetype[] = [
  "economic",
  "political",
  "technological",
  "religious",
];

/** Resolve one slot to the concrete event for this branch + archetype. */
export function resolveSlot(
  slot: Slot,
  branch: BranchKey,
  archetype: Archetype = "economic",
): SlotResolution {
  const byArchetype = slot.dynasty[archetype];
  if (byArchetype) return byArchetype;
  if (branch !== "default" && slot[branch]) return slot[branch] as SlotResolution;
  return slot.default;
}

/** Resolve every slot to its concrete event id for this branch + archetype. */
export function resolveSlots(
  slots: readonly Slot[],
  branch: BranchKey,
  archetype: Archetype = "economic",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const slot of slots) out[slot.id] = resolveSlot(slot, branch, archetype).event;
  return out;
}
