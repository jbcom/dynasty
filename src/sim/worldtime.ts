import { meetsRequires } from "./events";
import type { WorldEvent, WorldTimeline } from "./schema";
import { type GameState, withFlag } from "./state";

/**
 * The four parallel world-timelines (Manhattan / East Coast / USA / World) and
 * the LINKING PROTOCOL that couples them to Donald's arc:
 *  - news(): the headlines for a year, drawn from all four scopes (the news HUD).
 *  - broadcastWorldFlags(): when the in-world year advances, world events whose
 *    year has arrived (and whose requires hold) broadcast their flags into the
 *    shared game state — so the wider world causally gates his events.
 * Pure data + pure functions; deterministic.
 */

export interface NewsItem {
  scope: WorldTimeline["scope"];
  year: number;
  headline: string;
  body: string;
}

/** Headlines from all timelines at or just before `year` (most recent first). */
export function newsForYear(
  timelines: readonly WorldTimeline[],
  year: number,
  perScope = 1,
): NewsItem[] {
  const items: NewsItem[] = [];
  for (const t of timelines) {
    const due = t.events
      .filter((e) => e.year <= year)
      .sort((a, b) => b.year - a.year)
      .slice(0, perScope);
    for (const e of due) {
      items.push({ scope: t.scope, year: e.year, headline: e.headline, body: e.body });
    }
  }
  return items.sort((a, b) => b.year - a.year);
}

/**
 * Broadcast flags from world events whose year is now reached (>= a previous
 * floor, <= current year) and whose requires hold. Returns the flags to add and
 * the events that fired (for the ledger / news ticker). Pure.
 */
export function dueWorldEvents(
  timelines: readonly WorldTimeline[],
  state: GameState,
  fromYear: number,
): { flags: string[]; fired: WorldEvent[] } {
  const flags = new Set(state.flags);
  const fired: WorldEvent[] = [];
  for (const t of timelines) {
    for (const e of t.events) {
      if (e.year <= fromYear || e.year > state.year) continue;
      if (e.requires && !meetsRequires(state, e.requires)) continue;
      fired.push(e);
      for (const f of e.setFlags) flags.add(f);
    }
  }
  return { flags: [...flags].sort(), fired };
}

/** Apply due world-event flags to a state (pure). */
export function applyWorldFlags(
  state: GameState,
  fromYear: number,
  timelines: readonly WorldTimeline[],
): GameState {
  const { flags, fired } = dueWorldEvents(timelines, state, fromYear);
  if (fired.length === 0) return state;
  let next = { ...state, flags: state.flags };
  for (const f of flags) next = { ...next, flags: withFlag(next.flags, f) };
  return next;
}
