import type { Content } from "../content";
import { meetsRequires } from "../events";
import { applyDelta } from "../meters";
import { applyPersonality } from "../personality";
import type { Choice } from "../schema";
import { type GameState, type LedgerEntry, type PendingConsequence, withFlag } from "../state";
import { renderChain } from "./ledger";

/**
 * Delayed / compounding consequences (the causal spine, part H2). A choice that
 * activates a consequence's `cause` SCHEDULES it to land `delayYears` later; when
 * the in-world year reaches the due year, the effect applies (meters, personality,
 * flags) and logs a ledger entry — provided its `requires` still hold.
 */

/** Schedule any consequences this choice newly triggers. Returns new pending list. */
export function scheduleConsequences(
  content: Content,
  state: GameState,
  choice: Choice,
): PendingConsequence[] {
  if (content.consequences.length === 0) return state.pending;
  const newFlags = new Set(choice.setFlags);
  const positiveChannels = new Set(choice.ripples.filter((r) => r.polarity > 0).map((r) => r.to));
  const alreadyScheduled = new Set(state.pending.map((p) => p.consequenceId));

  const additions: PendingConsequence[] = [];
  for (const c of content.consequences) {
    const caused = newFlags.has(c.cause) || positiveChannels.has(c.cause);
    if (!caused) continue;
    if (!c.repeatable && alreadyScheduled.has(c.id)) continue;
    if (!c.repeatable && state.firedConsequences.includes(c.id)) continue;
    additions.push({ consequenceId: c.id, dueYear: state.year + c.delayYears });
  }
  return additions.length > 0 ? [...state.pending, ...additions] : state.pending;
}

export interface LandResult {
  state: GameState;
  newLedger: LedgerEntry[];
}

/**
 * Land every pending consequence whose due year has arrived (<= current year)
 * and whose requires still hold. Applies effects and appends ledger entries.
 * Pure — returns a new state. Call after the timeline advances.
 */
export function landDueConsequences(content: Content, state: GameState): LandResult {
  if (state.pending.length === 0) return { state, newLedger: [] };
  const byId = new Map(content.consequences.map((c) => [c.id, c]));

  let meters = state.meters;
  let personality = state.personality;
  let flags = state.flags;
  let firedConsequences = state.firedConsequences;
  const stillPending: PendingConsequence[] = [];
  const newLedger: LedgerEntry[] = [];
  let seq = state.ledger.length;

  for (const p of state.pending) {
    const c = byId.get(p.consequenceId);
    if (!c) continue; // unknown id — drop
    if (p.dueYear > state.year) {
      stillPending.push(p); // not due yet
      continue;
    }
    // Due. Gate on requires (evaluated against the just-advanced state).
    const gateState = { ...state, meters, personality, flags };
    if (c.requires && !meetsRequires(gateState, c.requires)) {
      // Condition lapsed — the consequence fizzles (dropped, not re-queued).
      continue;
    }
    meters = applyDelta(content.meters, meters, c.effects);
    personality = applyPersonality(personality, c.personality);
    for (const f of c.setFlags) flags = withFlag(flags, f);
    if (!c.repeatable) firedConsequences = [...firedConsequences, c.id];
    newLedger.push({
      seq: seq++,
      sourceChoice: c.cause,
      sourceEvent: c.id,
      year: state.year,
      ruleId: c.id,
      text: renderChain(c.chainTemplate, { cause: c.cause, effect: c.setFlags.join(", ") }),
    });
  }

  if (newLedger.length === 0 && stillPending.length === state.pending.length) {
    return { state, newLedger: [] };
  }

  return {
    state: {
      ...state,
      meters,
      personality,
      flags,
      firedConsequences,
      pending: stillPending,
      ledger: [...state.ledger, ...newLedger],
    },
    newLedger,
  };
}
