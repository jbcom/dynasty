import { type BranchKey, branchOf } from "./branch";
import type { Content } from "./content";
import type { Rng } from "./rng";
import type { Currency, Slot, WorldTimeline } from "./schema";
import { type DynastyKey, resolveSlots } from "./slots";
import { DYNASTY_START, type GameState, initState } from "./state";
import { resolveCurrency } from "./systemic";
import { resolveFullName, resolveGivenName } from "./terms";
import { timelinesForBranch } from "./worldtime";

/**
 * TIMELINE COMPILER (AH3 — "gears in a clock").
 *
 * Given a run's SEED + ERA-0 CHOICES (i.e. the flags the prologue set), compile
 * ONE bespoke, internally-consistent timeline by selecting, from all the config
 * pools, the variants that match the chosen branch + dynasty — then resolving
 * slots, terms, and the active currency lane. The result is a deterministic
 * READ-MODEL over the run (NOT new persisted state): a save stays seed + history,
 * and recompiling from the same Era-0 state reproduces the identical bundle. This
 * is what lets the dev harness (AH5) dump "the whole timeline for a seed" and the
 * verification sweep (AH6) check consistency.
 *
 * Pure + deterministic. The rng is threaded for future bias-weighted tie-breaks
 * (AH9); today's selection is deterministic by branch/dynasty, so it is unused in
 * the happy path but kept in the signature so weighting can land without a churn.
 */

/**
 * Which dynastic gear a run follows, derived from Era-0 flags. NO-LEAK invariant
 * (FD-2/FD-3): the dynasty is fixed at founding and never swaps mid-run — so this
 * reads only the founding flag, not the retired mid-run `kennedy_swap` signal.
 */
function dynastyOf(flags: readonly string[]): DynastyKey {
  if (flags.includes("kennedy_dynasty_active")) return "kennedy";
  if (flags.includes("musk_dynasty_active")) return "musk";
  return "trump";
}

export interface CompiledTimeline {
  /** The seed this compilation is for (so dumps are self-identifying). */
  seed: string;
  /** The resolved alternate-history backdrop. */
  branch: BranchKey;
  /** The protagonist dynastic gear. */
  dynasty: DynastyKey;
  /** The Era-0 flags that drove the compilation. */
  era0Flags: string[];
  /** The active timeline variant per scope (default + branch-specific). */
  timelines: Array<{
    scope: WorldTimeline["scope"];
    branch: string;
    label: string;
    events: number;
  }>;
  /** Archetypal slots resolved to concrete event ids. */
  slots: Record<string, string>;
  /** The active currency at the run's start year. */
  currency: Pick<Currency, "id" | "symbol" | "name">;
  /** Branch-resolved key terms (head_of_state, surname, given_name). */
  terms: Record<string, string>;
}

/** Resolve a single term value for a branch (mirrors applyTerms, single token). */
function termFor(content: Content, key: string, branch: BranchKey): string | undefined {
  const t = content.terms[key];
  if (!t) return undefined;
  if (branch === "default") return t.default;
  return (t as Record<string, string | undefined>)[branch] ?? t.default;
}

/**
 * Compile the bespoke timeline for a fully-prologued state (post Era-0 choices).
 * Deterministic in (content, state). The rng is accepted for future weighting.
 */
export function compileTimeline(content: Content, state: GameState, _rng: Rng): CompiledTimeline {
  const branch = branchOf(state);
  const dynasty = dynastyOf(state.flags);
  const active = timelinesForBranch(content.worldTimelines, branch);
  const slots: Record<string, string> = resolveSlots(content.slots as Slot[], branch, dynasty);
  const currency = resolveCurrency(content, state);

  const keyTerms: Record<string, string> = {};
  for (const k of ["head_of_state", "the_nation", "surname"]) {
    const v = termFor(content, k, branch);
    if (v) keyTerms[k] = v;
  }
  // given_name / full_name are BIRTH-ORDER aware (AH8d): a firstborn/only-child
  // heir carries the patriarch's name (Friedrich III), overriding the branch term.
  keyTerms.given_name = resolveGivenName(content.terms, branch, state.flags);
  keyTerms.full_name = resolveFullName(content.terms, branch, state.flags);

  return {
    seed: state.seed,
    branch,
    dynasty,
    era0Flags: [...state.flags].sort(),
    timelines: active.map((t) => ({
      scope: t.scope,
      branch: t.branch ?? "default",
      label: t.label,
      events: t.events.length,
    })),
    slots,
    currency: { id: currency.id, symbol: currency.symbol, name: currency.name },
    terms: keyTerms,
  };
}

/**
 * Compile from a SEED + ERA-0 CHOICES by replaying just the prologue. `era0`
 * is the list of (eventId, choiceId) the player picked in Era 0. Deterministic.
 */
export function compileFromEra0(
  content: Content,
  seed: string,
  era0: ReadonlyArray<{ eventId: string; choiceId: string }>,
  createRng: (seed: string) => Rng,
  applyChoice: (
    content: Content,
    state: GameState,
    event: { id: string } & Record<string, unknown>,
    choiceId: string,
    rng: Rng,
  ) => { state: GameState },
): CompiledTimeline {
  const rng = createRng(seed);
  // Start with the default (trump) — the first Era-0 step is ev_dynasty_founding_choice
  // which will set the dynasty activation flag in state.flags. After the replay we
  // re-derive dynasty and birthYear so age computation is correct for all dynasties.
  let state = initState(content, seed);
  for (const step of era0) {
    const event = content.allEvents.find((e) => e.id === step.eventId);
    if (!event) throw new Error(`compileFromEra0: unknown event "${step.eventId}"`);
    state = applyChoice(content, state, event as never, step.choiceId, rng).state;
  }
  // Re-derive dynasty from the post-replay flags so birthYear and dynasty are
  // dynasty-correct before compiling (the Era-0 replay starts at Trump defaults but
  // the dynasty-selector event sets the right activation flag during replay).
  const resolvedDynasty = dynastyOf(state.flags);
  if (resolvedDynasty !== state.dynasty) {
    const birthYear = DYNASTY_START[resolvedDynasty];
    state = {
      ...state,
      dynasty: resolvedDynasty,
      birthYear,
      // Recompute age now that birthYear is correct.
      age: state.year - birthYear,
    };
  }
  return compileTimeline(content, state, createRng(`${seed}::compile`));
}
