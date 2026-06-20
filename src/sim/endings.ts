import type { Content } from "./content";
import { evalComparator } from "./events";
import { moralPoleOf } from "./moralAxis";
import type { PersonalityAxis } from "./personality";
import type { Ending, MeterId } from "./schema";
import type { EndState, GameState } from "./state";

/**
 * Data-driven ending evaluation. The run ends with the highest-priority ending
 * whose `when` conditions all hold. Pure — no DOM, no randomness. This replaces
 * the hardcoded death/coup/victory checks (those remain as authored fallback
 * endings in endings.json).
 */

function endingQualifies(content: Content, state: GameState, ending: Ending): boolean {
  const w = ending.when;
  const era = content.eras[state.eraIndex];
  const order = era?.order ?? state.eraIndex;

  if (w.minEraOrder !== undefined && order < w.minEraOrder) return false;
  if (w.maxEraOrder !== undefined && order > w.maxEraOrder) return false;
  if (w.minAge !== undefined && state.age < w.minAge) return false;

  // Moral-pole gate (DE-2). TWO DISTINCT mechanisms exist for pole-gating an
  // ending; do not confuse them (rev-de2 #1):
  //   • when.flags: ["reich_utopian_pole"] — the CANONICAL mechanism every shipped
  //     pole ending uses. Gates on an explicit authored pole flag the branch sets.
  //   • when.pole: "utopian" — this optional gate, which resolves the pole through
  //     moralPoleOf(state) (pole-flags first, PERSONALITY fallback). Use only when
  //     you deliberately want the personality-derived pole, NOT flag presence; the
  //     two can diverge (a run with no pole flag still resolves a pole by axis).
  // Both may be combined on one ending. Production endings use flags; this gate is
  // here for personality-driven pole endings + is exercised by pole-coverage tests.
  if (w.pole !== undefined && moralPoleOf(state) !== w.pole) return false;

  for (const f of w.flags) if (!state.flags.includes(f)) return false;
  for (const f of w.notFlags) if (state.flags.includes(f)) return false;

  for (const [id, expr] of Object.entries(w.meters) as [MeterId, string][]) {
    const v = state.meters[id];
    if (v === undefined || !evalComparator(expr, v)) return false;
  }
  for (const [axis, expr] of Object.entries(w.personality) as [PersonalityAxis, string][]) {
    const v = state.personality[axis];
    if (v === undefined || !evalComparator(expr, v)) return false;
  }
  return true;
}

/**
 * The ending that fires for this state, or null if the run continues. When
 * several qualify, the highest `priority` wins (ties broken by array order).
 */
export function evaluateEnding(content: Content, state: GameState): EndState | null {
  let best: Ending | null = null;
  for (const ending of content.endings) {
    if (!endingQualifies(content, state, ending)) continue;
    if (best === null || ending.priority > best.priority) best = ending;
  }
  if (!best) return null;
  return {
    kind: best.kind as EndState["kind"],
    year: state.year,
    reason: best.reason,
    endingId: best.id,
  };
}
