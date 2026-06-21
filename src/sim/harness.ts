import { branchOf } from "./branch";
import type { Content } from "./content";
import { applyChoice } from "./effects";
import { meetsRequires, pickNextEvent } from "./events";
import { type Composition, foundByComposition } from "./founding";
import { createRng, type Rng } from "./rng";
import type { Choice } from "./schema";
import { type GameState, withoutFlag } from "./state";
import { applyTerms, runTerms } from "./terms";

/**
 * DEV HARNESS (CP-R7) — play a FOUNDED run forward auto-resolving choices and record
 * the whole bespoke timeline, so the post-Gen-0 graph can be DUMPED to a repository
 * artifact and REVIEWED for consistency, linear time, no leaks, and clean
 * generation-to-generation progression. Pure + seeded: same composition → same trace.
 */

/** One recorded beat of a traced playthrough — the rendered, branch-resolved view. */
export interface TraceBeat {
  step: number;
  year: number;
  era: string;
  /** Generation depth of the current protagonist (0 = founder). */
  generation: number;
  eventId: string;
  /** The event title, with terms resolved as the player would see it. */
  title: string;
  choiceId: string;
  /** The choice text, resolved. */
  choiceText: string;
  /** How many other choices were offered (branch width at this beat). */
  branchWidth: number;
  meters: Record<string, number>;
  /** Flags added by this beat (the deltas, not the whole set). */
  flagsAdded: string[];
}

export interface Trace {
  composition: Composition;
  archetype: string;
  branch: string;
  beats: TraceBeat[];
  /** The terminal state's identity + outcome. */
  end: { year: number; kind?: string; reason?: string } | null;
  /** Final protagonist full name (founded-line resolved). */
  finalName: string;
  /** Generations reached (max protagonist generation seen). */
  generations: number;
}

function protagonistGeneration(state: GameState): number {
  const fam = state.family;
  if (!fam) return 0;
  const me = fam.members.find((m) => m.id === fam.protagonistId);
  return me?.generation ?? 0;
}

/**
 * The science-ladder + survival flags a `survive` policy steers toward so a dev
 * trace can reach the far-future eras (Mars/First-Contact/Interstellar gate on
 * these via `entryRequires`). Kept in sync with the era index `entryRequires`.
 */
const LADDER_FLAGS = new Set([
  "mars_program",
  "back_science",
  "extrasolar_flight",
  "contact_made",
  "two_world_patriarch",
  "starfarer_ascendant",
]);

/**
 * The set of flags that TRIGGER a mid-run failure ending: any flag named in the
 * `when.flags` of an ending capped to an early era (`maxEraOrder` set). A survivor
 * that means to endure must AVOID setting these — pumping meters alone backfires
 * (e.g. raising health past 60 with `walked_away` set fires `end_early_obscurity`).
 * Derived from the endings data so it stays correct as endings evolve.
 */
function failureTriggerFlags(content: Content): Set<string> {
  const flags = new Set<string>();
  for (const e of content.endings) {
    if (e.when.maxEraOrder !== undefined) {
      for (const f of e.when.flags) flags.add(f);
    }
  }
  return flags;
}

/**
 * SURVIVOR POLICY (EX-5 dev mode). Score a choice for a dynasty that means to
 * ENDURE the full millennium: pull every meter UP (away from the death/failure
 * thresholds the meter-gated endings watch), AVOID flags that trigger an early
 * failure ending, and climb the science ladder (so the late-era entry gates open).
 * Higher score = better for a long run. Pure — a function of the offered choice +
 * current meters only, so a `survive` trace stays deterministic for a composition.
 */
function survivorScore(
  choice: Choice,
  meters: Record<string, number>,
  failFlags: Set<string>,
): number {
  let score = 0;
  for (const [id, delta] of Object.entries(choice.effects ?? {})) {
    const current = meters[id] ?? 50;
    // A boost to a LOW meter is worth more than the same boost to a high one
    // (survival is about avoiding the floor, not maximizing an already-safe meter).
    const scarcity = id === "heat" ? 1 : Math.max(0.2, (100 - current) / 100);
    // Heat is a HAZARD meter (coup/jail/assassination watch it) — invert it.
    score += id === "heat" ? -(delta as number) : (delta as number) * scarcity;
  }
  for (const f of choice.setFlags ?? []) {
    if (LADDER_FLAGS.has(f)) score += 50; // climbing the ladder dominates
    if (failFlags.has(f)) score -= 1000; // never walk into an early failure ending
  }
  return score;
}

/**
 * Pick the highest-survivor-scoring choice; ties broken by a seeded draw among the
 * best so the trace stays deterministic but isn't biased to array order. `eligible`
 * is non-empty (the caller checks), so the result is always a real choice.
 */
function pickSurvivor(
  eligible: Choice[],
  meters: Record<string, number>,
  failFlags: Set<string>,
  rng: Rng,
): Choice {
  let bestScore = Number.NEGATIVE_INFINITY;
  const winners: Choice[] = [];
  for (const c of eligible) {
    const s = survivorScore(c, meters, failFlags);
    if (s > bestScore) {
      bestScore = s;
      winners.length = 0;
      winners.push(c);
    } else if (s === bestScore) {
      winners.push(c);
    }
  }
  return rng.pick(winners);
}

/** How a traced run resolves the choice at each beat. */
export interface TraceOptions {
  maxSteps?: number;
  /**
   * `random` (default) — seeded random pick, the natural-play audit. `survive` —
   * the survivor policy: greedily keep the line alive + climb the science ladder so
   * the dev trace can traverse the WHOLE era chain to the far future (EX-5).
   */
  policy?: "random" | "survive";
}

/** Play a founded run forward, recording every beat. Deterministic for a composition. */
export function tracePlaythrough(
  content: Content,
  composition: Composition,
  options: number | TraceOptions = 800,
): Trace {
  const opts: TraceOptions = typeof options === "number" ? { maxSteps: options } : options;
  const maxSteps = opts.maxSteps ?? 800;
  const policy = opts.policy ?? "random";
  let state = foundByComposition(content, composition).state;
  const rng = createRng(composition.seed);
  const beats: TraceBeat[] = [];
  const failFlags = policy === "survive" ? failureTriggerFlags(content) : new Set<string>();
  let resurrections = 0;
  const MAX_RESURRECTIONS = 200; // backstop: a dev trace can dodge many failures, not loop forever

  for (let i = 0; i < maxSteps && !state.end; i++) {
    const event = pickNextEvent(content, state, rng.fork(`pick:${i}`));
    if (
      !event ||
      event.choices.filter((c) => !c.requires || meetsRequires(state, c.requires)).length === 0
    ) {
      // No eligible event in this era. In SURVIVE mode the dev trace skips the
      // empty era and walks on (some far-future eras gate every authored event on
      // flags a given line lacks); in random mode a dead era is a natural stop.
      if (policy === "survive" && state.eraIndex < content.eras.length - 1) {
        const nextEra = content.eras[state.eraIndex + 1];
        let flags = state.flags;
        for (const f of LADDER_FLAGS) if (!flags.includes(f)) flags = [...flags, f];
        state = {
          ...state,
          flags,
          eraIndex: state.eraIndex + 1,
          eraEventCount: 0,
          year: nextEra?.yearStart ?? state.year,
          lastEventYear: nextEra?.yearStart ?? state.lastEventYear,
        };
        continue;
      }
      break;
    }
    const eligible = event.choices.filter((c) => !c.requires || meetsRequires(state, c.requires));
    const choice =
      policy === "survive"
        ? pickSurvivor(eligible, state.meters, failFlags, rng.fork(`choose:${i}`))
        : rng.fork(`choose:${i}`).pick(eligible);
    const branch = branchOf(state);
    const terms = runTerms(content.terms, branch, state);
    const before = new Set(state.flags);
    const next = applyChoice(content, state, event, choice.id, rng).state;
    beats.push({
      step: i,
      year: state.year,
      era: content.eras[state.eraIndex]?.id ?? "?",
      generation: protagonistGeneration(state),
      eventId: event.id,
      title: applyTerms(event.title, terms),
      choiceId: choice.id,
      choiceText: applyTerms(choice.text, terms),
      branchWidth: eligible.length,
      meters: { ...next.meters },
      flagsAdded: next.flags.filter((f) => !before.has(f)),
    });
    state = next;

    // DEV SURVIVE (EX-5): the dev trace's job is FULL-CHAIN content traversal, not
    // realistic play — so resurrect past ANY non-terminal ending (one that fired
    // while the line has eras still ahead of it) and keep walking to the far future.
    // The ONLY stop left to stand is line-extinct (a real structural dead-end with
    // no protagonist to carry on). To escape both kinds of mid-run ending —
    //   • flag-TRIGGERED failures (e.g. walked_away → obscurity): strip the flag.
    //   • flag-ABSENCE finales (e.g. notFlags mars_program → an Earth-arc finale):
    //     inject the science-ladder flags so the next era's entry gate opens.
    // both are applied, so the line climbs to interstellar regardless of branch.
    if (
      policy === "survive" &&
      state.end &&
      state.end.kind !== "line-extinct" &&
      state.eraIndex < content.eras.length - 1 &&
      resurrections < MAX_RESURRECTIONS
    ) {
      resurrections++;
      const triggered = state.end.endingId
        ? content.endings.find((e) => e.id === state.end?.endingId)
        : undefined;
      let flags = state.flags;
      for (const f of triggered?.when.flags ?? []) flags = withoutFlag(flags, f);
      for (const f of LADDER_FLAGS) if (!flags.includes(f)) flags = [...flags, f];
      state = { ...state, flags, end: null };
    }
  }

  const finalTerms = runTerms(content.terms, branchOf(state), state);
  return {
    composition,
    archetype: state.archetype,
    branch: branchOf(state),
    beats,
    end: state.end
      ? { year: state.end.year, kind: state.end.kind, reason: state.end.reason }
      : null,
    finalName: applyTerms("{full_name}", finalTerms),
    generations: beats.reduce((m, b) => Math.max(m, b.generation), 0),
  };
}

/** A single consistency finding (a violation of a timeline invariant). */
export interface TraceFinding {
  kind: "linear-time" | "leak" | "progression" | "branch" | "reachability";
  beat?: number;
  detail: string;
}

/**
 * VALIDATE a trace against the branch's done-criteria (CP-R7):
 *  - LINEAR TIME: years never go backward beat to beat.
 *  - NO LEAKS: no literal-preset name (Donald/Trump/Drumpf/Elon/Musk/Kennedy) in any
 *    RENDERED title/choice text (the founded line must read as its own).
 *  - PROGRESSION: generation depth is monotonic non-decreasing (a line only advances).
 *  - BRANCH: at least some beats offer a real choice (>1) — the run is not a corridor.
 * Returns the findings; empty = the timeline is clean.
 */
export function validateTrace(trace: Trace): TraceFinding[] {
  const findings: TraceFinding[] = [];
  // Preset-person literals that must never render for a founded line (CP-R7). Real
  // PLACE names (Kallstadt, Bavaria, …) and legitimate ONOMASTIC given names the culture
  // pools actually draw (e.g. "Friedrich" for a Bavarian line) are NOT leaks — only the
  // preset SURNAMES / full identities are. ("Fred" stays flagged: not in any given-name
  // pool; it only ever meant the literal Trump ancestor.)
  const LITERAL =
    /\b(Donald|Trump|Drumpf|Elon|Musk|Kennedy|Fred|Freddy|Errol|Walter Musk|Maye|Ivana|Mary Anne|Elizabeth Christ|JFK|RFK|Joseph Kennedy|Patrick Kennedy|Graham)\b/;
  let prevYear = -Infinity;
  let prevGen = 0;
  let branchingBeats = 0;
  for (const b of trace.beats) {
    if (b.year < prevYear) {
      findings.push({
        kind: "linear-time",
        beat: b.step,
        detail: `year ${b.year} < previous ${prevYear} at ${b.eventId}`,
      });
    }
    prevYear = b.year;
    if (LITERAL.test(b.title) || LITERAL.test(b.choiceText)) {
      findings.push({
        kind: "leak",
        beat: b.step,
        detail: `literal-preset name in rendered copy at ${b.eventId}: "${b.title}" / "${b.choiceText}"`,
      });
    }
    if (b.generation < prevGen) {
      findings.push({
        kind: "progression",
        beat: b.step,
        detail: `generation ${b.generation} < previous ${prevGen} at ${b.eventId}`,
      });
    }
    prevGen = b.generation;
    if (b.branchWidth > 1) branchingBeats++;
  }
  if (trace.beats.length > 0 && branchingBeats === 0) {
    findings.push({ kind: "branch", detail: "no beat offered a real choice (corridor)" });
  }
  return findings;
}

/**
 * Audit, for the whole offered place×era×archetype space, that every founded run
 * traces clean (CP-R7 — "all possible branching choices on the graph are consistent").
 * Runs N seeds per origin so different branch paths are exercised.
 */
export function auditTimelines(
  content: Content,
  origins: ReadonlyArray<{ place: string; era: string; archetype: string }>,
  seedsPerOrigin: number,
  resolve: (origin: { place: string; era: string; archetype: string }, seed: string) => Composition,
): { traces: Trace[]; findings: Array<TraceFinding & { origin: string; seed: string }> } {
  const traces: Trace[] = [];
  const findings: Array<TraceFinding & { origin: string; seed: string }> = [];
  for (const origin of origins) {
    for (let s = 0; s < seedsPerOrigin; s++) {
      const seed = `audit:${origin.place}:${origin.era}:${origin.archetype}:${s}`;
      const trace = tracePlaythrough(content, resolve(origin, seed));
      traces.push(trace);
      for (const f of validateTrace(trace)) {
        findings.push({ ...f, origin: `${origin.place}×${origin.era}×${origin.archetype}`, seed });
      }
    }
  }
  return { traces, findings };
}
