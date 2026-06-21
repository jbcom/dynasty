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

/** A world event's effective branch: its own (CP-R-ARCH-2), else its file's, else default. */
function eventBranch(ev: WorldEvent, fileBranch: string | undefined): string {
  return ev.branch ?? fileBranch ?? "default";
}

/**
 * Select the active world-events per scope for the run's branch (AH3 / CP-R-ARCH-2).
 *
 * REPLACE semantics (unchanged behavior): a branch is a COMPLETE alternate history,
 * so when a scope has any event for the run's branch, that branch's events REPLACE
 * the scope's default (our-history) events; scopes with no branch events fall back to
 * default. This is the event-level form of the former file-level swap, so it stays
 * correct both after the branch-timeline collapse (one file per scope, events tagged
 * with `branch`) AND during the migration (separate `branch:"…"` variant files): an
 * event's effective branch is its own field, else its file's `branch`, else "default".
 * Per scope the result is one merged timeline carrying just the active world-state.
 */
export function timelinesForBranch(
  timelines: readonly WorldTimeline[],
  branch: BranchKey,
): WorldTimeline[] {
  // Group every event by scope, partitioned into this-branch vs default.
  const scopes = new Map<
    string,
    { branchEvents: WorldEvent[]; defaultEvents: WorldEvent[]; label: string }
  >();
  for (const t of timelines) {
    const entry = scopes.get(t.scope) ?? { branchEvents: [], defaultEvents: [], label: t.label };
    for (const e of t.events) {
      const eb = eventBranch(e, t.branch);
      if (eb === branch && branch !== "default") entry.branchEvents.push(e);
      else if (eb === "default") entry.defaultEvents.push(e);
      // events of OTHER branches are dropped for this run
    }
    scopes.set(t.scope, entry);
  }
  const out: WorldTimeline[] = [];
  for (const [scope, { branchEvents, defaultEvents, label }] of scopes) {
    // Branch events REPLACE the default for that scope (complete alternate history).
    const usingBranch = branchEvents.length > 0;
    const events = usingBranch ? branchEvents : defaultEvents;
    // Report which world-state this scope resolved to (the run's branch when its
    // events were selected, else our-history) so the compiled read-model stays
    // truthful even though the events are now merged from one file.
    out.push({
      scope: scope as WorldTimeline["scope"],
      label,
      branch: usingBranch ? branch : "default",
      events,
    });
  }
  return out;
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
