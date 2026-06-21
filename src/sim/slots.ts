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

/**
 * The power-archetypes — the run's dynastic identity axis (CP-R-ARCH). Each is a
 * distinct POWER BASE a founded line is built on: wealth (economic), office
 * (political), invention (technological), faith (religious), fame/spectacle
 * (entertainment), or physical prowess→celebrity (athletic). The calling is the
 * generational lens layered on top; the archetype is the foundation.
 */
export type Archetype =
  | "economic"
  | "political"
  | "technological"
  | "religious"
  | "entertainment"
  | "athletic";
export const ARCHETYPES: readonly Archetype[] = [
  "economic",
  "political",
  "technological",
  "religious",
  "entertainment",
  "athletic",
];

/**
 * The diegetic CALLING title for each archetype (OB-2). In the reworked Epoch-0 the player
 * "chooses a calling" — which IS the archetype (the power base) under a story-facing name +
 * one-line summons. The archetype id stays the mechanical key; this is the face the player
 * picks at the calling beat.
 */
export const ARCHETYPE_CALLINGS: Record<Archetype, { title: string; summons: string }> = {
  economic: {
    title: "The Magnate",
    summons: "Money is the lever that moves every other thing. You mean to hold the lever.",
  },
  political: {
    title: "The Statesman",
    summons: "Power is not given; it is gathered, office by office, debt by debt.",
  },
  technological: {
    title: "The Visionary",
    summons: "The future belongs to whoever builds it first. You intend to build it.",
  },
  religious: {
    title: "The Prophet",
    summons: "People hunger for something larger than themselves. You will be its voice.",
  },
  entertainment: {
    title: "The Star",
    summons: "A name on every tongue is a kind of immortality. You want yours.",
  },
  athletic: {
    title: "The Champion",
    summons: "The body, perfected and victorious, is its own argument for greatness.",
  },
};

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
