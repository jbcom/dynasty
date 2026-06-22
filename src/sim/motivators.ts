/**
 * MOTIVATORS (Convergence Saga, SS-1) — the 8-axis grounding model that REPLACES the old
 * 4-axis personality vector. A line's motivators are what ground its ability to shape the
 * future: they DRIFT across generations (inheritance + each choice nudges them) and they GATE
 * which act-branches / futures are reachable and how each cross-cutting EPOCH impacts the line.
 *
 * Each axis is a signed scalar in [-100, +100], a lean–centrist–lean triad (0 = centrist).
 * Pure data + pure helpers — no DOM, no randomness (RNG, where needed, is injected elsewhere
 * via createRng; this module never reaches for Math.random).
 *
 * | axis        | − pole      | + pole      |
 * |-------------|-------------|-------------|
 * | wealth      | poor        | rich        |
 * | politics    | left        | right       |
 * | worldview   | faith       | science     |
 * | power       | community   | power       |
 * | tradition   | tradition   | progress    |   (Tradition ↔ Progress — the epoch-reaction lever)
 * | honor       | honor       | cunning     |   (Honor ↔ Cunning — how the line wins)
 * | lineage     | self        | lineage     |   (Self ↔ Lineage — the dynastic tension)
 * | reach       | insular     | expansive   |   (Insular ↔ Expansive — homeland vs diaspora/empire)
 */

export const MOTIVATOR_AXES = [
  "wealth",
  "politics",
  "worldview",
  "power",
  "tradition",
  "honor",
  "lineage",
  "reach",
] as const;

export type MotivatorAxis = (typeof MOTIVATOR_AXES)[number];

/** The 8-axis motivator vector. Each axis in [-100, +100]; 0 = centrist. */
export type Motivators = Record<MotivatorAxis, number>;

/** A partial map of axis → delta applied by a choice (the drift input). */
export type MotivatorDelta = Partial<Record<MotivatorAxis, number>>;

/** Human-readable pole names per axis, for HUD + report copy. */
export const MOTIVATOR_POLES: Record<MotivatorAxis, { neg: string; pos: string }> = {
  wealth: { neg: "poor", pos: "rich" },
  politics: { neg: "left", pos: "right" },
  worldview: { neg: "faith", pos: "science" },
  power: { neg: "community", pos: "power" },
  tradition: { neg: "tradition", pos: "progress" },
  honor: { neg: "honor", pos: "cunning" },
  lineage: { neg: "self", pos: "lineage" },
  reach: { neg: "insular", pos: "expansive" },
};

const MIN = -100;
const MAX = 100;

function clamp(v: number): number {
  return v < MIN ? MIN : v > MAX ? MAX : v;
}

/** Starting motivators: centrist on every axis (the line's character is yet unwritten). */
export function initMotivators(): Motivators {
  return {
    wealth: 0,
    politics: 0,
    worldview: 0,
    power: 0,
    tradition: 0,
    honor: 0,
    lineage: 0,
    reach: 0,
  };
}

/** Alias used by callers that read "create" semantics. */
export const createMotivators = initMotivators;

/** Apply a delta map; returns a NEW Motivators (pure), each axis clamped to [-100, 100]. */
export function applyMotivators(m: Motivators, delta: MotivatorDelta): Motivators {
  const out = { ...m };
  for (const axis of MOTIVATOR_AXES) {
    out[axis] = clamp(m[axis] + (delta[axis] ?? 0));
  }
  return out;
}

/**
 * DRIFT across a generation: the heir inherits the parent's motivators pulled a fraction toward
 * centrist (a new person is not a carbon copy of the parent), then any per-generation delta is
 * applied. Pure: `regression` in [0,1] (default 0.25) is how far each axis relaxes toward 0.
 */
export function driftMotivators(
  parent: Motivators,
  delta: MotivatorDelta = {},
  regression = 0.25,
): Motivators {
  const relaxed = {} as Motivators;
  for (const axis of MOTIVATOR_AXES) {
    relaxed[axis] = clamp(Math.round(parent[axis] * (1 - regression)));
  }
  return applyMotivators(relaxed, delta);
}

/**
 * GATE: does the line's motivator profile satisfy a requirement gate? A gate is a partial map of
 * axis → {min?, max?} thresholds; ALL present thresholds must hold. This is how reachable
 * act-branches / futures / endings are grounded in the line's character (e.g. a Cunning-conquest
 * stars ending requires honor >= +40 and power >= +40). Pure.
 */
export type MotivatorGate = Partial<Record<MotivatorAxis, { min?: number; max?: number }>>;

export function meetsMotivatorGate(m: Motivators, gate: MotivatorGate): boolean {
  for (const axis of MOTIVATOR_AXES) {
    const g = gate[axis];
    if (!g) continue;
    if (g.min !== undefined && m[axis] < g.min) return false;
    if (g.max !== undefined && m[axis] > g.max) return false;
  }
  return true;
}

/** The dominant motivator: the axis with the largest absolute lean (ties → axis order). Used to COLOR endings + tone. */
/** Below this magnitude a lean reads as "centrist" — shared by the HUD strip + the dominant readout. */
export const CENTRIST_DEADZONE = 12;

export function dominantMotivator(m: Motivators): {
  axis: MotivatorAxis;
  value: number;
  pole: string;
} {
  let best: MotivatorAxis = MOTIVATOR_AXES[0];
  for (const axis of MOTIVATOR_AXES) {
    if (Math.abs(m[axis]) > Math.abs(m[best])) best = axis;
  }
  const value = m[best];
  // A barely-off-zero dominant still reads as centrist, so the headline ("A poor line") never
  // contradicts the strip (which calls the same near-zero value "centrist").
  const pole =
    Math.abs(value) < CENTRIST_DEADZONE
      ? "centrist"
      : value < 0
        ? MOTIVATOR_POLES[best].neg
        : MOTIVATOR_POLES[best].pos;
  return { axis: best, value, pole };
}

/** Label one axis's current lean for HUD/report copy ("strongly rich", "centrist", "leaning faith"). */
export function axisLabel(m: Motivators, axis: MotivatorAxis): string {
  const v = m[axis];
  const poles = MOTIVATOR_POLES[axis];
  const pole = v < 0 ? poles.neg : poles.pos;
  const mag = Math.abs(v);
  if (mag < CENTRIST_DEADZONE) return "centrist";
  if (mag < 45) return `leaning ${pole}`;
  if (mag < 75) return pole;
  return `strongly ${pole}`;
}
