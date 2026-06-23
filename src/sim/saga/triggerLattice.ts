/**
 * THE DETERMINISTIC-TRIGGER LATTICE (FS-5) — the anchoring system for the one dynasty spine.
 *
 * Because the wave families are no longer separately playable, their mined fabric (FS-4) doesn't weave at
 * fixed braid SLOTS — instead, COMPOUND DETERMINISTIC CONDITIONS on the spine's state activate ENTIRE
 * family BRANCHES ([[founding-spine-pivot]]). A branch fires when ALL its conditions hold:
 *
 *   IF archetype = X  AND  leanings/motivators ⋛ Y  AND  money/meters ⋛ Z  AND  place = L
 *   AND era ∈ E  AND  flags include/exclude F  AND  priorCrossing(family) ⋛ N   →  activate family.branch[B]
 *
 * Everything the predicate reads is DETERMINISTIC spine state, so the same playthrough fires the same
 * branches every replay — determinism + the save model hold for free, and the variety is EMERGENT from
 * authored material (no RNG; [[emergent-cause-effect-sim]]). The recurring families carry CONTINUITY +
 * MEMORY (the Turtledove model): a branch can require a PRIOR crossing with that family, so later meetings
 * pay off earlier ones.
 *
 * Pure + deterministic — no DOM, no IO, no RNG, no Date.
 */

/** The deterministic spine-state projection a trigger reads (a flat, replay-stable vector). */
export interface SpineState {
  archetype: string;
  /** Motivator leanings, −100..100 per axis (wealth/politics/worldview/power/tradition/honor/lineage/reach). */
  leanings: Record<string, number>;
  /** Meters (money/power/reputation/health/heat/loyalty …). */
  meters: Record<string, number>;
  place: string;
  year: number;
  era: string;
  flags: ReadonlySet<string>;
  /** Per-family crossing memory: how many times the line has already crossed each family. */
  crossings: Record<string, number>;
}

/** A numeric comparison: the state value must be ≥ min and ≤ max (either bound optional). */
export interface Range {
  min?: number;
  max?: number;
}

/** A compound, all-of trigger condition. Every present clause must hold for the branch to fire. */
export interface TriggerCondition {
  archetype?: string;
  /** Per-axis leaning ranges (e.g. { power: { min: 40 } } — a power-leaning line). */
  leanings?: Record<string, Range>;
  /** Per-meter ranges (e.g. { money: { min: 1000 } } — a moneyed line). */
  meters?: Record<string, Range>;
  place?: string;
  /** Eras this branch can fire in (any-of); omitted = any era. */
  eras?: string[];
  /** Year window. */
  year?: Range;
  /** Flags that MUST be set. */
  flags?: string[];
  /** Flags that must NOT be set. */
  notFlags?: string[];
  /** Required prior-crossing count with this branch's family (e.g. { min: 1 } = met before — memory). */
  priorCrossing?: Range;
}

/** A rule = a family + a branch, its fire condition, and firing policy. */
export interface TriggerRule {
  /** The family (wave) this branch belongs to — the recurring cast member. */
  family: string;
  /** The branch id within that family (a whole arc of mined/rewritten fabric). */
  branch: string;
  /** Higher fires first when several rules match the same beat. */
  priority?: number;
  /** Fire at most once per run (a branch that shouldn't recur). Default false. */
  once?: boolean;
  condition: TriggerCondition;
}

const inRange = (v: number, r?: Range): boolean =>
  r === undefined || ((r.min === undefined || v >= r.min) && (r.max === undefined || v <= r.max));

/** Does the spine state satisfy a compound condition? (All present clauses must hold — pure.) */
export function conditionMet(cond: TriggerCondition, s: SpineState, family: string): boolean {
  if (cond.archetype !== undefined && cond.archetype !== s.archetype) return false;
  if (cond.place !== undefined && cond.place !== s.place) return false;
  if (cond.eras !== undefined && !cond.eras.includes(s.era)) return false;
  if (!inRange(s.year, cond.year)) return false;
  for (const [axis, r] of Object.entries(cond.leanings ?? {}))
    if (!inRange(s.leanings[axis] ?? 0, r)) return false;
  for (const [m, r] of Object.entries(cond.meters ?? {}))
    if (!inRange(s.meters[m] ?? 0, r)) return false;
  for (const f of cond.flags ?? []) if (!s.flags.has(f)) return false;
  for (const f of cond.notFlags ?? []) if (s.flags.has(f)) return false;
  if (!inRange(s.crossings[family] ?? 0, cond.priorCrossing)) return false;
  return true;
}

/** A branch that fired, with its family — what the runner weaves into the spine prose. */
export interface ActivatedBranch {
  family: string;
  branch: string;
  priority: number;
}

/**
 * Evaluate the whole lattice against the current spine state → the branches that fire, highest priority
 * first (ties broken by family then branch id for stable, replay-deterministic output). `firedBranches`
 * is the run's set of already-fired `family:branch` keys (so `once` rules don't re-fire). Pure.
 */
export function evaluateTriggers(
  rules: readonly TriggerRule[],
  s: SpineState,
  firedBranches: ReadonlySet<string> = new Set(),
): ActivatedBranch[] {
  const out: ActivatedBranch[] = [];
  for (const rule of rules) {
    const key = `${rule.family}:${rule.branch}`;
    if (rule.once && firedBranches.has(key)) continue;
    if (!conditionMet(rule.condition, s, rule.family)) continue;
    out.push({ family: rule.family, branch: rule.branch, priority: rule.priority ?? 0 });
  }
  return out.sort(
    (a, b) =>
      b.priority - a.priority ||
      (a.family < b.family ? -1 : a.family > b.family ? 1 : a.branch < b.branch ? -1 : 1),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The recurring-family CAST — continuity + memory (the Turtledove model)
// ─────────────────────────────────────────────────────────────────────────────

/** One recurring cast family's live state — it grows alongside the spine + remembers prior crossings. */
export interface CastFamily {
  /** The family (wave) id. */
  id: string;
  /** A stable surname for the family across the run (so the player recognizes them generations later). */
  surname: string;
  /** The family's generation depth (advances as the saga moves through eras). */
  generation: number;
  /** Branches already crossed with the player (the memory). */
  crossed: string[];
}

/** Initialize the recurring cast (one family per wave). Deterministic — surnames come from the corpus/data. */
export function initCast(families: ReadonlyArray<{ id: string; surname: string }>): CastFamily[] {
  return families.map((f) => ({ id: f.id, surname: f.surname, generation: 0, crossed: [] }));
}

/** Record a crossing with a family (memory update) — returns a new cast array (pure). */
export function recordCrossing(
  cast: readonly CastFamily[],
  family: string,
  branch: string,
): CastFamily[] {
  return cast.map((f) =>
    f.id === family && !f.crossed.includes(branch) ? { ...f, crossed: [...f.crossed, branch] } : f,
  );
}

/** The crossings map (family → count) for the SpineState projection, from cast memory. Pure. */
export function crossingsOf(cast: readonly CastFamily[]): Record<string, number> {
  return Object.fromEntries(cast.map((f) => [f.id, f.crossed.length]));
}

/**
 * The flag CONVENTION for crossing memory in the deterministic save state: a crossing with `family` via
 * `branch` sets the flag `crossed:<family>:<branch>`. This keeps the recurring-cast memory inside the
 * already-saved+replayed `flags` set (no schema change needed) while staying fully deterministic. Pure.
 */
export const crossedFlag = (family: string, branch: string): string =>
  `crossed:${family}:${branch}`;

/** Count distinct crossings per family from the run's flags (the `crossed:<family>:<branch>` convention). */
export function crossingsFromFlags(flags: Iterable<string>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of flags) {
    const m = /^crossed:([^:]+):/.exec(f);
    if (m?.[1]) counts[m[1]] = (counts[m[1]] ?? 0) + 1;
  }
  return counts;
}

/**
 * Build the deterministic SpineState projection the trigger lattice reads, from the engine's game state.
 * Pure — `leanings` is the motivator vector, `era` comes from the caller (macroActForYear), crossings from
 * the flag convention. Keeps the lattice decoupled from the full GameState shape (only the fields it needs).
 */
export function spineStateProjection(input: {
  archetype: string;
  leanings: Record<string, number>;
  meters: Record<string, number>;
  place: string;
  year: number;
  era: string;
  flags: Iterable<string>;
}): SpineState {
  const flagSet = new Set(input.flags);
  return {
    archetype: input.archetype,
    leanings: input.leanings,
    meters: input.meters,
    place: input.place,
    year: input.year,
    era: input.era,
    flags: flagSet,
    crossings: crossingsFromFlags(flagSet),
  };
}
