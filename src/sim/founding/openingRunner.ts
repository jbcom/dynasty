/**
 * EI-6b — a pure runner over the Epoch-0 OPENING scene chain (EMERGENT-INFANCY ONBOARDING).
 *
 * The opening (buildEpoch0Opening: birth → naming → childhood → formative beats) is a flat scene array, not
 * a SagaCorpus, so it gets a small dedicated runner — reusing the saga's pure flag/motivator accrual
 * (applyBeatChoice / applyDecision) but walking the array by scene id via each scene's `next` / a decision
 * option's `divertTo`. The UI drives it exactly like the SceneReader drives a saga scene (onbeat/ondecision).
 *
 * Pure + deterministic (sim purity): no DOM, no Date, no Math.random. Each move returns a NEW state (no
 * mutation) so the opening replays bit-identically. When the chain ends (the romance close, no `next`), the
 * accumulated flags + the dealt sense cues resolve the founding via EI-6a resolveEmergentFounding.
 */

import type { Motivators } from "../motivators";
import { initMotivators } from "../motivators";
import { applyBeatChoice, applyDecision } from "../saga/player";
import type { Scene } from "../saga/schema";

/** The reader-facing position in the opening: the current scene id + the accumulated motivators/flags. */
export interface OpeningState {
  /** The current scene's id, or null when the opening has ended (the emergence is complete). */
  sceneId: string | null;
  motivators: Motivators;
  flags: string[];
}

/** Begin the opening at its first scene (the birth scene). Pure. */
export function startOpening(scenes: readonly Scene[]): OpeningState {
  const first = scenes[0];
  return {
    sceneId: first?.id ?? null,
    motivators: initMotivators(),
    flags: [],
  };
}

/** The current scene for an OpeningState, or null when ended / not found. */
export function currentOpeningScene(scenes: readonly Scene[], state: OpeningState): Scene | null {
  if (!state.sceneId) return null;
  return scenes.find((s) => s.id === state.sceneId) ?? null;
}

/** Build the next state at the scene named by `target` (a `next` or `divertTo`); null target → ended. */
function advance(
  target: string | undefined,
  flags: string[],
  motivators: Motivators,
): OpeningState {
  return { sceneId: target ?? null, motivators, flags };
}

/**
 * Pick an inline beat-choice on the current scene: applies its motivator shift + flags, then — because beat
 * choices `gather` by default (stay in the scene) — keeps the SAME scene unless the choice diverts. The UI
 * surfaces the beat as a glowing inline choice; this records its effect. Pure.
 */
export function chooseOpeningBeat(
  scenes: readonly Scene[],
  state: OpeningState,
  beatIndex: number,
): OpeningState {
  const scene = currentOpeningScene(scenes, state);
  if (!scene) return state;
  const outcome = applyBeatChoice(scene, beatIndex, state.motivators, state.flags);
  const beat = scene.beats[beatIndex];
  // A gathering beat stays in the scene (the player may attend other beats / reach the decision); a
  // diverting beat jumps. The default is gather:true.
  const stays = beat?.choice?.gather !== false && !outcome.divertTo;
  return advance(
    stays ? scene.id : (outcome.divertTo ?? scene.next),
    outcome.flags,
    outcome.motivators,
  );
}

/**
 * Pick the current scene's terminal decision option: applies its shift + flags, then advances to the option's
 * `divertTo` (a fork) or the scene's `next` (the common case). When neither is set (the romance close), the
 * opening ENDS (sceneId → null) — the emergence is complete. Pure.
 */
export function chooseOpeningDecision(
  scenes: readonly Scene[],
  state: OpeningState,
  optionIndex: number,
): OpeningState {
  const scene = currentOpeningScene(scenes, state);
  if (!scene) return state;
  const outcome = applyDecision(scene, optionIndex, state.motivators, state.flags);
  return advance(outcome.divertTo ?? scene.next, outcome.flags, outcome.motivators);
}

/** True when the opening has run to its end (the emergence is complete → ready to found). */
export function openingEnded(state: OpeningState): boolean {
  return state.sceneId === null;
}
