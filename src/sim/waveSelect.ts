/**
 * WAVE SELECTION (Convergence Saga, SS-7).
 *
 * Onboarding is a 3-step funnel: pick TIME PERIOD → pick CLASS → (pick RACE/CULTURE when more
 * than one wave fits the cell). This module is the pure resolver behind that funnel: it groups
 * the immigration-WAVE places (places.json, kind:"wave") by period band × arrival class, and
 * turns a (period, class, place) selection into the founded wave. It also seeds a line's STARTING
 * MOTIVATORS + class rung from the wave's arrival class (the Wealth axis), which then seeds the
 * GOAP brain. Pure — no DOM, no randomness.
 */

import { initClassState } from "./classRung";
import { applyMotivators, initMotivators, type Motivators } from "./motivators";
import type { Place } from "./schema";

/** The arrival-class options a wave can land as (the Wealth-motivator starting tier). */
export type ArrivalClass = "poor" | "middle";

/** A period band the funnel groups waves into (by mid-vs-late 1800s arrival). */
export interface PeriodBand {
  id: string;
  title: string;
  /** Inclusive arrival-year range the band covers. */
  from: number;
  to: number;
}

/** The two period bands of the mid-to-late-1800s convergence window. */
export const PERIOD_BANDS: readonly PeriodBand[] = [
  { id: "mid_1800s", title: "The Hungry Decades (1840s–1860s)", from: 1840, to: 1869 },
  { id: "late_1800s", title: "The Great Wave (1870s–1900)", from: 1870, to: 1900 },
];

/** The period band a wave's arrival falls in (by the start of its arrivalYears). */
export function bandForWave(place: Place): PeriodBand | undefined {
  const start = place.arrivalYears?.[0];
  if (start === undefined) return undefined;
  return PERIOD_BANDS.find((b) => start >= b.from && start <= b.to);
}

/** All playable WAVE places (excludes destination grounds). */
export function wavePlaces(places: readonly Place[]): Place[] {
  return places.filter((p) => p.kind !== "destination" && p.arrivalYears !== undefined);
}

/** The waves available for a (period, class) cell — usually 1, sometimes several (→ race/culture pick). */
export function wavesForCell(
  places: readonly Place[],
  periodId: string,
  cls: ArrivalClass,
): Place[] {
  return wavePlaces(places).filter(
    (p) => bandForWave(p)?.id === periodId && p.arrivalClass === cls,
  );
}

/** The period bands that actually have at least one wave (so the funnel never offers an empty step). */
export function availablePeriods(places: readonly Place[]): PeriodBand[] {
  const waves = wavePlaces(places);
  return PERIOD_BANDS.filter((b) => waves.some((p) => bandForWave(p)?.id === b.id));
}

/** The arrival classes available within a period (so step 2 only offers real choices). */
export function classesForPeriod(places: readonly Place[], periodId: string): ArrivalClass[] {
  const classes = new Set<ArrivalClass>();
  for (const p of wavePlaces(places)) {
    if (bandForWave(p)?.id === periodId && p.arrivalClass) classes.add(p.arrivalClass);
  }
  return [...classes];
}

/**
 * Seed a founded line's STARTING MOTIVATORS from its wave's arrival class — the Wealth axis starts
 * low for a poor wave, mid for a middle wave (the rest centrist, to drift in play). This is the
 * first anchor the GOAP brain reads. Pure.
 */
export function seedMotivatorsForClass(cls: ArrivalClass): Motivators {
  const base = initMotivators();
  return applyMotivators(base, { wealth: cls === "poor" ? -60 : -10 });
}

/** The starting class rung for an arrival class (poor → rung 0, middle → rung 2). */
export function startRungForClass(cls: ArrivalClass): number {
  return cls === "poor" ? 0 : 2;
}

/**
 * The full founded starting context a wave selection resolves to (fed to the founding seam). The
 * PLAYER'S chosen arrival class wins when supplied (the onboarding offers poor/middle per cell); we
 * fall back to the place's intrinsic `arrivalClass`, then "poor". Without the override a player who
 * picks "a trade and a little money" would still be founded poor — the class choice must reach here.
 */
export function resolveWaveStart(
  place: Place,
  chosenClass?: ArrivalClass,
): {
  cls: ArrivalClass;
  motivators: Motivators;
  classState: ReturnType<typeof initClassState>;
} {
  const cls: ArrivalClass = chosenClass ?? place.arrivalClass ?? "poor";
  return {
    cls,
    motivators: seedMotivatorsForClass(cls),
    classState: initClassState(startRungForClass(cls)),
  };
}
