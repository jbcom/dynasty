/**
 * CLASS RUNG (Convergence Saga, SS-5).
 *
 * Class is not a fixed label — it's a movable RUNG on a ladder a line travels BOTH directions on,
 * and each rung has its own authored storyline track (poor / middle / upper, extended by the
 * Emergence/Ascension tiers). Class trajectory has three drivers:
 *   1. INTENT        — the line climbs (or deliberately stays poor: austere/rebellious/communist).
 *   2. MOTIVATOR GATE — biases enable/forbid the climb.
 *   3. ACCIDENTAL MISFORTUNE — bad luck at war/disease/financial-collapse shocks DROPS the line a
 *      rung (it lives the lower track a while), then it can recover. Hysteresis: a fallen-then-
 *      recovered line keeps a mark ("knew hunger once") that nudges its motivators.
 *
 * Pure + deterministic: the misfortune roll takes an injected createRng-seeded value; never Math.random.
 */

import { type Epoch, vulnerableToShock } from "./macroActs";
import { applyMotivators, type Motivators } from "./motivators";
import type { Rng } from "./rng";

/** The class rungs, low → high. Index into authored class-track content. */
export const RUNGS = ["poor", "working", "middle", "comfortable", "upper"] as const;
export type Rung = (typeof RUNGS)[number];

export const MIN_RUNG = 0;
export const MAX_RUNG = RUNGS.length - 1;

function clampRung(i: number): number {
  return i < MIN_RUNG ? MIN_RUNG : i > MAX_RUNG ? MAX_RUNG : i;
}

/** The rung name for an index. */
export function rungName(index: number): Rung {
  return RUNGS[clampRung(index)] as Rung;
}

/**
 * The SAGA class track a line reads, from its Wealth motivator. The novel corpus authors two tracks —
 * "poor" and "middle" — so class is a MOVABLE rung: a line that climbs above centrist Wealth reads the
 * middle track, one at or below it reads the poor track. (Maps the [-100,100] Wealth axis to the two
 * authored tracks; widens naturally if richer tracks are authored later.) Pure.
 */
export function sagaClassForWealth(wealth: number): "poor" | "middle" {
  return wealth > 0 ? "middle" : "poor";
}

/** A line's class position: the current rung + how far it has fallen below its high-water mark + the mark. */
export interface ClassState {
  /** Current rung index (0..MAX_RUNG). Selects the eligible class-track. */
  rung: number;
  /** Highest rung ever reached — recovery climbs back toward this. */
  peakRung: number;
  /** True once the line has fallen by misfortune and not yet fully recovered. Drives the hysteresis mark. */
  hasFallen: boolean;
  /** Durable flags the fall left (e.g. "knew_hunger_once"). */
  marks: string[];
}

/** A fresh class state at a starting rung (waves arrive poor or middle — SS-7 sets this). */
export function initClassState(startRung: number): ClassState {
  const r = clampRung(startRung);
  return { rung: r, peakRung: r, hasFallen: false, marks: [] };
}

/** Climb one rung (intent + motivator-gated success). Raises the peak. Pure. */
export function climb(state: ClassState): ClassState {
  const rung = clampRung(state.rung + 1);
  return { ...state, rung, peakRung: Math.max(state.peakRung, rung) };
}

/**
 * Apply a MISFORTUNE shock for the active epoch. If the line is vulnerable to the shock (its
 * motivators lean against what the epoch rewards) AND a seeded roll lands within the hit chance,
 * it DROPS one or more rungs (deeper drop the more vulnerable), records the fall + a hysteresis
 * mark. Returns the (possibly unchanged) state. Pure given the injected rng.
 */
export function applyMisfortune(
  state: ClassState,
  epoch: Epoch,
  motivators: Motivators,
  rng: Rng,
): { state: ClassState; dropped: number } {
  if (!vulnerableToShock(epoch, motivators)) return { state, dropped: 0 };
  // hit chance + drop depth scale with how badly the shock works against the line.
  const roll = rng.fork(`misfortune:${epoch.id}`).int(1, 100);
  if (roll > 60) return { state, dropped: 0 }; // weathered it
  const depth = roll <= 20 ? 2 : 1; // a hard hit drops two rungs
  const rung = clampRung(state.rung - depth);
  const dropped = state.rung - rung;
  if (dropped <= 0) return { state, dropped: 0 };
  const marks = state.marks.includes("knew_hunger_once")
    ? state.marks
    : [...state.marks, "knew_hunger_once"];
  return { state: { ...state, rung, hasFallen: true, marks }, dropped };
}

/** Recover one rung toward the line's peak (after a fall). Clears `hasFallen` once back at peak. Pure. */
export function recover(state: ClassState): ClassState {
  if (state.rung >= state.peakRung) return { ...state, hasFallen: false };
  const rung = clampRung(state.rung + 1);
  return { ...state, rung, hasFallen: rung < state.peakRung };
}

/**
 * Apply the HYSTERESIS mark's lasting effect on motivators: a line that knew hunger drifts toward
 * Community (power−) and Self↔Lineage (values continuity), and away from naive cunning. Applied
 * once when the mark is first earned (SS-8 wires this into the turn). Pure.
 */
export function applyHysteresis(m: Motivators, marks: readonly string[]): Motivators {
  if (!marks.includes("knew_hunger_once")) return m;
  return applyMotivators(m, { power: -8, lineage: 8, honor: -4 });
}
