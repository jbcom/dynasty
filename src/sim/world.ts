import { createWorld, trait } from "koota";
import { branchOf } from "./branch";
import type { Content } from "./content";
import { effectiveWeight, eligibleEvents } from "./events";
import { moralPoleOf } from "./moralAxis";
import type { Rng } from "./rng";
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
 * Seeded weighted next-event pick over the read-model — the declarative twin of
 * the pure `pickNextEvent` (events.ts), and the DE-1 migration of the core
 * selection step onto Koota. Projects the world, reads the Eligible entities and
 * SORTS them into explicit content-array order (not koota's query order — see the
 * orderOf map below), then applies the identical weighted draw. PARITY: returns
 * the same event id as pickNextEvent for the same
 * (content, state, rng) — proven by a parity test. The pure path stays the
 * source of truth; this is the ECS-native read used where a world is already in
 * hand. Determinism: the rng draw order matches the pure path exactly.
 */
export function pickNextEventViaWorld(
  content: Content,
  state: GameState,
  rng: Rng,
): GameEvent | null {
  const byId = new Map(content.allEvents.map((e) => [e.id, e]));
  // Content-array index per event id — the EXPLICIT, koota-version-independent
  // ordering key. weightedIndex() indexes into this order, so it must match
  // eligibleEvents' (content-order) order exactly; relying on world.query()'s
  // archetype-iteration order would be an unguarded invariant (rev-de1).
  const orderOf = new Map(content.allEvents.map((e, i) => [e.id, i]));
  const eligible = withWorld(content, state, (world) =>
    world
      .query(EventRef, Eligible, Weight)
      .map((e) => {
        const id = e.get(EventRef)?.id ?? "";
        const w = e.get(Weight);
        // An eligible entity is ALWAYS spawned with Weight by projectWorld — if it
        // isn't, that's a projection bug to surface, not mask with ?? 0 (rev-de1).
        if (w === undefined) throw new Error(`projected entity "${id}" is missing Weight`);
        return {
          event: byId.get(id),
          weight: w.value,
          order: orderOf.get(id) ?? Number.MAX_SAFE_INTEGER,
        };
      })
      .filter(
        (x): x is { event: GameEvent; weight: number; order: number } => x.event !== undefined,
      )
      // Sort into content order explicitly so the weighted draw is deterministic
      // regardless of koota's internal query order.
      .sort((a, b) => a.order - b.order),
  );
  if (eligible.length === 0) return null;
  const weights = eligible.map((x) => x.weight);
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return eligible[0]?.event ?? null;
  const idx = rng.weightedIndex(weights);
  return eligible[idx]?.event ?? null;
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
      .map((e) => {
        const id = e.get(EventRef)?.id ?? "";
        const w = e.get(Weight);
        if (w === undefined) throw new Error(`projected entity "${id}" is missing Weight`);
        return { id, weight: w.value };
      })
      .map(({ id, weight }) => ({ event: byId.get(id), weight }))
      .filter((x): x is { event: GameEvent; weight: number } => x.event !== undefined)
      .sort((a, b) => b.weight - a.weight || a.event.id.localeCompare(b.event.id)),
  );
}

/**
 * The run-wide context (active branch + moral pole) read off the projected
 * world rather than re-deriving it. Every event entity carries the same Branch
 * and Pole traits (the context is a property of the run, not the event), so this
 * reads the first entity's traits. Gives the projected Branch/Pole traits a real
 * consumer and is the ECS-native source for the moral-axis HUD (DE-2) + persona
 * analytics (DE-6). PARITY: equals branchOf(state) / moralPoleOf(state).
 */
export function queryRunContext(
  content: Content,
  state: GameState,
): { branch: string; pole: string } {
  return withWorld(content, state, (world) => {
    const first = world.query(EventRef, Branch, Pole)[0];
    return {
      branch: first?.get(Branch)?.key ?? branchOf(state),
      pole: first?.get(Pole)?.key ?? moralPoleOf(state),
    };
  });
}

/**
 * Eligible events whose moral pole matches the run's current pole — the
 * declarative read the moral-axis HUD + persona "is this pole reachable here"
 * analytics consume (DE-2/DE-6). Events carry no per-event pole; the run's pole
 * is uniform, so this is "the eligible set, tagged with the run pole" — useful
 * as the ECS-native grouping surface those phases build on. Deterministic order
 * (content order, like queryEligible).
 */
export function queryEligibleForPole(
  content: Content,
  state: GameState,
): { pole: string; events: GameEvent[] } {
  const byId = new Map(content.allEvents.map((e) => [e.id, e]));
  return withWorld(content, state, (world) => {
    const entities = world.query(EventRef, Eligible, Pole);
    const pole = entities[0]?.get(Pole)?.key ?? moralPoleOf(state);
    const events = entities
      .map((e) => byId.get(e.get(EventRef)?.id ?? ""))
      .filter((e): e is GameEvent => e !== undefined);
    return { pole, events };
  });
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
