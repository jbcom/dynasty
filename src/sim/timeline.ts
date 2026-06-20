import type { Content } from "./content";
import type { GameState } from "./state";
import { ageInYear } from "./state";

/**
 * Era progression + end-condition detection. The current era ends when its
 * event budget is spent OR no events remain eligible; the run ends on death
 * (health 0), coup (high heat + low loyalty), or victory (past the final era).
 */

/** Detect an end state from the current meters/era. Returns null if the run continues. */
export function detectEnd(content: Content, state: GameState): GameState["end"] {
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
  if (eraEventCount >= era.eventBudget) {
    eraIndex = state.eraIndex + 1;
    nextEraEventCount = 0;
    const nextEra = content.eras[eraIndex];
    if (nextEra) {
      year = nextEra.yearStart;
      // Reset the chronological floor to the new era's start so its earliest
      // events are eligible again.
      lastEventYear = nextEra.yearStart;
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

  return { ...advanced, end: detectEnd(content, advanced) };
}
