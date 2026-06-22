/**
 * NARRATIVE ACTS PLAYER (Narrative Acts model) — the pure runtime that walks an act's scenes as a
 * NOVEL: present a scene's multi-paragraph prose, apply a chosen beat (weave: gather or divert) or
 * the terminal decision (motivator shift + flags), and resolve the next scene (divert → that scene;
 * else the beat/scene `next` fall-through). No DOM, no randomness — deterministic given the choice.
 */

import {
  applyMotivators,
  MOTIVATOR_AXES,
  type MotivatorAxis,
  type Motivators,
} from "../motivators";
import type { ActChapter, Scene } from "./schema";

/** The loaded saga corpus the player walks (acts + scenes, indexed). */
export interface SagaCorpus {
  acts: Map<string, ActChapter>;
  scenes: Map<string, Scene>;
}

/** Build the indexed corpus from raw acts + scenes, with cross-family intersections woven in. Pure. */
export function buildCorpus(acts: ActChapter[], scenes: Scene[]): SagaCorpus {
  const corpus: SagaCorpus = {
    acts: new Map(acts.map((a) => [a.id, a])),
    scenes: new Map(scenes.map((s) => [s.id, s])),
  };
  weaveThreads(corpus);
  return corpus;
}

/**
 * Deterministically weave cross-family INTERSECTIONS into the corpus: each act's MIDPOINT scene (the
 * spine slot whose intent is "another line's path may cross here") threads to a SIBLING wave at the
 * same tier — same era/macro-act, so the paths plausibly cross. The sibling is the next wave in sorted
 * roster order (wrapping), skipping the act's own wave; the thread is set only if that rival act
 * actually exists in the corpus. Idempotent: a scene that already declares a thread is left alone, and
 * a re-weave produces the identical result (the roster order is fixed). No RNG — pure + replay-safe.
 */
export function weaveThreads(corpus: SagaCorpus): void {
  const waves = [...new Set([...corpus.acts.values()].map((a) => a.wave))].sort();
  if (waves.length < 2) return;
  for (const act of corpus.acts.values()) {
    const midId = act.scenes.find((id) => id.endsWith(":midpoint"));
    if (!midId) continue;
    const mid = corpus.scenes.get(midId);
    if (!mid || mid.thread.length > 0) continue; // respect an authored thread
    // The sibling wave: the next wave after this act's, wrapping, that has an act at this tier.
    const start = waves.indexOf(act.wave);
    for (let step = 1; step < waves.length; step++) {
      const rival = waves[(start + step) % waves.length];
      if (!rival || rival === act.wave) continue;
      const rivalHasTier = [...corpus.acts.values()].some(
        (a) => a.wave === rival && a.tier === act.tier,
      );
      if (rivalHasTier) {
        mid.thread = [{ wave: rival, atTier: act.tier }];
        break;
      }
    }
  }
}

/** Coerce a loose motivatorShift record to a typed partial (only the 8 known axes). Pure. */
export function toMotivatorDelta(shift: Record<string, number>): Partial<Motivators> {
  const out: Partial<Motivators> = {};
  for (const axis of MOTIVATOR_AXES) {
    if (axis in shift) out[axis] = shift[axis];
  }
  return out;
}

/** Whether a scene's gate is satisfied by the current flags. Pure. */
export function sceneEligible(scene: Scene, flags: ReadonlySet<string>): boolean {
  for (const f of scene.requires.flags) if (!flags.has(f)) return false;
  for (const f of scene.requires.notFlags) if (flags.has(f)) return false;
  return true;
}

/** The result of applying a beat/decision option: the motivator + flag deltas + where to go next. */
export interface ChoiceOutcome {
  motivators: Motivators;
  flags: string[];
  /** The next scene id (a divert), or undefined to fall through to the scene's `next`. */
  divertTo?: string;
}

function withFlags(flags: readonly string[], add: readonly string[]): string[] {
  const set = new Set(flags);
  for (const f of add) set.add(f);
  return [...set];
}

/** Apply a beat's choice. A gather choice nudges motivators + flags but stays in the scene's flow; a divert forks. */
export function applyBeatChoice(
  scene: Scene,
  beatIndex: number,
  motivators: Motivators,
  flags: readonly string[],
): ChoiceOutcome {
  const beat = scene.beats[beatIndex];
  const choice = beat?.choice;
  if (!choice) return { motivators, flags: [...flags] };
  return {
    motivators: applyMotivators(motivators, toMotivatorDelta(choice.motivatorShift)),
    flags: withFlags(flags, choice.setFlags),
    divertTo: choice.gather ? undefined : choice.divertTo,
  };
}

/** Apply the scene's terminal decision option. */
export function applyDecision(
  scene: Scene,
  optionIndex: number,
  motivators: Motivators,
  flags: readonly string[],
): ChoiceOutcome {
  const opt = scene.decision?.options[optionIndex];
  if (!opt) return { motivators, flags: [...flags] };
  return {
    motivators: applyMotivators(motivators, toMotivatorDelta(opt.motivatorShift)),
    flags: withFlags(flags, opt.setFlags),
    divertTo: opt.divertTo,
  };
}

/**
 * Resolve the next scene id after an outcome: an explicit divert wins; else the scene's `next`
 * fall-through; else the next scene in the act's ordered list; else undefined (act ends). Pure.
 */
export function nextScene(
  _corpus: SagaCorpus,
  act: ActChapter,
  current: Scene,
  outcome: ChoiceOutcome,
): string | undefined {
  if (outcome.divertTo) return outcome.divertTo;
  if (current.next) return current.next;
  const i = act.scenes.indexOf(current.id);
  return i >= 0 && i + 1 < act.scenes.length ? act.scenes[i + 1] : undefined;
}

/** The first eligible scene of an act (its opening), given current flags. Pure. */
export function openingScene(
  corpus: SagaCorpus,
  act: ActChapter,
  flags: ReadonlySet<string>,
): Scene | undefined {
  for (const id of act.scenes) {
    const s = corpus.scenes.get(id);
    if (s && sceneEligible(s, flags)) return s;
  }
  return undefined;
}

/** All wave×archetype act chapters for a tier, ordered (the per-generation act). Pure. */
export function actsForTier(
  corpus: SagaCorpus,
  wave: string,
  archetype: string,
  tier: number,
): ActChapter | undefined {
  for (const a of corpus.acts.values()) {
    if (a.wave === wave && a.archetype === archetype && a.tier === tier) return a;
  }
  return undefined;
}

/** A braided cross-family fragment: the rival wave + the opening scene of its act at the thread's tier. */
export interface BraidedThread {
  wave: string;
  scene: Scene;
}

/**
 * Resolve a scene's cross-family INTERSECTIONS (ink threads). For each ThreadRef the scene declares,
 * find ANY act of the referenced wave at that tier (archetype-agnostic — paths cross regardless of
 * the rival's power base) and return its opening scene as a braided fragment to weave in. A ref that
 * points at an unauthored wave/tier is skipped (the intersection simply doesn't fire). Pure.
 */
export function resolveThreads(corpus: SagaCorpus, scene: Scene): BraidedThread[] {
  const out: BraidedThread[] = [];
  for (const ref of scene.thread) {
    let braided: Scene | undefined;
    for (const act of corpus.acts.values()) {
      if (act.wave !== ref.wave || act.tier !== ref.atTier) continue;
      braided = openingScene(corpus, act, new Set());
      if (braided) break;
    }
    if (braided) out.push({ wave: ref.wave, scene: braided });
  }
  return out;
}

export type { MotivatorAxis };
