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
    age: ageInYear(year),
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
    age: ageInYear(year),
    lastEventYear,
  };

  // NOTE: these detectEnd calls run BEFORE applyChoice's step-8b world-flag
  // broadcast and step-8c resolveRoles, so they do not see role flags derived
  // from a flip that happens on THIS step. That is fine: applyChoice re-checks
  // detectEnd after resolveRoles (its postEnd check), which is where role-
  // dependent endings (end_role_flip_tycoon, end_reich_industrialist) fire.
  // Don't rely on the calls here for role-gated endings.

  // A blocked gate forces a terminal evaluation at the current era.
  if (gateBlocked) {
    const gateEnd = detectEnd(content, { ...advanced, eraIndex: content.eras.length });
    if (gateEnd) return { ...advanced, end: gateEnd };
  }

  return { ...advanced, end: detectEnd(content, advanced) };
}
