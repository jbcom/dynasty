import { branchOf } from "./branch";
import {
  applyRipples,
  buildLedgerEntries,
  landDueConsequences,
  scheduleConsequences,
} from "./butterfly";
import type { Content } from "./content";
import { meetsRequires, pickNextEvent } from "./events";
import { applyDelta } from "./meters";
import { applyPersonality } from "./personality";
import type { Rng } from "./rng";
import { resolveRoles } from "./roles";
import type { Choice, GameEvent } from "./schema";
import { type GameState, type LedgerEntry, withFlag, withoutFlag } from "./state";
import { systemicTick } from "./systemic";
import { advanceTimeline, applyJump, detectEnd } from "./timeline";
import { applyWorldFlags, timelinesForBranch } from "./worldtime";

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

  // 4b. Market operations (SIM1): a choice can take/adjust a market position so
  // the systemic tick actually moves the player's money (otherwise holding stays
  // 0 and markets are inert). set* overwrites, add* adjusts.
  let markets = state.markets;
  if (choice.marketOps && choice.marketOps.length > 0) {
    markets = { ...state.markets };
    for (const op of choice.marketOps) {
      const cur = markets[op.market];
      if (!cur) continue; // unknown market id — ignore (validated content won't hit this)
      let holding = cur.holding;
      if (op.setHolding !== undefined) holding = op.setHolding;
      if (op.addHolding !== undefined) holding += op.addHolding;
      let leverage = cur.leverage;
      if (op.setLeverage !== undefined) leverage = op.setLeverage;
      if (op.addLeverage !== undefined) leverage = Math.max(0, leverage + op.addLeverage);
      markets[op.market] = { ...cur, holding, leverage };
    }
  }

  const resolved: GameState = {
    ...state,
    meters,
    personality,
    flags,
    ripples,
    pending,
    markets,
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
  let advanced = advanceTimeline(content, hopped);

  // 8b. LINKING PROTOCOL: broadcast flags from the parallel world timelines whose
  // events have come to pass as the year advanced — done in the pure transition so
  // live play and deterministic replay stay identical. Only the ACTIVE BRANCH's
  // timeline variants apply (a Nazi run reads usa.nazi, not the default usa).
  if (content.worldTimelines.length > 0 && advanced.year > hopped.year) {
    const active = timelinesForBranch(content.worldTimelines, branchOf(advanced));
    advanced = applyWorldFlags(advanced, hopped.year, active);
  }

  // 8c. ROLE-SWAP INVARIANT: with all flags (the choice's, the consequences',
  // and the broadcast timelines') now settled for this year, resolve who holds
  // political power vs the commercial empire. Runs every step so a late flip
  // (e.g. Musk takes power) re-routes Donald to the commercial path before any
  // ending reads the role flags.
  advanced = resolveRoles(advanced);

  // 8d. SYSTEMIC TICK (SIM1): the living substrate breathes for each elapsed
  // in-world year — markets walk, currency redenominates, rank ladders drip into
  // the meters. Looped once per elapsed year so a multi-year hop compounds the
  // economy. Pure + seeded so replay reconstructs every index to the bit.
  if (content.markets.length > 0 || content.ranks.length > 0 || content.currencies.length > 0) {
    const years = Math.max(0, advanced.year - hopped.year);
    const steps = years > 0 ? years : 1; // at least one tick per choice
    for (let y = 0; y < steps; y++) {
      // Key off the POST-choice history length (advanced) — the same count the
      // inner per-market fork inside systemicTick sees — so the outer and inner
      // fork-key domains are harmonized (no split-key replay-stability hazard).
      const tickRng = rng.fork(`systemic:${hopped.year}:${y}:${advanced.history.length}`);
      const result = systemicTick(content, { ...advanced, year: hopped.year + y }, tickRng);
      advanced = { ...result.state, year: advanced.year };
      for (const f of result.flags) advanced = { ...advanced, flags: withFlag(advanced.flags, f) };
    }
  }

  // 9. Land any delayed consequences now due (post-advance year), unless the
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
  // Full gate (flags + notFlags + meters + personality + age) so autoPlaythrough
  // only picks choices reachable in live play — otherwise the divergence probe
  // and persona analytics produce unreachable states.
  return meetsRequires(state, choice.requires);
}
