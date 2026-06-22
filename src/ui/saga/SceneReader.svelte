<script lang="ts">
import { fade } from "svelte/transition";
import type { Scene } from "../../sim/saga/schema";
import { playCue, startMusic } from "../sound";

/**
 * SCENE READER (Narrative Acts model) — renders a scene as a PAGED novel, Suzerain-style: ONE
 * paragraph at a time, tap ANYWHERE to turn to the next. When the prose is spent, the scene's CHOICE
 * folds into the story as GLOWING PULSING text (no buttons) — the weave beats (alternatives) or the
 * terminal tiered decision. Tapping a non-option area while a choice is up makes the options pulse
 * FASTER (it does not advance) to say "pick one". Pure presentation: resolves identity tokens via the
 * injected `term` fn and emits the player's choice upward — never the sim.
 */

interface Props {
  scene: Scene;
  /** Resolve {surname}/{given_name}/… tokens — the run's `applyTerms` binding (identity in tests). */
  term?: (text: string) => string;
  /** The player picked a weave beat (index into scene.beats). */
  onbeat?: (beatIndex: number) => void;
  /** The player picked the terminal decision option (index into scene.decision.options). */
  ondecision?: (optionIndex: number) => void;
}
const { scene, term = (t) => t, onbeat, ondecision }: Props = $props();

// Paged reading position: which prose paragraph is currently shown (the last one revealed).
let paraIdx = $state(0);
// In a decision-bearing scene the beat is a preamble; once taken, the decision options show.
let beatTaken = $state(false);
// Transient "pick one" urge — set briefly when the player taps away while options are up.
let urging = $state(false);
let urgeTimer: ReturnType<typeof setTimeout> | undefined;

// Reset paging when the scene changes — compare against the id we last paged from (no effect that
// writes tracked state on every run, which would fight the click updates). Seeded from the initial
// scene so the first paint shows paragraph 0 without a reset race.
// svelte-ignore state_referenced_locally
let pagedFrom = $state(scene.id);
$effect(() => {
  if (scene.id !== pagedFrom) {
    pagedFrom = scene.id;
    paraIdx = 0;
    beatTaken = false;
    urging = false;
  }
});

// Clear the pending urge timer on unmount so its callback can't write state on a destroyed component.
$effect(() => () => clearTimeout(urgeTimer));

const lastPara = $derived(paraIdx >= scene.prose.length - 1);
const hasBeats = $derived(scene.beats.length > 0);
// Options show once the prose is fully read: the weave beats first, then (after a beat) the decision.
const showWeave = $derived(lastPara && hasBeats && !beatTaken);
const showDecision = $derived(lastPara && !!scene.decision && (!hasBeats || beatTaken));
const optionsUp = $derived(showWeave || showDecision);

function urge() {
  urging = true;
  clearTimeout(urgeTimer);
  // Long enough for two fast pulses, then settle back to the calm glow.
  urgeTimer = setTimeout(() => {
    urging = false;
  }, 900);
}

/** Tap on the page body: turn to the next paragraph, or — if a choice is up — urge the player to pick. */
function tapPage() {
  startMusic(); // first tap is the user gesture that lets the ambient bed begin (autoplay policy)
  if (optionsUp) {
    urge();
    return;
  }
  if (!lastPara) {
    paraIdx += 1;
    playCue("click"); // a soft page-turn
  }
}

function chooseBeat(i: number) {
  beatTaken = true;
  playCue("stinger"); // a choice lands
  onbeat?.(i);
}
</script>

<!-- The whole page is the tap target (advance / urge). Options stop propagation so a pick isn't an urge. -->
<!-- `data-scene-id` exposes the current scene to harness/e2e walks (the runner's id isn't otherwise in the DOM). -->
<section
  class="scene"
  data-sense={scene.sense}
  data-scene-id={scene.id}
  data-testid="scene-reader"
  data-options-up={optionsUp ? "" : undefined}
>
  <!-- Full-bleed tap layer: turn the page, or urge the player when a choice is up. A button so it's
       keyboard-focusable + screen-reader operable without an a11y-role mismatch. -->
  <button
    type="button"
    class="tap-layer"
    aria-label={optionsUp ? "Choose an option below" : "Continue"}
    onclick={tapPage}
  ></button>

  <!-- One paragraph at a time. The outer key fades the whole page in when the SCENE changes (a composed
       between-scene transition, distinct from the per-paragraph page-turn); the inner key animates each
       paragraph turn within a scene. Both honor prefers-reduced-motion (page-in disabled there). -->
  {#key scene.id}
    <div class="scene-body" in:fade={{ duration: 320 }}>
      {#key paraIdx}
        <p class="para" data-testid="para">{term(scene.prose[paraIdx] ?? "")}</p>
      {/key}
    </div>
  {/key}

  {#if !optionsUp}
    <!-- Quiet affordance that the page turns on tap. -->
    <span class="turn-hint" aria-hidden="true">{lastPara ? "" : "tap to continue"}</span>
  {/if}

  {#if showWeave}
    <div class="choices" class:urging data-testid="weave">
      {#each scene.beats as beat, i (i)}
        {#if beat.choice}
          <button
            type="button"
            class="inline-option"
            onclick={(e) => {
              e.stopPropagation();
              chooseBeat(i);
            }}
          >
            {term(beat.choice.text)}
          </button>
        {/if}
      {/each}
    </div>
  {/if}

  {#if showDecision && scene.decision}
    <div
      class="choices decision"
      class:urging
      data-tier={scene.decision.tier}
      data-testid="decision"
    >
      {#each scene.decision.options as opt, i (i)}
        <button
          type="button"
          class="inline-option"
          onclick={(e) => {
            e.stopPropagation();
            playCue("stinger");
            ondecision?.(i);
          }}
        >
          {term(opt.text)}
        </button>
      {/each}
    </div>
  {/if}
</section>

<style>
  .scene {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    max-width: 42rem;
    min-height: 60vh;
    margin-inline: auto;
    padding: var(--mmm-pad);
    /* Each sense tints the page edge with a faint wash so the frame is felt, not labelled. */
    border-left: 3px solid var(--sense-accent, var(--mmm-gold-deep));
    background: linear-gradient(
      to right,
      color-mix(in srgb, var(--sense-accent, var(--mmm-gold-deep)) 8%, transparent),
      transparent 30%
    );
  }
  /* Full-bleed invisible tap target behind the text; options sit above it (z-index) so they're clickable. */
  .tap-layer {
    position: absolute;
    inset: 0;
    appearance: none;
    border: none;
    background: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    z-index: 0;
  }
  .tap-layer:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--mmm-gold) 50%, transparent);
    outline-offset: -4px;
  }
  .scene-body,
  .para,
  .turn-hint,
  .choices {
    position: relative;
    z-index: 1;
  }
  /* The scene-body holds the prose above the tap layer; flex so paragraphs stack as before. */
  .scene-body {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }
  .scene[data-sense="smell"] { --sense-accent: #8c6f4d; }
  .scene[data-sense="taste"] { --sense-accent: #a4564d; }
  .scene[data-sense="touch"] { --sense-accent: #6f7d8c; }
  .scene[data-sense="sound"] { --sense-accent: #5d7a86; }
  .scene[data-sense="sight"] { --sense-accent: var(--mmm-gold); }

  .para {
    margin: 0;
    font-family: var(--mmm-font-body);
    /* Novel-readable: generous measure + leading, serif body. One paragraph holds the focus. */
    font-size: 1.18rem;
    line-height: 1.85;
    color: var(--mmm-text);
    text-wrap: pretty;
    animation: page-in 0.4s ease both;
  }
  @keyframes page-in {
    from { opacity: 0; transform: translateY(0.4rem); }
    to { opacity: 1; transform: none; }
  }
  .turn-hint {
    align-self: center;
    margin-top: auto;
    font-family: var(--mmm-font-body);
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--mmm-text-dim) 70%, transparent);
    animation: hint-breathe 2.4s ease-in-out infinite;
  }
  @keyframes hint-breathe {
    0%, 100% { opacity: 0.35; }
    50% { opacity: 0.7; }
  }

  /* OPTIONS folded into the story: glowing, pulsing, bigger than the body — not buttons. */
  .choices {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 0.6rem;
  }
  .inline-option {
    appearance: none;
    border: none;
    background: none;
    text-align: left;
    align-self: flex-start;
    padding: 0.2rem 0;
    cursor: pointer;
    font-family: var(--mmm-font-display);
    font-size: 1.32rem;
    line-height: 1.45;
    letter-spacing: 0.01em;
    color: var(--mmm-gold-bright);
    text-shadow: 0 0 8px color-mix(in srgb, var(--mmm-gold) 55%, transparent);
    animation: option-glow 2.6s ease-in-out infinite;
  }
  /* A major (fate-fork) decision's options read heavier. */
  .decision[data-tier="major"] .inline-option {
    font-weight: 800;
    font-size: 1.4rem;
  }
  .inline-option:hover {
    color: #fff;
    text-shadow: 0 0 14px color-mix(in srgb, var(--mmm-gold) 80%, transparent);
  }
  @keyframes option-glow {
    0%, 100% {
      text-shadow: 0 0 6px color-mix(in srgb, var(--mmm-gold) 35%, transparent);
      opacity: 0.9;
    }
    50% {
      text-shadow: 0 0 14px color-mix(in srgb, var(--mmm-gold) 75%, transparent);
      opacity: 1;
    }
  }
  /* Tap-away urge: pulse FAST to draw the eye to the options without advancing. */
  .choices.urging .inline-option {
    animation: option-urge 0.45s ease-in-out 2;
  }
  @keyframes option-urge {
    0%, 100% {
      text-shadow: 0 0 8px color-mix(in srgb, var(--mmm-gold) 50%, transparent);
      transform: none;
    }
    50% {
      text-shadow: 0 0 20px color-mix(in srgb, var(--mmm-gold) 100%, transparent);
      transform: scale(1.04);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .para { animation: none; }
    .turn-hint { animation: none; }
    .inline-option { animation: none; text-shadow: 0 0 10px color-mix(in srgb, var(--mmm-gold) 60%, transparent); }
    .choices.urging .inline-option { animation: none; color: #fff; }
  }
</style>
