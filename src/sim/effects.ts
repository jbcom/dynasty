import { branchOf } from "./branch";
import {
  applyRipples,
  buildLedgerEntries,
  landDueConsequences,
  scheduleConsequences,
} from "./butterfly";
import { applyCallingDrift, callingById } from "./callings";
import type { Content } from "./content";
import { meetsRequires, pickNextEvent } from "./events";
import { beget, kinFor, takePartner } from "./family";
import { applyDelta } from "./meters";
import { applyMortality } from "./mortality";
import { applyPersonality } from "./personality";
import type { Rng } from "./rng";
import type { Choice, GameEvent } from "./schema";
import type { Archetype } from "./slots";
import { type GameState, type LedgerEntry, withFlag, withoutFlag } from "./state";
import { succeed } from "./succession";
import { systemicTick } from "./systemic";
import { advanceTimeline, applyJump, detectEnd } from "./timeline";
import { applyWorldFlags, timelinesForBranch } from "./worldtime";

/** Result of resolving a choice: the new state plus the ledger entries it produced. */
export interface Transition {
  state: GameState;
  newLedger: LedgerEntry[];
}

/** Birth year for the i-th child begotten by one choice (staggered by 2y each). */
function begetYear(eventYear: number, index: number): number {
  return eventYear + index * 2;
}

/**
 * PER-GENERATION LIFE-STAGE FLAGS (EX-5). These mark a single protagonist's own
 * life arc — taking a partner and raising the next generation — and MUST reset on
 * succession so the new protagonist re-runs their own partner→beget beats (the
 * repeatable epoch0 `ev_cp_take_partner` / `ev_cp_raise_heirs`). Without this reset
 * the line begets exactly once and goes extinct within a generation. The birth /
 * gender / naming / calling flags are NOT here: those are the FOUNDING emergence,
 * one-shot for the line, and the heir is already born + named + carries the calling.
 */
const LIFE_STAGE_FLAGS = [
  "partnered",
  "married_up",
  "married_for_love",
  "married_shrewd",
  "raised_heirs",
  "groomed_heir",
  "large_brood",
] as const;

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
  // LIFE-STAGE beats (partner/heirs succession) fire at a life-moment regardless of era, so their
  // authored year (written for the new-york/origins line, e.g. ev_cp_take_partner=1908,
  // ev_cp_raise_heirs=1912) must not stamp a later generation's events — and crucially not
  // begetYear() — with an ancient year. A child begotten "now" must be born in the CURRENT in-world
  // year; otherwise each new generation is minted decades in the past, ages out instantly, and the
  // line goes extinct within a generation. (NA-11: the retired `epoch0` tag formerly did this; the
  // surviving succession beats are tagged `life-stage`.) Preserves linear time for any origin.
  if (event.tags.includes("life-stage") && event.year !== state.year) {
    event = { ...event, year: state.year };
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

  let family = state.family;

  // 4b2. TAKE PARTNER (CP-5): the Epoch-0 "find a partner" beat. Adds a married-in
  // in-law whose traits blend into subsequent begets. No-op without a founded
  // family or if a partner already exists.
  if (choice.takesPartner && family && state.founding && !family.partnerId) {
    const culture = content.onomastics[state.founding.culture];
    if (culture) {
      family = takePartner(
        family,
        event.year,
        culture,
        rng.fork(`partner:${event.id}:${choiceId}:${state.history.length}`),
      ).family;
    }
  }

  // 4c. BEGET (FD-8): a choice can add children to the live family tree, born to
  // the current protagonist in the event's year, named by the founding culture's
  // convention with inherited+varied traits. The founding CALLING (CP-2) drifts
  // each child's traits toward the line's calling. No-op without a founded family.
  if (choice.begets && choice.begets > 0 && family && state.founding) {
    const culture = content.onomastics[state.founding.culture];
    if (culture) {
      const calling = callingById(content.callings, state.founding.calling);
      const parentId = family.protagonistId;
      for (let i = 0; i < choice.begets; i++) {
        const born = begetYear(event.year, i);
        const begotten = beget(
          family,
          parentId,
          born,
          culture,
          kinFor(family, parentId),
          rng.fork(`beget:${event.id}:${choiceId}:${state.history.length}:${i}`),
        );
        // Apply the calling's generational trait drift to the new child.
        const child = begotten.child;
        const drifted = applyCallingDrift(child.traits, calling);
        family = {
          ...begotten.family,
          members: begotten.family.members.map((m) =>
            m.id === child.id ? { ...m, traits: drifted } : m,
          ),
        };
      }
    }
  }

  // World-events (FD-2.3) are AMBIENT BACKDROP: clock- and budget-neutral. They do
  // not advance the protagonist's time floor (a future-window backdrop must not
  // push lastEventYear past the era, which the era rollover would then reset
  // backward) nor consume the era budget — the family's life beats drive the clock.
  const isWorldEvent = event.era === "__world__";

  // SET CALLING (CP-R6): a diegetic calling beat writes the founded line's calling
  // into its founding metadata, so it drifts every future beget (CP-2). No-op
  // without a founded line or if the calling id is unknown.
  const founding =
    choice.setsCalling && state.founding && callingById(content.callings, choice.setsCalling)
      ? { ...state.founding, calling: choice.setsCalling }
      : state.founding;

  // SET ARCHETYPE (OB-4): the emergent Epoch-0 calling arc crystallizes into a power base.
  // Commit it on the run + swap the `archetype:<id>` flag content gates on (drop the old one,
  // add the new), and reflect it in the founding metadata so a save reconstructs it.
  let archetype = state.archetype;
  if (choice.setsArchetype && choice.setsArchetype !== state.archetype) {
    flags = withoutFlag(flags, `archetype:${state.archetype}`);
    flags = withFlag(flags, `archetype:${choice.setsArchetype}`);
    archetype = choice.setsArchetype;
  }

  const resolved: GameState = {
    ...state,
    meters,
    personality,
    flags,
    ripples,
    pending,
    markets,
    family,
    archetype,
    founding: choice.setsArchetype && founding ? { ...founding, archetype } : founding,
    ledger: [...state.ledger, ...newLedger],
    history: [...state.history, { eventId: event.id, choiceId, year: event.year }],
    firedEvents,
    // Time floor advances to a protagonist beat's year (never backward); a world
    // event leaves the floor where the family's own arc has reached.
    lastEventYear: isWorldEvent ? state.lastEventYear : Math.max(state.lastEventYear, event.year),
  };

  // 7. Optional TIMELINE HOP — a choice can compress the arc forward (perceived,
  // not hardcoded, timeline). Applied before the normal one-step advance.
  const hopped = applyJump(content, resolved, choice);

  // 8. Immediate end check (e.g. a choice that drops health to 0), else advance.
  const immediateEnd = detectEnd(content, hopped);
  if (immediateEnd) {
    return { state: { ...hopped, end: immediateEnd }, newLedger };
  }
  // World-events are budget-neutral (see isWorldEvent above): they do NOT advance
  // the era clock/budget, so the family's ~12-16 life beats per era stay the spine.
  let advanced = isWorldEvent ? hopped : advanceTimeline(content, hopped);

  // 8b. LINKING PROTOCOL: broadcast flags from the parallel world timelines whose
  // events have come to pass as the year advanced — done in the pure transition so
  // live play and deterministic replay stay identical. Only the ACTIVE BRANCH's
  // timeline variants apply (a Nazi run reads usa.nazi, not the default usa).
  if (content.worldTimelines.length > 0 && advanced.year > hopped.year) {
    const active = timelinesForBranch(content.worldTimelines, branchOf(advanced));
    advanced = applyWorldFlags(advanced, hopped.year, active);
  }

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

  // 8e. MORTALITY + SUCCESSION (FD-9/FD-10): for each elapsed in-world year, the
  // live family faces a seeded death pass; when the protagonist dies the line
  // passes to the eldest living heir (estate-planning may name another via the
  // `heir_<id>` flag), continuing the run AS the heir — or ends it if the line is
  // extinct. Pure + seeded so replay reconstructs every death + handoff.
  if (advanced.family) {
    const years = Math.max(0, advanced.year - hopped.year);
    const steps = years > 0 ? years : 1;
    for (let y = 0; y < steps && !advanced.end; y++) {
      const currentFamily = advanced.family;
      if (!currentFamily) break;
      const passYear = hopped.year + y;
      const mort = applyMortality(
        currentFamily,
        passYear,
        content.eras[advanced.eraIndex]?.id ?? "",
        rng.fork(`mortality:${passYear}:${advanced.history.length}`),
      );
      let fam = mort.family;
      if (mort.protagonistDied) {
        const namedHeir = advanced.flags.find((f) => f.startsWith("heir_"))?.slice("heir_".length);
        const succ = succeed(fam, passYear, namedHeir, advanced.founding?.successionMode);
        if (succ.heirId === null) {
          // The line is extinct — end the run with a dynastic-extinction ending.
          advanced = {
            ...advanced,
            family: succ.family,
            end: { kind: "line-extinct", year: passYear, reason: "The line died out." },
          };
          break;
        }
        fam = succ.family;
        // Continue AS the heir: re-anchor birthYear/age + flag the succession.
        const heir = fam.members.find((m) => m.id === succ.heirId);
        const heirBorn = heir?.born ?? advanced.birthYear;
        // Reset the per-generation life-stage flags so the heir runs their OWN
        // partner→beget arc (EX-5 — else the line begets once and dies out). The
        // founding emergence flags (emerged/named/calling_chosen) persist; the heir
        // is already a born, named member of the line.
        const lifeStageSet = new Set<string>(LIFE_STAGE_FLAGS);
        const heirFlags = advanced.flags.filter((f) => !lifeStageSet.has(f));
        advanced = {
          ...advanced,
          family: fam,
          birthYear: heirBorn,
          // Clamp to 0: succeed() only returns an already-born heir, but guard
          // against a negative age if that invariant ever changes.
          age: Math.max(0, passYear - heirBorn),
          flags: withFlag(heirFlags, "succession_occurred"),
        };
      } else {
        advanced = { ...advanced, family: fam };
      }
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
  initState: (content: Content, seed: string, archetype?: Archetype) => GameState,
  createRng: (seed: string) => Rng,
  archetype: Archetype = "economic",
): GameState {
  const base = initState(content, seed, archetype);
  return replayFromState(content, base, history, createRng);
}

/**
 * Replay a history from an ALREADY-CONSTRUCTED base state (e.g. a founded line's
 * initial state from foundDynasty, which initState cannot produce). Same
 * determinism guarantee: the rng is seeded from base.seed so the reconstruction
 * is bit-identical to live play.
 */
export function replayFromState(
  content: Content,
  base: GameState,
  history: ReadonlyArray<{ eventId: string; choiceId: string }>,
  createRng: (seed: string) => Rng,
): GameState {
  let state = base;
  const rng = createRng(base.seed);
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
  initState: (content: Content, seed: string, archetype?: Archetype) => GameState,
  createRng: (seed: string) => Rng,
  maxSteps = 500,
  archetype: Archetype = "economic",
): GameState {
  let state = initState(content, seed, archetype);
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
