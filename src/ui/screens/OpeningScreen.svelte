<script lang="ts">
/**
 * EI-6b-ui — the EMERGENT-INFANCY opening screen. The New Game path plays the un-retired Epoch-0 emergence
 * (birth → naming → childhood → formative beats) through the SceneReader's glowing-inline surface, NOT the
 * old .card funnel. The player's beat/decision picks accumulate flags via the pure opening runner; when the
 * emergence ends, onComplete hands the accumulated flags + the dealt sense cues back to App, which resolves
 * the founding (EI-6a) and drops into play. Spec: docs/superpowers/specs/2026-06-23-emergent-infancy-onboarding-design.md.
 *
 * Token resolution: the naming beat speaks {full_name}/{given_name}/{child_kind}, which resolve from a live
 * family — so the screen founds a PROVISIONAL line (seed-dealt name/gender at a default founding place) up
 * front purely so the SceneReader can resolve those tokens during the opening. App re-founds with the
 * EMERGENT region/base/standing at the end, keeping the dealt name.
 */
import type { Content } from "../../sim/content";
import { foundByComposition } from "../../sim/founding";
import { dealComposition, placeById } from "../../sim/places";
import { FOUNDING_YEAR } from "../../sim/macroActs";
import { regionPlaceId } from "../../sim/foundingOrigin";
import { createRng } from "../../sim/rng";
import { dealFoundingSurname } from "../../sim/onomastics";
import { compositePortraitKey } from "../../sim/genai/portrait";
import { lifeStageForOpeningScene } from "../../sim/genai/portraitFacets";
import { dealSenseCues, type SenseCue } from "../../sim/founding/senseEmergence";
import { buildEpoch0Opening } from "../../sim/founding/epoch0Opening";
import {
  chooseOpeningBeat,
  chooseOpeningDecision,
  currentOpeningScene,
  openingEnded,
  startOpening,
  type OpeningState,
} from "../../sim/founding/openingRunner";
import { runTerms, applyTerms } from "../../sim/terms";
import { branchOf } from "../../sim/branch";
import SceneReader from "../saga/SceneReader.svelte";

interface Props {
  content: Content;
  /** The world seed (hidden random draw). The emergence is deterministic from it. */
  seed: string;
  /** Called when the emergence ends, with the accumulated flags + the dealt sense cues (App founds from them). */
  onComplete: (flags: readonly string[], cues: readonly SenseCue[]) => void;
  /** Abandon the opening and return to the title. */
  onCancel: () => void;
}
const { content, seed, onComplete, onCancel }: Props = $props();

// The dealt sense cues for this seed (drive the birth beat + feed EI-6a place resolution at the end).
// `seed` is stable for the component's lifetime (App remounts OpeningScreen per run via {#key seed}), so
// these are computed once at mount — not reactive state.
// svelte-ignore state_referenced_locally
const cues = dealSenseCues(createRng(`${seed}::emergence`));
// The authored Epoch-0 opening scenes (birth → naming → childhood → formative beats).
const scenes = buildEpoch0Opening(cues);

// A PROVISIONAL founded line so the naming beat's {full_name}/{given_name}/{child_kind} tokens resolve during
// the opening. Seed-dealt name/gender at a default founding place (New England) — App re-founds with the
// emergent facets at the end, keeping this dealt name.
const provisional = $derived.by(() => {
  const placeDef = placeById(content.places, regionPlaceId("new_england"));
  // Guard the missing-place case (Amazon-Q #194): dealComposition accepts an undefined place by random-dealing
  // a NON-founding place, which would silently found the provisional somewhere wrong instead of at the
  // founding seam. Fail loudly — the new_england founding place is required content.
  if (!placeDef) {
    throw new Error(`OpeningScreen: founding place "${regionPlaceId("new_england")}" not found in content`);
  }
  // The family name is SEED-DEALT (region-independent), so this provisional speaks the SAME {full_name}
  // App's final emergent founding will carry (App deals it from the identical seed label). EI-6b.
  const surname = dealFoundingSurname(createRng(`${seed}::founding:surname`));
  const composition = dealComposition(content.places, content.eras, seed, surname, placeDef);
  return foundByComposition(content, { ...composition, year: FOUNDING_YEAR }).state;
});
const term = $derived((text: string) =>
  applyTerms(text, runTerms(content.terms, branchOf(provisional), provisional)),
);

// The runner state — the reader-facing position + accumulated flags.
let runState = $state<OpeningState>(startOpening(scenes));
const scene = $derived(currentOpeningScene(scenes, runState));

// EI-9c: a LIFE-STAGE portrait that grows with the progenitor through the emergence (infant → child → youth),
// founding-era, at the neutral starting station (the line's power base/rung hasn't emerged yet). The composite
// key maps to the same generated asset scheme PlayScreen uses; missing keys fall back to prose-only.
const portraitSrc = $derived.by(() => {
  if (!scene) return undefined;
  const key = compositePortraitKey({
    lifeStage: lifeStageForOpeningScene(scene.id),
    eraBand: "founding_1700s",
    archetype: "economic",
    rungTier: "low",
    gender: provisional.founding?.gender ?? "male",
  });
  return `/assets/generated/portraits/${key.replace(/:/g, "_")}.png`;
});

function onbeat(i: number): void {
  runState = chooseOpeningBeat(scenes, runState, i);
  finishIfEnded();
}
function ondecision(i: number): void {
  runState = chooseOpeningDecision(scenes, runState, i);
  finishIfEnded();
}
function finishIfEnded(): void {
  if (openingEnded(runState)) onComplete(runState.flags, cues);
}
</script>

<main class="opening" aria-live="polite">
  {#if scene}
    <SceneReader {scene} {portraitSrc} {term} {onbeat} {ondecision} />
  {/if}
  <button type="button" class="abandon" onclick={onCancel}>Back</button>
</main>

<style>
  .opening {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    /* Match the funnel's safe-area discipline (SAFE-AREA-ONBOARDING-TITLE): pad both insets. */
    padding: max(1.25rem, env(safe-area-inset-top)) var(--mmm-pad)
      max(1.25rem, env(safe-area-inset-bottom));
    background: radial-gradient(
      120% 80% at 50% 0%,
      var(--mmm-navy-light) 0%,
      var(--mmm-navy) 55%,
      var(--mmm-navy-deep) 100%
    );
  }
  .abandon {
    align-self: center;
    margin-top: auto;
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    color: var(--mmm-text-dim);
    font-family: var(--mmm-font-body);
    cursor: pointer;
  }
</style>
