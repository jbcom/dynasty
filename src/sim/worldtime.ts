import type { BranchKey } from "./branch";
import { meetsRequires } from "./events";
import type { WorldEvent, WorldTimeline } from "./schema";
import type { GameState } from "./state";

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

/**
 * Select the active timeline variant per scope for the run's branch (AH3).
 * For each scope, a branch-specific variant (e.g. usa.nazi.json, branch:"nazi")
 * SUPPRESSES the default variant when that branch is active; scopes without a
 * branch variant fall back to their default. So a Nazi run reads usa.nazi +
 * world.nazi + the unchanged science/musk defaults, never the default usa.
 */
export function timelinesForBranch(
  timelines: readonly WorldTimeline[],
  branch: BranchKey,
): WorldTimeline[] {
  const byScope = new Map<string, WorldTimeline>();
  for (const t of timelines) {
    const tb = t.branch ?? "default";
    if (tb !== "default" && tb !== branch) continue; // a different branch's variant
    const existing = byScope.get(t.scope);
    // Prefer the branch-specific variant over the default for the same scope.
    if (!existing || (tb === branch && (existing.branch ?? "default") === "default")) {
      byScope.set(t.scope, t);
    }
  }
  return [...byScope.values()];
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
  // Evaluate each event's requires against the flags ACCUMULATED so far this
  // batch (not the frozen incoming state), so an earlier event that sets a flag
  // can exclude a later mutually-exclusive one (e.g. utopian_currents vs
  // autocratic_currents both due in 2045). Process in year order so the
  // exclusion is deterministic regardless of file/scope ordering.
  const due = timelines
    .flatMap((t) => t.events)
    .filter((e) => e.year > fromYear && e.year <= state.year)
    .sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
  for (const e of due) {
    if (e.requires && !meetsRequires({ ...state, flags: [...flags] }, e.requires)) continue;
    fired.push(e);
    for (const f of e.setFlags) flags.add(f);
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
  // dueWorldEvents already returns the complete, sorted, deduped flag set
  // (seeded from state.flags), so a single spread suffices.
  return { ...state, flags };
}
