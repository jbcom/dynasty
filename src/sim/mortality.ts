import { memberById } from "./family";
import type { Rng } from "./rng";
import { type FamilyState, isMemberAlive, type LiveMember } from "./state";

/**
 * FD-9 — DEATH + AGING. A pure, seeded per-year mortality pass over the live
 * family. Each living member faces an annual death hazard rising with age,
 * lowered by the era's medicine and the member's vigor trait. Deaths are recorded
 * (died = year) but members are NOT removed (the tree is the full lineage). The
 * protagonist's death is flagged for the succession layer (FD-10) to resolve.
 * Pure + seeded → replay reconstructs every death to the bit.
 */

/**
 * Era-medicine factor: how much the era SUPPRESSES mortality (0 = pre-modern
 * baseline, higher = better medicine → lower hazard). Keyed by era id; absent eras
 * use 0. Deep-history + early-modern eras stay harsh; the modern/future eras ease.
 */
const ERA_MEDICINE: Record<string, number> = {
  caliphate: 0,
  origins: 0.1,
  boyhood: 0.25,
  mogul: 0.35,
  brand: 0.4,
  primetime: 0.45,
  ascent: 0.5,
  interregnum: 0.55,
  victory: 0.6,
  atomic: 0.7,
  unification: 0.8,
  redplanet: 0.85,
  firstcontact: 0.9,
  interstellar: 0.95,
};

/** The medicine factor for an era id (0 when unknown). */
export function eraMedicine(eraId: string): number {
  return ERA_MEDICINE[eraId] ?? 0;
}

/**
 * Annual death probability for a member at `age`, given the era-medicine factor
 * and the member's vigor (0..100). A Gompertz-style curve: negligible in youth,
 * rising steeply past ~55, capped at 1. Medicine and vigor both push the curve
 * later. Pure — no randomness here; the caller rolls against this probability.
 */
export function deathHazard(age: number, medicine: number, vigor: number): number {
  if (age < 0) return 0;
  // Base Gompertz: p = a * exp(b * age). Tuned so ~1% at 40, ~10% at 70, ~50% at ~92.
  const base = 0.00004 * Math.exp(0.0975 * age);
  // Medicine suppresses up to ~70%; vigor up to ~30% around the 50 midpoint.
  const medFactor = 1 - 0.7 * medicine;
  const vigorFactor = 1 - 0.3 * ((vigor - 50) / 50);
  const p = base * medFactor * vigorFactor;
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

/** The result of a mortality pass: the new family + who died this year. */
export interface MortalityResult {
  family: FamilyState;
  /** Member ids that died in this pass. */
  died: string[];
  /** True if the current protagonist died this pass (succession is due). */
  protagonistDied: boolean;
}

/**
 * Run one in-world year's mortality pass over all LIVING members. Deterministic
 * for a given (family, year, rng). Each living member is rolled independently via
 * a forked rng keyed by member id + year, so adding/removing members elsewhere
 * never shifts another member's roll (replay stability).
 */
export function applyMortality(
  family: FamilyState,
  year: number,
  eraId: string,
  rng: Rng,
): MortalityResult {
  const medicine = eraMedicine(eraId);
  const died: string[] = [];
  const members = family.members.map((m) => {
    if (m.died !== undefined) return m; // already dead
    const age = year - m.born;
    const hazard = deathHazard(age, medicine, m.traits.vigor);
    if (rng.fork(`death:${m.id}:${year}`).chance(hazard)) {
      died.push(m.id);
      return { ...m, died: year } satisfies LiveMember;
    }
    return m;
  });
  const protagonistDied = died.includes(family.protagonistId);
  return { family: { ...family, members }, died, protagonistDied };
}

/** Whether a member (by id) is alive as of `year`. */
export function isAlive(family: FamilyState, id: string, year: number): boolean {
  return isMemberAlive(memberById(family, id), year);
}
