import { branchOf } from "./branch";
import { callingById, callingWeight } from "./callings";
import type { Content } from "./content";
import type { PersonalityAxis } from "./personality";
import { materializeProcedural } from "./procgen";
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

/**
 * Whether a state satisfies a `requires` gate. Accepts a partial requires shape
 * (parsed content always supplies the defaults; callers/tests may omit fields).
 */
export function meetsRequires(state: GameState, req: Partial<Requires>): boolean {
  for (const f of req.flags ?? []) {
    if (!state.flags.includes(f)) return false;
  }
  for (const f of req.notFlags ?? []) {
    if (state.flags.includes(f)) return false;
  }
  for (const [id, expr] of Object.entries(req.meters ?? {}) as [MeterId, string][]) {
    const value = state.meters[id];
    if (value === undefined || !evalComparator(expr, value)) return false;
  }
  for (const [axis, expr] of Object.entries(req.personality ?? {}) as [
    keyof GameState["personality"],
    string,
  ][]) {
    const value = state.personality[axis];
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

/**
 * The event's historicity (FD-2): explicit `historicity` if authored, else
 * reconciled from the legacy `extrapolated` boolean (true ⇒ "extrapolated"),
 * else "personal" (the default for authored protagonist/family beats). Single
 * source of truth so the migrated world-timeline events and authored events read
 * uniformly.
 */
export function historicityOf(ev: GameEvent): "real" | "extrapolated" | "personal" {
  if (ev.historicity) return ev.historicity;
  return ev.extrapolated ? "extrapolated" : "personal";
}

/** Below this many forward authored beats, the procedural pool fills the gap. */
const PROC_THRESHOLD = 3;
/** At most this many procedural events are materialized into a single selection. */
const PROC_CAP = 4;

/**
 * All events in the current era that are eligible right now. Time only moves
 * forward: an event whose year is earlier than the last fired event is excluded
 * so the player is never "sent back in time". If that would leave nothing
 * eligible (e.g. all remaining events predate the floor), the floor is relaxed
 * so the era can still progress.
 *
 * When an `rng` is supplied (live play / replay) and the authored forward pool
 * has thinned below PROC_THRESHOLD, the procedural pool (FD-4) lazily materializes
 * up to PROC_CAP expanded events for the era — keyed by the supplied rng so replay
 * reconstructs them identically. The rng-less path (analysis/dumps) stays
 * pure-authored.
 */
export function eligibleEvents(content: Content, state: GameState, rng?: Rng): GameEvent[] {
  const era = content.eras[state.eraIndex];
  if (!era) return [];
  const pool = content.eventsByEra.get(era.id) ?? [];
  const protoBase = pool.filter(
    (ev) =>
      !alreadyConsumed(state, ev) &&
      !ownedByOtherArchetype(state, ev) &&
      !placeMismatch(state, ev) &&
      meetsRequires(state, ev.requires),
  );
  // World-events are AMBIENT PUNCTUATION: only the few most-TIMELY ones (near the
  // run's current year) are eligible, not every backdrop event in the era. This
  // keeps them occasional context the family lives through "now" rather than a
  // flood that swamps the protagonist arc + stalls era progression (FD-2.3). They
  // are budget-neutral (applyChoice doesn't advance the era on them) + low-weight.
  const WORLD_WINDOW = 12; // in-world years ahead the family can "see"
  const WORLD_CAP = 4; // at most this many backdrop events offered at once
  const worldEligible = (content.worldEvents ?? [])
    .filter(
      (ev) =>
        !ownedByOtherArchetype(state, ev) &&
        !alreadyConsumed(state, ev) &&
        meetsRequires(state, ev.requires) &&
        ev.year >= state.lastEventYear &&
        ev.year <= state.year + WORLD_WINDOW,
    )
    .sort((a, b) => a.year - b.year || a.id.localeCompare(b.id))
    .slice(0, WORLD_CAP);
  // Forward-floor applies to the protagonist beats (the spine); fall back to the
  // unfloored proto pool if nothing remains so the era still progresses.
  const protoForward = protoBase.filter((ev) => ev.year >= state.lastEventYear);
  const proto = protoForward.length > 0 ? protoForward : protoBase;

  // EPOCH-0 INJECTION (EX-5): the birth + partner + heirs life-stage beats must fire
  // at the START of EVERY run regardless of founding era — gated by the line's own
  // state flags (founded_line + the chain), not by an era, so a baghdad/caliphate
  // line gets born, partners, and begets just like a new-york/origins one (else it
  // goes extinct in one generation). They bypass the year-floor (a birth beat is
  // "now"); applyChoice clamps the year so the clock never jumps backward.
  const inPool = new Set(proto.map((e) => e.id));
  const epoch0 = (content.epoch0Events ?? []).filter(
    (ev) =>
      !inPool.has(ev.id) &&
      !alreadyConsumed(state, ev) &&
      !ownedByOtherArchetype(state, ev) &&
      !placeMismatch(state, ev) &&
      meetsRequires(state, ev.requires),
  );

  // LAZY BOUNDED procedural fill (FD-4.2): only when the authored forward pool has
  // thinned and an rng is available to keep the expansion replay-deterministic.
  let procedural: GameEvent[] = [];
  if (rng && proto.length + epoch0.length < PROC_THRESHOLD) {
    procedural = materializeProcedural(content, state, era, rng.fork("procgen"), PROC_CAP).filter(
      (ev) => !alreadyConsumed(state, ev),
    );
  }
  return [...proto, ...epoch0, ...worldEligible, ...procedural];
}

/**
 * NO-LEAK GATE (user invariant — a founded line stays its own line). An event is
 * excluded when it is ARCHETYPE-LOCKED to a power base other than the run's. Two
 * sources, both honored (CP-R-ARCH):
 *   1. The first-class `archetypes: [...]` field — the event serves only those
 *      power bases. Empty/absent = AGNOSTIC, passes for every archetype.
 *   2. The legacy `archetype:<id>` TAG (single owner) — kept for back-compat until
 *      all content migrates to the field; the former literal `dynasty:<id>` tags
 *      map onto archetypes here (FD-3.5).
 * An event is owned-by-other when EITHER source names a set that excludes the run's
 * archetype. Agnostic events (no field, no tag) pass for all.
 */
function ownedByOtherArchetype(state: GameState, ev: GameEvent): boolean {
  const list = ev.archetypes ?? [];
  if (list.length > 0 && !list.includes(state.archetype)) return true;
  const owner = ev.tags.find((t) => t.startsWith("archetype:"))?.slice("archetype:".length);
  return owner !== undefined && owner !== state.archetype;
}

/**
 * PLACE GATE (EX-2): an event with a `place` set is place-SPECIFIC — it fires only
 * for a founded line whose founding place matches. Absent `place` = place-AGNOSTIC
 * (the common case; the shared life-arc). Lets a place author its own variant of an
 * era beat (a Bavarian boyhood vs an Irish one) in `eras/<place>/<period>/` without
 * it leaking into other places' runs.
 */
function placeMismatch(state: GameState, ev: GameEvent): boolean {
  if (!ev.place) return false;
  return ev.place !== state.founding?.place;
}

/**
 * Effective selection weight for an event: its base weight scaled by any
 * butterfly rules whose cause is currently active, and by accumulated ripple
 * pressure on channels matching the event's tags (the chaos engine, part C).
 */
export function effectiveWeight(content: Content, state: GameState, ev: GameEvent): number {
  let weight = ev.weight;

  for (const rule of content.butterflyRules) {
    const causeActive = state.flags.includes(rule.cause) || (state.ripples[rule.cause] ?? 0) > 0;
    if (!causeActive) continue;
    const matches =
      rule.affectsKind === "event" ? rule.affects === ev.id : ev.tags.includes(rule.affects);
    if (!matches) continue;
    if (rule.locks) return 0;
    weight *= rule.weightMultiplier;
  }

  // Ripple pressure on a channel named after one of the event's tags nudges it.
  for (const tag of ev.tags) {
    const pressure = state.ripples[tag];
    if (pressure) weight *= 1 + pressure;
  }

  // Selection BIAS (AH9): pull the chaos field toward the run's character —
  // branch affinity (a Reich event is likelier on the Nazi line) and personality
  // affinity (a grandiose run surfaces grandiose events). The personality bias is
  // a per-axis sensitivity: weight scales by 1 + sensitivity * (axis/100), so a
  // positive sensitivity boosts the event as that axis rises and damps it as the
  // axis falls (and vice-versa for a negative sensitivity).
  if (ev.bias) {
    const branchMult = ev.bias.branch[branchOf(state)];
    if (branchMult !== undefined) weight *= branchMult;
    for (const [axis, sensitivity] of Object.entries(ev.bias.personality) as [
      PersonalityAxis,
      number,
    ][]) {
      const axisValue = state.personality[axis] ?? 0;
      weight *= Math.max(0, 1 + sensitivity * (axisValue / 100));
    }
  }

  // CALLING bias (CP-2): the founding calling weights events carrying its tropes,
  // so a Scholar line surfaces prophet/reformer beats more often, layered on top
  // of the branch + personality bias above.
  if (state.founding?.calling) {
    weight *= callingWeight(callingById(content.callings, state.founding.calling), ev);
  }

  return Math.max(0, weight);
}

/**
 * Pick the next event via seeded weighted selection. Returns null when nothing
 * is eligible (era is exhausted). Deterministic for a given (state, rng) pair.
 */
export function pickNextEvent(content: Content, state: GameState, rng: Rng): GameEvent | null {
  // Thread the rng so the procedural pool can lazily fill a thin authored era,
  // deterministically (fork keeps the selection draw below independent of it).
  const eligible = eligibleEvents(content, state, rng.fork("eligible"));
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
