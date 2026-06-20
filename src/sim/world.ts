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

/** Market entity traits (SIM1 read-model). */
export const MarketRef = trait({ id: "" });
export const Index = trait({ value: 0, peak: 0, drawdown: 0 });
export const Regime = trait({ key: "" });
export const Position = trait({ holding: 0, leverage: 1 });

export type ProjectedWorld = ReturnType<typeof createWorld>;

/**
 * Run `fn` against a freshly-projected world, ALWAYS destroying it afterward.
 * Koota caps live worlds at 16 and createWorld does not auto-free, so every
 * query must dispose its world or play would crash after a handful of queries.
 * This is the only sanctioned way to query the read-model.
 */
export function withWorld<T>(content: Content, state: GameState, fn: (w: ProjectedWorld) => T): T {
  const world = projectWorld(content, state);
  try {
    return fn(world);
  } finally {
    world.destroy();
  }
}

/**
 * Project the current run into a fresh Koota world. Deterministic in
 * (content, state). Spawns one entity per event with its eligibility + effective
 * weight + the run's branch/pole context, in content order. CALLER MUST destroy
 * the returned world (use withWorld, which does this automatically).
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

  // Markets project as entities too, so market reads become declarative queries.
  for (const market of content.markets) {
    const ms = state.markets[market.id];
    if (!ms) continue;
    world.spawn(
      MarketRef({ id: market.id }),
      Index({
        value: ms.index,
        peak: ms.peakIndex,
        drawdown: ms.peakIndex > 0 ? 1 - ms.index / ms.peakIndex : 0,
      }),
      Regime({ key: ms.regime }),
      Position({ holding: ms.holding, leverage: ms.leverage }),
    );
  }
  return world;
}

/**
 * Declarative re-implementation of eligibleEvents over the read-model — the
 * migration pattern for task-026. Returns the same set the pure helper does
 * (verified by a parity test); the pure helper stays the source of truth.
 */
export function queryEligible(content: Content, state: GameState): GameEvent[] {
  const byId = new Map(content.allEvents.map((e) => [e.id, e]));
  return withWorld(content, state, (world) =>
    world
      .query(EventRef, Eligible)
      .map((e) => byId.get(e.get(EventRef)?.id ?? ""))
      .filter((e): e is GameEvent => e !== undefined),
  );
}

/**
 * Eligible events ranked by effective selection weight (descending). A
 * declarative read-model query — the kind the ECS makes clean — for "what is
 * likely to come next" UI/debug surfaces and the persona-playtest analytics.
 * Ties broken by event id so the ranking is deterministic.
 */
export function queryEligibleByWeight(
  content: Content,
  state: GameState,
): Array<{ event: GameEvent; weight: number }> {
  const byId = new Map(content.allEvents.map((e) => [e.id, e]));
  return withWorld(content, state, (world) =>
    world
      .query(EventRef, Eligible, Weight)
      .map((e) => ({ id: e.get(EventRef)?.id ?? "", weight: e.get(Weight)?.value ?? 0 }))
      .map(({ id, weight }) => ({ event: byId.get(id), weight }))
      .filter((x): x is { event: GameEvent; weight: number } => x.event !== undefined)
      .sort((a, b) => b.weight - a.weight || a.event.id.localeCompare(b.event.id)),
  );
}

/**
 * Market ids whose drawdown breaches their crash threshold — a declarative
 * read-model query for crash-aware UI/events. Parity: matches the same
 * mkt_crash_<id> flags systemicTick would emit for the current state.
 */
export function queryMarketsInCrash(content: Content, state: GameState): string[] {
  const threshold = new Map(content.markets.map((m) => [m.id, m.crashThreshold]));
  return withWorld(content, state, (world) =>
    world
      .query(MarketRef, Index)
      .map((e) => ({ id: e.get(MarketRef)?.id ?? "", drawdown: e.get(Index)?.drawdown ?? 0 }))
      .filter(({ id, drawdown }) => {
        const t = threshold.get(id);
        // drawdown = 1 - index/peak; crash when index/peak < t ⇔ drawdown > 1 - t.
        return t !== undefined && drawdown > 1 - t;
      })
      .map(({ id }) => id)
      .sort(),
  );
}

/**
 * Markets the player holds a leveraged position in (|holding|>0 and leverage>1)
 * — the "what's at risk" read for a Dwarf-Fortress-style danger surface.
 */
export function queryLeveragedPositions(
  content: Content,
  state: GameState,
): Array<{ id: string; holding: number; leverage: number }> {
  return withWorld(content, state, (world) =>
    world
      .query(MarketRef, Position)
      .map((e) => ({
        id: e.get(MarketRef)?.id ?? "",
        holding: e.get(Position)?.holding ?? 0,
        leverage: e.get(Position)?.leverage ?? 1,
      }))
      .filter((p) => p.holding !== 0 && p.leverage > 1)
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
}
