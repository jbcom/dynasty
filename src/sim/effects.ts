import { applyRipples, buildLedgerEntries } from "./butterfly";
import type { Content } from "./content";
import { pickNextEvent } from "./events";
import { applyDelta } from "./meters";
import type { Rng } from "./rng";
import type { Choice, GameEvent } from "./schema";
import { type GameState, type LedgerEntry, withFlag, withoutFlag } from "./state";
import { advanceTimeline, detectEnd } from "./timeline";

/** Result of resolving a choice: the new state plus the ledger entries it produced. */
export interface Transition {
  state: GameState;
  newLedger: LedgerEntry[];
}

function findChoice(event: GameEvent, choiceId: string): Choice {
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) {
    throw new Error(`Event "${event.id}" has no choice "${choiceId}"`);
  }
  return choice;
}

/**
 * The core pure transition: resolve a choice on a given event.
 *  effects → meters · flags → set/clear · ripples → chaos field · rules → ledger
 *  then record history, mark the event fired, and advance the timeline.
 *
 * Deterministic: same (content, state, event, choiceId, rng-seed) → same result.
 */
export function applyChoice(
  content: Content,
  state: GameState,
  event: GameEvent,
  choiceId: string,
  rng: Rng,
): Transition {
  if (state.end) {
    throw new Error("Cannot apply a choice to a finished run");
  }
  const choice = findChoice(event, choiceId);

  // 1. Meters.
  const meters = applyDelta(content.meters, state.meters, choice.effects);

  // 2. Flags.
  let flags = [...state.flags];
  for (const f of choice.setFlags) flags = withFlag(flags, f);
  for (const f of choice.clearFlags) flags = withoutFlag(flags, f);

  // 3. Chaos ripples (seeded).
  const ripples = applyRipples(state.ripples, choice.ripples, rng.fork(`${event.id}:${choice.id}`));

  // 4. Visible ledger chains.
  const newLedger = buildLedgerEntries(content, event, choice, ripples, state.ledger.length);

  // 5. Record history + fired event.
  const firedEvents = event.repeatable ? state.firedEvents : [...state.firedEvents, event.id];

  const resolved: GameState = {
    ...state,
    meters,
    flags,
    ripples,
    ledger: [...state.ledger, ...newLedger],
    history: [...state.history, { eventId: event.id, choiceId, year: event.year }],
    firedEvents,
  };

  // 6. Immediate end check (e.g. a choice that drops health to 0), else advance.
  const immediateEnd = detectEnd(content, resolved);
  const advanced = immediateEnd
    ? { ...resolved, end: immediateEnd }
    : advanceTimeline(content, resolved);

  return { state: advanced, newLedger };
}

/**
 * Replay a full history from a seed to reconstruct the exact end state. This is
 * what makes saves tiny (seed + choice list) and butterfly chains verifiable.
 */
export function replay(
  content: Content,
  seed: string,
  history: ReadonlyArray<{ eventId: string; choiceId: string }>,
  initState: (content: Content, seed: string) => GameState,
  createRng: (seed: string) => Rng,
): GameState {
  let state = initState(content, seed);
  const rng = createRng(seed);
  for (const step of history) {
    const event = content.allEvents.find((e) => e.id === step.eventId);
    if (!event) throw new Error(`replay: unknown event "${step.eventId}"`);
    state = applyChoice(content, state, event, step.choiceId, rng).state;
  }
  return state;
}

/**
 * Drive a full autonomous playthrough from a seed by always taking the first
 * eligible choice of each picked event. Used by tests and as a baseline AI.
 * Terminates on an end state or when no event is eligible anywhere.
 */
export function autoPlaythrough(
  content: Content,
  seed: string,
  initState: (content: Content, seed: string) => GameState,
  createRng: (seed: string) => Rng,
  maxSteps = 500,
): GameState {
  let state = initState(content, seed);
  const rng = createRng(seed);
  for (let i = 0; i < maxSteps && !state.end; i++) {
    const event = pickNextEvent(content, state, rng.fork(`pick:${i}`));
    if (!event) {
      // Era exhausted; force-advance the timeline to move forward / end the run.
      const advanced = advanceTimeline(content, {
        ...state,
        eraEventCount: Number.MAX_SAFE_INTEGER,
      });
      if (advanced.eraIndex === state.eraIndex && !advanced.end) break;
      state = advanced;
      continue;
    }
    const choice = event.choices.find((c) => !c.requires || eligibleChoice(state, c));
    if (!choice) break;
    state = applyChoice(content, state, event, choice.id, rng).state;
  }
  return state;
}

function eligibleChoice(state: GameState, choice: Choice): boolean {
  if (!choice.requires) return true;
  // Lightweight reuse of meetsRequires semantics without a cycle: flags only here.
  return (
    choice.requires.flags.every((f) => state.flags.includes(f)) &&
    choice.requires.notFlags.every((f) => !state.flags.includes(f))
  );
}
