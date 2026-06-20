import type { Content } from "./content";
import { evaluateEnding } from "./endings";
import { meetsRequires } from "./events";
import type { GameState } from "./state";
import { ageInYear } from "./state";

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

  // A blocked gate forces a terminal evaluation at the current era.
  if (gateBlocked) {
    const gateEnd = detectEnd(content, { ...advanced, eraIndex: content.eras.length });
    if (gateEnd) return { ...advanced, end: gateEnd };
  }

  return { ...advanced, end: detectEnd(content, advanced) };
}
