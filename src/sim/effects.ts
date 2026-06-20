import {
  applyRipples,
  buildLedgerEntries,
  landDueConsequences,
  scheduleConsequences,
} from "./butterfly";
import type { Content } from "./content";
import { pickNextEvent } from "./events";
import { applyDelta } from "./meters";
import { applyPersonality } from "./personality";
import type { Rng } from "./rng";
import type { Choice, GameEvent } from "./schema";
import { type GameState, type LedgerEntry, withFlag, withoutFlag } from "./state";
import { advanceTimeline, applyJump, detectEnd } from "./timeline";

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

  // 1b. Personality vector.
  const personality = applyPersonality(state.personality, choice.personality);

  // 2. Flags.
  let flags = [...state.flags];
  for (const f of choice.setFlags) flags = withFlag(flags, f);
  for (const f of choice.clearFlags) flags = withoutFlag(flags, f);

  // 3. Chaos ripples (seeded). The fork label includes history length so a
  // repeatable event firing twice gets distinct jitter per occurrence, while
  // staying deterministic under replay (which applies choices in the same order).
  const ripples = applyRipples(
    state.ripples,
    choice.ripples,
    rng.fork(`${event.id}:${choice.id}:${state.history.length}`),
  );

  // 4. Visible ledger chains (deduped against the existing ledger).
  const newLedger = buildLedgerEntries(content, event, choice, ripples, state.ledger);

  // 5. Record history + fired event.
  const firedEvents = event.repeatable ? state.firedEvents : [...state.firedEvents, event.id];

  // 6. Schedule any delayed consequences this choice triggers.
  const pending = scheduleConsequences(content, { ...state, year: event.year }, choice);

  const resolved: GameState = {
    ...state,
    meters,
    personality,
    flags,
    ripples,
    pending,
    ledger: [...state.ledger, ...newLedger],
    history: [...state.history, { eventId: event.id, choiceId, year: event.year }],
    firedEvents,
    // Time floor advances to this event's year (never moves backward).
    lastEventYear: Math.max(state.lastEventYear, event.year),
  };

  // 7. Optional TIMELINE HOP — a choice can compress the arc forward (perceived,
  // not hardcoded, timeline). Applied before the normal one-step advance.
  const hopped = applyJump(content, resolved, choice);

  // 8. Immediate end check (e.g. a choice that drops health to 0), else advance.
  const immediateEnd = detectEnd(content, hopped);
  if (immediateEnd) {
    return { state: { ...hopped, end: immediateEnd }, newLedger };
  }
  const advanced = advanceTimeline(content, hopped);

  // 8. Land any delayed consequences now due (post-advance year), unless the
  // timeline advance itself ended the run.
  if (advanced.end) {
    return { state: advanced, newLedger };
  }
  const landed = landDueConsequences(content, advanced);
  // Re-check end conditions in case a consequence (e.g. a debt bomb) was lethal.
  const postEnd = detectEnd(content, landed.state);
  const finalState = postEnd ? { ...landed.state, end: postEnd } : landed.state;

  return { state: finalState, newLedger: [...newLedger, ...landed.newLedger] };
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
 * Drive a full autonomous playthrough from a seed by taking a SEEDED eligible
 * choice at each picked event (so different seeds explore different branches —
 * a baseline random-AI / divergence probe). Deterministic per seed. Terminates
 * on an end state or when no event is eligible anywhere.
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
    const eligible = event.choices.filter((c) => !c.requires || eligibleChoice(state, c));
    if (eligible.length === 0) break;
    const choice = rng.fork(`choose:${i}`).pick(eligible);
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
