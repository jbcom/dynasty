import type { Content } from "./content";
import { applyChoice } from "./effects";
import { meetsRequires, pickNextEvent } from "./events";
import { type Composition, foundByComposition } from "./founding";
import { createRng } from "./rng";
import { applyTerms, runTerms } from "./terms";
import { branchOf } from "./branch";
import type { GameState } from "./state";

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

/** Play a founded run forward, recording every beat. Deterministic for a composition. */
export function tracePlaythrough(content: Content, composition: Composition, maxSteps = 800): Trace {
  let state = foundByComposition(content, composition).state;
  const rng = createRng(composition.seed);
  const beats: TraceBeat[] = [];

  for (let i = 0; i < maxSteps && !state.end; i++) {
    const event = pickNextEvent(content, state, rng.fork(`pick:${i}`));
    if (!event) break;
    const eligible = event.choices.filter((c) => !c.requires || meetsRequires(state, c.requires));
    if (eligible.length === 0) break;
    const choice = rng.fork(`choose:${i}`).pick(eligible);
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
  // place names (Kallstadt, Bavaria, …) are legitimate per place and NOT flagged;
  // only literal PEOPLE / preset surnames are leaks.
  const LITERAL =
    /\b(Donald|Trump|Drumpf|Elon|Musk|Kennedy|Friedrich|Fred|Freddy|Errol|Walter Musk|Maye|Ivana|Mary Anne|Elizabeth Christ|JFK|RFK|Joseph Kennedy|Patrick Kennedy|Graham)\b/;
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
