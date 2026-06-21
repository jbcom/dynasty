/**
 * READ MODEL (Convergence Saga, SS-13) — the pure UI-facing projection of a line's state.
 *
 * The UI (SS-14) renders the saga as a novel: which macro-act + chapter you're in, the line's
 * motivator character, its class rung, and glimpses of the other lines. This module is the single
 * pure selector that derives that view from a GameState (+ the optional rung/world the cut-over
 * wires in), so the UI never reaches into sim internals. No DOM, no randomness.
 */

import type { Rung } from "./classRung";
import { rungName } from "./classRung";
import type { Glimpse } from "./dynastyWorld";
import { type MacroAct, macroActForYear, macroActTitle } from "./macroActs";
import { axisLabel, dominantMotivator, MOTIVATOR_AXES, type Motivators } from "./motivators";

/** A single motivator axis projected for the UI: its key, current value, and a readable label. */
export interface MotivatorView {
  axis: string;
  value: number;
  label: string;
}

/** The full UI projection of a line at a moment. */
export interface SagaView {
  year: number;
  macroAct: MacroAct;
  macroActTitle: string;
  /** The motivators, each with a readable lean label. */
  motivators: MotivatorView[];
  /** The dominant motivator pole — the line's defining character + the ending coloring. */
  dominant: { axis: string; pole: string; value: number };
  /** The class rung name (poor…upper), when the rung is known. */
  rung: Rung | null;
  /** Glimpses of other lines surfacing now (opposing/contributing/neutral). */
  glimpses: Glimpse[];
}

/** Inputs the read-model needs beyond the motivators + year (wired by the cut-over). */
export interface SagaViewInput {
  year: number;
  motivators: Motivators;
  rung?: number;
  glimpses?: Glimpse[];
}

/** Project a line's state into the SagaView the UI renders. Pure. */
export function projectSaga(input: SagaViewInput): SagaView {
  const dom = dominantMotivator(input.motivators);
  return {
    year: input.year,
    macroAct: macroActForYear(input.year),
    macroActTitle: macroActTitle(macroActForYear(input.year)),
    motivators: MOTIVATOR_AXES.map((axis) => ({
      axis,
      value: input.motivators[axis],
      label: axisLabel(input.motivators, axis),
    })),
    dominant: { axis: dom.axis, pole: dom.pole, value: dom.value },
    rung: input.rung === undefined ? null : rungName(input.rung),
    glimpses: input.glimpses ?? [],
  };
}
