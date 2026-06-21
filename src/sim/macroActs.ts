/**
 * MACRO-ACTS + EPOCHS (Convergence Saga, SS-4).
 *
 * The whole bloodline saga moves through three MACRO-ACTS — "the story of America":
 *   I.  CONVERGENCE (the 1800s)   — the immigration waves arrive + converge in America.
 *   II. EMERGENCE   (the 1900s)   — the lines stratify, rise, intersect; importance emerges.
 *   III.ASCENSION   (2000s+)      — the surviving dynasties climb toward (or fail to reach) the stars.
 *
 * Cutting ACROSS all lines are EPOCHS — cultural/social/technological shifts (industrial → atomic
 * → space …). An epoch is a world-state input every GOAP evaluator can read: the SAME epoch helps
 * a Progress-leaning line and hurts a Tradition-leaning one. epochImpact() returns that signed
 * effect, gated by the line's motivators. Pure + deterministic — no DOM, no randomness.
 */

import { type Motivators, meetsMotivatorGate } from "./motivators";

export type MacroAct = "convergence" | "emergence" | "ascension";

/** The year bands for the three macro-acts (a line's per-generation acts flow through these by year). */
export const MACRO_ACT_BANDS: ReadonlyArray<{
  act: MacroAct;
  from: number;
  to: number;
  title: string;
}> = [
  { act: "convergence", from: -Infinity, to: 1899, title: "Convergence" },
  { act: "emergence", from: 1900, to: 2040, title: "Emergence" },
  { act: "ascension", from: 2041, to: Infinity, title: "Ascension" },
];

/** The macro-act a given year falls in. */
export function macroActForYear(year: number): MacroAct {
  for (const b of MACRO_ACT_BANDS) {
    if (year >= b.from && year <= b.to) return b.act;
  }
  return "ascension";
}

/** Display title for a macro-act. */
export function macroActTitle(act: MacroAct): string {
  return MACRO_ACT_BANDS.find((b) => b.act === act)?.title ?? act;
}

/**
 * The cross-cutting EPOCHS, in order. Each has a year it arrives and the motivator axis it most
 * rewards (a line leaning that way RIDES the epoch; the opposite pole is CRUSHED by it). `kind`
 * separates the disruptive shock epochs (war/collapse — the misfortune drivers, SS-5) from the
 * opportunity epochs (tech/social openings).
 */
export interface Epoch {
  id: string;
  title: string;
  from: number;
  /** Motivator axis the epoch rewards, and the direction (+1 favours the + pole). */
  axis: keyof Motivators;
  dir: 1 | -1;
  kind: "opportunity" | "shock";
}

export const EPOCHS: readonly Epoch[] = [
  {
    id: "industrial",
    title: "The Age of Machines",
    from: 1860,
    axis: "tradition",
    dir: 1,
    kind: "opportunity",
  },
  { id: "great_wars", title: "The World at War", from: 1914, axis: "power", dir: 1, kind: "shock" },
  {
    id: "mass_media",
    title: "The Broadcast Age",
    from: 1945,
    axis: "reach",
    dir: 1,
    kind: "opportunity",
  },
  {
    id: "atomic",
    title: "The Atomic Age",
    from: 2041,
    axis: "worldview",
    dir: 1,
    kind: "opportunity",
  },
  {
    id: "space",
    title: "The Reach for the Stars",
    from: 2080,
    axis: "reach",
    dir: 1,
    kind: "opportunity",
  },
];

/** The epoch active at a given year (the latest one that has arrived), or null before the first. */
export function epochForYear(year: number): Epoch | null {
  let active: Epoch | null = null;
  for (const e of EPOCHS) {
    if (year >= e.from) active = e;
  }
  return active;
}

/**
 * How an epoch impacts a line, in [-1, 1]: positive = the line RIDES it (its motivators align with
 * what the epoch rewards), negative = the epoch works AGAINST it. The line's lean on the epoch's
 * axis, in the epoch's direction, mapped to [-1,1]. A shock epoch's negative impact is the
 * misfortune pressure SS-5's class-rung system reads.
 */
export function epochImpact(epoch: Epoch, m: Motivators): number {
  const lean = m[epoch.axis] * epoch.dir; // [-100,100]
  return Math.max(-1, Math.min(1, lean / 100));
}

/**
 * Whether a line is VULNERABLE to a shock epoch (war/collapse) — true when it's a shock AND the
 * line is leaning against what the epoch rewards (impact < threshold). SS-5 uses this to decide
 * whether the misfortune tract drops the line a rung. Pure.
 */
export function vulnerableToShock(epoch: Epoch, m: Motivators, threshold = -0.2): boolean {
  return epoch.kind === "shock" && epochImpact(epoch, m) < threshold;
}

/** Convenience: does a line's motivator profile clear a macro-act-stage gate? (re-exported helper) */
export { meetsMotivatorGate };
