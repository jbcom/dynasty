import { createWorld, trait } from "koota";
import { branchOf } from "./branch";
import type { Content } from "./content";
import { effectiveWeight, eligibleEvents } from "./events";
import { moralPoleOf } from "./moralAxis";
import type { GameEvent } from "./schema";
import type { GameState } from "./state";

/**
 * KOOTA READ-MODEL (task-026).
 *
 * A DERIVED, DISPOSABLE projection of the pure (content, state) into a Koota
 * world, so the many cross-cutting queries (eligibility, weighting, branch/pole
 * grouping, market/rank reads) can be expressed declaratively instead of as
 * hand-rolled loops. CRITICAL: this is NOT the source of truth — the pure
 * transition (applyChoice) and GameState remain authoritative. The world is
 * rebuilt from the pure state on demand, queried, and discarded; it is never
 * mutated as game state and never persisted, so determinism + replay-from-seed
 * are untouched (a save is still seed + history).
 *
 * The build order is deterministic (events in content order), so the same
 * (content, state) always projects an identical world — verified by guardrail
 * tests.
 */

/**
 * Traits attached to projected entities. Koota trait schemas hold primitives, so
 * an event is referenced by its `id` (looked up from content), not stored whole.
 */
export const EventRef = trait({ id: "" });
export const Eligible = trait();
export const Weight = trait({ value: 0 });
export const Branch = trait({ key: "default" });
export const Pole = trait({ key: "centrist" });

export type ProjectedWorld = ReturnType<typeof createWorld>;

/**
 * Project the current run into a fresh Koota world. Deterministic in
 * (content, state). Spawns one entity per event with its eligibility + effective
 * weight + the run's branch/pole context, in content order.
 */
export function projectWorld(content: Content, state: GameState) {
  const world = createWorld();
  const branch = branchOf(state);
  const pole = moralPoleOf(state);
  const eligible = new Set(eligibleEvents(content, state).map((e) => e.id));

  for (const event of content.allEvents) {
    const e = world.spawn(
      EventRef({ id: event.id }),
      Weight({ value: effectiveWeight(content, state, event) }),
      Branch({ key: branch }),
      Pole({ key: pole }),
    );
    if (eligible.has(event.id)) e.add(Eligible);
  }
  return world;
}

/**
 * Declarative re-implementation of eligibleEvents over the read-model — the
 * migration pattern for task-026. Returns the same set the pure helper does
 * (verified by a parity test); the pure helper stays the source of truth.
 */
export function queryEligible(content: Content, state: GameState): GameEvent[] {
  const world = projectWorld(content, state);
  const byId = new Map(content.allEvents.map((e) => [e.id, e]));
  return world
    .query(EventRef, Eligible)
    .map((e) => byId.get(e.get(EventRef)?.id ?? ""))
    .filter((e): e is GameEvent => e !== undefined);
}
