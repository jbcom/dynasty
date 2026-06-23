import type { Content } from "./content";
import { evaluateEnding } from "./endings";
import { meetsRequires } from "./events";
import type { Choice } from "./schema";
import type { GameState } from "./state";
import { ageInYear } from "./state";

/**
 * Apply a choice's optional TIMELINE HOP (perceived/compressible timeline): jump
 * to a later era and/or skip in-world years. Forward-only — a hop that would move
 * backward (earlier era index or year) is ignored, preserving determinism and the
 * chronological floor. Returns a new state; if no jumpTo, returns the input.
 */
export function applyJump(content: Content, state: GameState, choice: Choice): GameState {
  const jump = choice.jumpTo;
  if (!jump) return state;

  let eraIndex = state.eraIndex;
  let year = state.year;

  if (jump.era) {
    const targetOrder = content.eras.findIndex((e) => e.id === jump.era);
    if (targetOrder > state.eraIndex) {
      const target = content.eras[targetOrder];
      if (target) {
        eraIndex = targetOrder;
        year = Math.max(year, target.yearStart);
      }
    }
  }
  if (jump.yearAdvance && jump.yearAdvance > 0) {
    year = year + jump.yearAdvance;
    // If the advanced year lands in a later era, move the era index forward too.
    for (let i = content.eras.length - 1; i > eraIndex; i--) {
      const e = content.eras[i];
      if (e && year >= e.yearStart) {
        eraIndex = i;
        break;
      }
    }
  }

  if (eraIndex === state.eraIndex && year === state.year) return state;
  return {
    ...state,
    eraIndex,
    year,
    age: ageInYear(year, state.birthYear),
    eraEventCount: eraIndex !== state.eraIndex ? 0 : state.eraEventCount,
    lastEventYear: Math.max(state.lastEventYear, year),
  };
}

/**
 * Era progression + end-condition detection. The current era ends when its
 * event budget is spent OR no events remain eligible. Endings are DATA-DRIVEN
 * (endings.json, evaluated by evaluateEnding); the built-in death/coup/victory
 * remain only as a fallback when no endings data is loaded.
 */

/** Detect an end state. Prefers data-driven endings; falls back to built-ins. */
export function detectEnd(content: Content, state: GameState): GameState["end"] {
  const dataEnd = evaluateEnding(content, state);
  if (dataEnd) return dataEnd;

  // Fallback (only when endings.json is empty — keeps the fixture engine tests
  // and any minimal content bundle playable).
  if (content.endings.length === 0) {
    if (state.meters.health <= 0) {
      return { kind: "death", year: state.year, reason: "Your heart gives out." };
    }
    if ((state.meters.heat ?? 0) >= 95 && (state.meters.loyalty ?? 100) <= 10) {
      return {
        kind: "coup",
        year: state.year,
        reason: "Investigations close in and your circle abandons you.",
      };
    }
    if (state.eraIndex >= content.eras.length) {
      return {
        kind: "victory",
        year: state.year,
        reason: "Immortal patriarch of a two-world civilization.",
      };
    }
  } else if (state.eraIndex >= content.eras.length) {
    // Past the final era but no data ending matched — guarantee a terminal state.
    return { kind: "victory", year: state.year, reason: "You reach the end of the road." };
  }
  return null;
}

/**
 * Advance the timeline after an event fires: bump the event count, step the
 * year toward the era's end, and roll over to the next era when the budget is
 * spent. Returns a new state (pure). Sets `end` if the final era is cleared.
 */
export function advanceTimeline(content: Content, state: GameState): GameState {
  const era = content.eras[state.eraIndex];
  if (!era) return state;

  const eraEventCount = state.eraEventCount + 1;
  const span = Math.max(1, era.yearEnd - era.yearStart);
  const step = Math.max(1, Math.round(span / era.eventBudget));
  let year = Math.min(era.yearEnd, state.year + step);

  let eraIndex = state.eraIndex;
  let nextEraEventCount = eraEventCount;

  let lastEventYear = state.lastEventYear;
  let gateBlocked = false;
  if (eraEventCount >= era.eventBudget) {
    const nextEra = content.eras[state.eraIndex + 1];
    // Era entry gate: the late eras (Mars, First Contact, Interstellar) require
    // an escalating scientific path. If the next era's entryRequires isn't met,
    // the run ENDS here instead of advancing — so a science-averse life ends on
    // Earth, a partial-science life ends on Mars, etc.
    if (nextEra?.entryRequires && !meetsRequires(state, nextEra.entryRequires)) {
      gateBlocked = true;
    } else {
      eraIndex = state.eraIndex + 1;
      nextEraEventCount = 0;
      if (nextEra) {
        year = nextEra.yearStart;
        lastEventYear = nextEra.yearStart;
      }
    }
  }

  const advanced: GameState = {
    ...state,
    eraIndex,
    eraEventCount: nextEraEventCount,
    year,
    age: ageInYear(year, state.birthYear),
    lastEventYear,
  };

  // NOTE: these detectEnd calls run BEFORE applyChoice's step-8b world-flag
  // broadcast and step-8c resolveRoles, so they do not see role flags derived
  // from a flip that happens on THIS step. That is fine: applyChoice re-checks
  // detectEnd after resolveRoles (its postEnd check), which is where role-
  // dependent endings (end_role_flip_tycoon, end_reich_industrialist) fire.
  // Don't rely on the calls here for role-gated endings.

  // A blocked gate forces a terminal evaluation at the current era. The run
  // CANNOT advance past the gate, so it MUST end here — if no authored ending
  // qualifies (e.g. a moderate-stats life that backed neither science nor a
  // role-flip), fall back to a generic terminal end rather than freeze with no
  // event and no end screen. (endings.json also carries end_earthbound_twilight
  // as the data-level catch-all; this is the engine-level backstop.)
  if (gateBlocked) {
    const gateEnd = detectEnd(content, { ...advanced, eraIndex: content.eras.length });
    return {
      ...advanced,
      end: gateEnd ?? {
        kind: "twilight",
        year: advanced.year,
        reason: "The path forward closed, and the story came to rest where it was.",
      },
    };
  }

  return { ...advanced, end: detectEnd(content, advanced) };
}

/** Years the saga clock advances per scene — kept only for back-compat callers that pass no step.
 *  In-world span is no longer metered per scene (that coupled aging to scene COUNT); see
 *  `SAGA_GENERATION_SPAN` and `advanceSagaClock(state, years)`. */
export const SAGA_YEAR_STEP = 1;

/**
 * The in-world span a single GENERATION occupies. A generation's arc is driven by its ~3 DECISIONS,
 * not by how many decisionless texture beats surround them — so a generation's worth of years is
 * advanced ONCE, at the generation's succession decision, not metered out per scene. This decouples
 * the line's aging (and thus the death→succession that steps `generation`) from the scene COUNT, so
 * deepening an act with interstitial texture beats no longer ages the line faster. ~25y ≈ the span
 * from one protagonist's majority to their heir's, the classic demographic generation length.
 */
export const SAGA_GENERATION_SPAN = 25;

/**
 * Advance the clock for the SAGA (novel) path by an explicit number of in-world `years`, decoupled
 * from the era budget/rollover that drives the event path. The era ladder is calibrated for the 1885
 * waves; a non-1885 origin (baghdad founds 762 CE) would have its line aged to death by the era's
 * yearEnd cap + the jump to a 1885-based next era. The novel is generational, not era-budget-driven,
 * so it just ticks years forward (clamped to a sane ceiling) and lets advanceFamily age the line over
 * that span. Passing `years = 0` (a decisionless texture beat) holds the clock — texture adds no time,
 * so span scales with decisions, not scene count. Era index is left untouched (the saga doesn't roll
 * eras); ageInYear keeps age in sync. Pure.
 */
export function advanceSagaClock(state: GameState, years: number = SAGA_YEAR_STEP): GameState {
  const delta = Math.max(0, Math.trunc(years));
  if (delta === 0) return state;
  const year = Math.min(state.year + delta, 99999);
  return { ...state, year, age: ageInYear(year, state.birthYear) };
}
