/**
 * ACT RUNNER (Narrative Acts model) — the pure stateful driver that walks one act of the novel
 * scene-by-scene. It holds the reader-facing position (current scene), the accumulated flags, and
 * the line's motivators, and exposes two moves: choose a beat (weave) or the terminal decision.
 * Each move returns the next ActState (no mutation) so the engine can save/replay it deterministically
 * — given the same start + same choice indices, the walk is bit-identical. No DOM, no randomness.
 */

import type { Motivators } from "../motivators";
import { applyBeatChoice, applyDecision, nextScene, openingScene, type SagaCorpus } from "./player";
import type { ActChapter, Scene } from "./schema";

/** The serializable position of an in-progress act: where we are + what we've accumulated. */
export interface ActState {
  actId: string;
  /** Current scene id, or null when the act has ended. */
  sceneId: string | null;
  /** How many of the current scene's weave beats the player has chosen so far. */
  beatCursor: number;
  flags: string[];
  motivators: Motivators;
}

/** Begin an act at its opening scene with the carried-in motivators + flags. Pure. */
export function startAct(
  corpus: SagaCorpus,
  act: ActChapter,
  motivators: Motivators,
  flags: readonly string[] = [],
): ActState {
  const open = openingScene(corpus, act, new Set(flags));
  return {
    actId: act.id,
    sceneId: open?.id ?? null,
    beatCursor: 0,
    flags: [...flags],
    motivators,
  };
}

/** The live scene for a state, or null if the act has ended. Pure. */
export function currentScene(corpus: SagaCorpus, state: ActState): Scene | null {
  return state.sceneId ? (corpus.scenes.get(state.sceneId) ?? null) : null;
}

function advance(
  corpus: SagaCorpus,
  state: ActState,
  scene: Scene,
  outcome: ReturnType<typeof applyDecision>,
): ActState {
  const act = corpus.acts.get(state.actId);
  const next = act ? nextScene(corpus, act, scene, outcome) : undefined;
  // A divert/next may itself be gated; skip to the first eligible scene from there.
  const resolved = resolveEligible(corpus, act, next, new Set(outcome.flags));
  return {
    actId: state.actId,
    sceneId: resolved,
    beatCursor: 0,
    flags: outcome.flags,
    motivators: outcome.motivators,
  };
}

/** From a candidate scene id, return it if eligible, else the next eligible scene in the act, else null. Pure. */
function resolveEligible(
  corpus: SagaCorpus,
  act: ActChapter | undefined,
  candidate: string | undefined,
  flags: ReadonlySet<string>,
): string | null {
  if (!candidate || !act) return candidate ?? null;
  let id: string | undefined = candidate;
  while (id) {
    const s = corpus.scenes.get(id);
    if (!s) return null;
    const eligible =
      s.requires.flags.every((f) => flags.has(f)) &&
      s.requires.notFlags.every((f) => !flags.has(f));
    if (eligible) return id;
    const i = act.scenes.indexOf(id);
    id = i >= 0 && i + 1 < act.scenes.length ? act.scenes[i + 1] : undefined;
  }
  return null;
}

/**
 * Apply the player's chosen weave beat. A scene's beats are ALTERNATIVES (ink weave): the player
 * picks one, it applies its motivator/flag nudge, and the scene resolves. A divert jumps to another
 * scene; otherwise the scene falls forward — to its terminal decision if it has one (the runner stays
 * on the scene so the reader shows it), else to the scene's `next`. Pure.
 */
export function chooseBeat(corpus: SagaCorpus, state: ActState, beatIndex: number): ActState {
  const scene = currentScene(corpus, state);
  if (!scene) return state;
  const outcome = applyBeatChoice(scene, beatIndex, state.motivators, state.flags);
  if (outcome.divertTo) return advance(corpus, state, scene, outcome);

  // A decision-bearing scene waits on the decision (stay put, record the beat's nudge); otherwise the
  // chosen beat IS the scene's resolution and the scene falls forward to `next`.
  if (scene.decision) {
    return {
      ...state,
      beatCursor: beatIndex + 1,
      flags: outcome.flags,
      motivators: outcome.motivators,
    };
  }
  return advance(corpus, state, scene, outcome);
}

/** Apply the scene's terminal decision and advance to the next scene. Pure. */
export function chooseDecision(corpus: SagaCorpus, state: ActState, optionIndex: number): ActState {
  const scene = currentScene(corpus, state);
  if (!scene) return state;
  const outcome = applyDecision(scene, optionIndex, state.motivators, state.flags);
  return advance(corpus, state, scene, outcome);
}

/** Whether the act has run to its end. Pure. */
export function actEnded(state: ActState): boolean {
  return state.sceneId === null;
}
