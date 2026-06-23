/**
 * WV-3-MORTALITY — seeded DISRUPTION/MORTALITY shocks on the saga clock (anti-Suzerain divergence).
 *
 * The divergence audit (divergenceAudit.unit) found the founded SAGA path near-identical across seeds:
 * the seeded market substrate that diverges the EVENT path is inert on the saga clock, so every run plays
 * the same arc to the same ending. This module injects the missing exogenous variability — a per-saga-tick,
 * era-weighted, SEEDED chance of a shock that strikes the family OR a meter, so the line's path is no longer
 * fully player-controlled and runs DIVERGE in events (an unplanned death forces an early succession; a loss
 * reshapes the family; a meter shock can move the convergence gate).
 *
 * PURE + DETERMINISTIC: every roll comes from an injected createRng-seeded fork (no Math.random/Date.now),
 * so the same seed + choices reconstructs the identical run (emergence ≠ nondeterminism,
 * [[emergent-cause-effect-sim]]). The era-medicine factor (mortality.ts) tempers the hazard so modern/future
 * eras are gentler than the harsh founding centuries.
 */

import { macroActMedicine } from "./mortality";
import type { Rng } from "./rng";
import type { MeterId } from "./schema";
import { type FamilyState, isMemberAlive } from "./state";

/** A shock kind — what the disruption hits. */
export type SagaShockKind =
  | "none"
  | "family_death" // an exogenous death of a (non-protagonist) family member
  | "meter_blow"; // a sudden hit to a single meter (plague-driven loss, panic, scandal)

/** A resolved shock: what happened this tick. `none` when the hazard didn't fire. */
export interface SagaShock {
  kind: SagaShockKind;
  /** For family_death: the member id struck (already marked died in the returned family). */
  memberId?: string;
  /** For meter_blow: which meter and the (negative) delta to apply. */
  meter?: MeterId;
  delta?: number;
  /** A short situational tag for the prose/UI seed (e.g. "plague", "fire", "panic"). */
  note?: string;
}

/** The meters a shock can blow, with the flavor note that frames it. Negative-only (shocks are losses). */
const METER_BLOWS: ReadonlyArray<{ meter: MeterId; note: string; min: number; max: number }> = [
  { meter: "health", note: "plague", min: -25, max: -8 },
  { meter: "money", note: "fire", min: -40, max: -12 },
  { meter: "reputation", note: "scandal", min: -20, max: -6 },
  { meter: "loyalty", note: "betrayal", min: -18, max: -5 },
  { meter: "heat", note: "scrutiny", min: 6, max: 20 }, // heat RISES (a shock that draws danger)
];

/**
 * The base per-saga-tick probability that ANY shock fires, before era-medicine tempering. A saga tick is a
 * generational span (~25y at a succession), so this is the chance a generation lives through a disruption.
 * Tuned so the harsh founding eras see roughly one shock every ~3 generations; modern eras far fewer.
 */
const BASE_SHOCK_CHANCE = 0.33;

/**
 * Roll one seeded disruption shock for a saga tick. Macro-act-weighted (better medicine → lower hazard) and
 * deterministic for a given (family, year, macroActId, rng). `macroActId` is the saga's coarse band
 * (founding/convergence/emergence/ascension — what `macroActForYear` returns), NOT a fine era id; the saga
 * clock runs on macro-acts, so the hazard tempers off `macroActMedicine`. Returns `{ kind: "none" }` when
 * nothing fires, a family_death (the struck member id), or a meter_blow (meter + delta). Never strikes the
 * protagonist (their death is the existing age-based mortality's domain — this adds COLLATERAL loss + meter
 * shocks, the exogenous variability the audit found missing). Pure — applies no meter change itself.
 */
export function rollSagaShock(
  family: FamilyState | undefined,
  year: number,
  macroActId: string,
  rng: Rng,
): SagaShock {
  // Macro-act medicine (0.1 founding … 0.9 ascension) suppresses the shock chance — a founding-era line is
  // far more exposed than an interstellar one. `?? 0` via the lookup guards an unknown id (no NaN). Floor at
  // 15% of base so even the far future isn't fully safe.
  const exposure = Math.max(0.15, 1 - macroActMedicine(macroActId));
  const chance = BASE_SHOCK_CHANCE * exposure;
  if (!rng.fork(`shock:${year}`).chance(chance)) return { kind: "none" };

  // Which kind? A living non-protagonist member can be struck (family_death); otherwise (or by the coin) a
  // meter_blow. Bias slightly toward meter_blow so the family isn't decimated.
  const livingOthers =
    family?.members.filter((m) => m.id !== family.protagonistId && isMemberAlive(m, year)) ?? [];
  const kindRng = rng.fork(`shock:kind:${year}`);
  const wantDeath = livingOthers.length > 0 && kindRng.chance(0.4);

  if (wantDeath && family) {
    const victim = kindRng.fork("victim").pick(livingOthers);
    // The caller applies the death via applyFamilyDeathShock (keeps this roll pure of family mutation).
    return { kind: "family_death", memberId: victim.id, note: "plague" };
  }

  const blow = rng.fork(`shock:meter:${year}`).pick(METER_BLOWS);
  const delta = rng.fork(`shock:mag:${year}`).int(blow.min, blow.max);
  return { kind: "meter_blow", meter: blow.meter, delta, note: blow.note };
}

/** Apply a resolved family_death shock to a family (mark the struck member died). Pure. No-op otherwise. */
export function applyFamilyDeathShock(
  family: FamilyState,
  shock: SagaShock,
  year: number,
): FamilyState {
  if (shock.kind !== "family_death" || !shock.memberId) return family;
  return {
    ...family,
    members: family.members.map((m) =>
      m.id === shock.memberId && m.died === undefined ? { ...m, died: year } : m,
    ),
  };
}
