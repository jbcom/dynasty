import type { Content } from "./content";
import type { Rng } from "./rng";
import type { GameEvent, MeterId, Requires } from "./schema";
import type { GameState } from "./state";

type Comparator = (a: number, b: number) => boolean;

const COMPARATORS: Record<string, Comparator> = {
  ">=": (a, b) => a >= b,
  "<=": (a, b) => a <= b,
  "==": (a, b) => a === b,
  "!=": (a, b) => a !== b,
  ">": (a, b) => a > b,
  "<": (a, b) => a < b,
};

const COMPARATOR_RE = /^(>=|<=|==|!=|>|<)\s*(-?\d+(?:\.\d+)?)$/;

/** Evaluate a single comparator string like ">=20" against a meter value. */
export function evalComparator(expr: string, value: number): boolean {
  const m = COMPARATOR_RE.exec(expr.trim());
  if (!m) throw new Error(`Bad comparator: "${expr}"`);
  const op = m[1] as keyof typeof COMPARATORS;
  const operand = Number(m[2]);
  const fn = COMPARATORS[op];
  if (!fn) throw new Error(`Bad comparator op: "${op}"`);
  return fn(value, operand);
}

/** Whether a state satisfies a `requires` gate. */
export function meetsRequires(state: GameState, req: Requires): boolean {
  for (const f of req.flags) {
    if (!state.flags.includes(f)) return false;
  }
  for (const f of req.notFlags) {
    if (state.flags.includes(f)) return false;
  }
  for (const [id, expr] of Object.entries(req.meters) as [MeterId, string][]) {
    const value = state.meters[id];
    if (value === undefined || !evalComparator(expr, value)) return false;
  }
  if (req.minAge !== undefined && state.age < req.minAge) return false;
  if (req.maxAge !== undefined && state.age > req.maxAge) return false;
  return true;
}

/** Has this event already fired and is not allowed to repeat? */
function alreadyConsumed(state: GameState, ev: GameEvent): boolean {
  return !ev.repeatable && state.firedEvents.includes(ev.id);
}

/** All events in the current era that are eligible right now. */
export function eligibleEvents(content: Content, state: GameState): GameEvent[] {
  const era = content.eras[state.eraIndex];
  if (!era) return [];
  const pool = content.eventsByEra.get(era.id) ?? [];
  return pool.filter(
    (ev) => !alreadyConsumed(state, ev) && meetsRequires(state, ev.requires),
  );
}

/**
 * Effective selection weight for an event: its base weight scaled by any
 * butterfly rules whose cause is currently active, and by accumulated ripple
 * pressure on channels matching the event's tags (the chaos engine, part C).
 */
export function effectiveWeight(
  content: Content,
  state: GameState,
  ev: GameEvent,
): number {
  let weight = ev.weight;

  for (const rule of content.butterflyRules) {
    const causeActive =
      state.flags.includes(rule.cause) || (state.ripples[rule.cause] ?? 0) > 0;
    if (!causeActive) continue;
    const matches =
      rule.affectsKind === "event"
        ? rule.affects === ev.id
        : ev.tags.includes(rule.affects);
    if (!matches) continue;
    if (rule.locks) return 0;
    weight *= rule.weightMultiplier;
  }

  // Ripple pressure on a channel named after one of the event's tags nudges it.
  for (const tag of ev.tags) {
    const pressure = state.ripples[tag];
    if (pressure) weight *= 1 + pressure;
  }

  return Math.max(0, weight);
}

/**
 * Pick the next event via seeded weighted selection. Returns null when nothing
 * is eligible (era is exhausted). Deterministic for a given (state, rng) pair.
 */
export function pickNextEvent(
  content: Content,
  state: GameState,
  rng: Rng,
): GameEvent | null {
  const eligible = eligibleEvents(content, state);
  if (eligible.length === 0) return null;

  const weights = eligible.map((ev) => effectiveWeight(content, state, ev));
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) {
    // Everything is locked to zero weight — fall back to first eligible so the
    // run can still progress deterministically rather than stalling.
    return eligible[0] ?? null;
  }
  const idx = rng.weightedIndex(weights);
  return eligible[idx] ?? null;
}
