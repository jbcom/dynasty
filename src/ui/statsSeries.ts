import type { Content } from "../sim/content";
import { applyChoice } from "../sim/effects";
import { createRng } from "../sim/rng";
import type { MeterId } from "../sim/schema";
import { type GameState, initState } from "../sim/state";

export interface MeterSeries {
  /** In-world year for each sampled point. */
  years: number[];
  /** Value series per meter, aligned with `years`. */
  byMeter: Record<MeterId, number[]>;
}

/**
 * Reconstruct per-meter time series by replaying the run's history step by step.
 * Uses the same deterministic engine as a real playthrough, so the chart always
 * matches what actually happened. Pure — no DOM.
 */
export function buildMeterSeries(content: Content, state: GameState): MeterSeries {
  const meterIds = content.meters.map((m) => m.id);
  const byMeter = Object.fromEntries(meterIds.map((id) => [id, [] as number[]])) as Record<
    MeterId,
    number[]
  >;
  const years: number[] = [];

  let s = initState(content, state.seed);
  const rng = createRng(state.seed);

  const sample = (snap: GameState): void => {
    years.push(snap.year);
    for (const id of meterIds) byMeter[id].push(snap.meters[id]);
  };

  sample(s); // starting point
  for (const step of state.history) {
    const event = content.allEvents.find((e) => e.id === step.eventId);
    if (!event) continue;
    s = applyChoice(content, s, event, step.choiceId, rng).state;
    sample(s);
  }

  return { years, byMeter };
}
