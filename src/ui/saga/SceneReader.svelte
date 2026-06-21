<script lang="ts">
import type { Scene } from "../../sim/saga/schema";

/**
 * SCENE READER (Narrative Acts model) — renders ONE scene as a page of a novel, Suzerain-style:
 * large readable multi-paragraph prose, sense-tinted, with the weave of beats and the terminal
 * tiered decision the prose framed. The reader REVEALS progressively (a beat at a time) so a scene
 * reads like turning pages, not a wall of text + a quiz. Pure presentation: it resolves identity
 * tokens through the injected `term` fn (defaults to identity for standalone tests) and emits the
 * player's chosen beat/decision option upward — it never touches the sim.
 */

interface Props {
  scene: Scene;
  /** Resolve {surname}/{given_name}/… tokens — the run's `applyTerms` binding (identity in tests). */
  term?: (text: string) => string;
  /** The player picked a beat's gather/divert choice (index into scene.beats). */
  onbeat?: (beatIndex: number) => void;
  /** The player picked the terminal decision option (index into scene.decision.options). */
  ondecision?: (optionIndex: number) => void;
}
const { scene, term = (t) => t, onbeat, ondecision }: Props = $props();

// How far the reader has unfolded: the prose is always shown; beats reveal one at a time as the
// player chooses each (a gather beat falls forward to the next; a decision-bearing scene ends on it).
// `revealed` counts how many beats are visible. The decision shows once every beat is past.
let revealed = $state(0);
// Reset the unfold when the scene changes (Svelte 5: keyed on scene.id).
$effect(() => {
  scene.id; // track
  revealed = 0;
});

const visibleBeats = $derived(scene.beats.slice(0, revealed + 1));
const allBeatsDone = $derived(revealed >= scene.beats.length);

function chooseBeat(localIndex: number) {
  onbeat?.(localIndex);
  // A gather beat advances to the next beat in the weave; a divert is handled by the parent.
  revealed += 1;
}
</script>

<article class="scene" data-sense={scene.sense} data-testid="scene-reader">
  <div class="prose">
    {#each scene.prose as para, i (i)}
      <p class="para">{term(para)}</p>
    {/each}
  </div>

  {#if scene.beats.length}
    <div class="weave" data-testid="weave">
      {#each visibleBeats as beat, i (i)}
        <div class="beat" class:past={i < revealed}>
          {#each beat.prose as line, j (j)}
            <p class="beat-line">{term(line)}</p>
          {/each}
          {#if beat.choice && i === revealed}
            <button type="button" class="weave-choice" onclick={() => chooseBeat(i)}>
              {term(beat.choice.text)}
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if scene.decision && allBeatsDone}
    <div class="decision" data-tier={scene.decision.tier} data-testid="decision">
      <p class="prompt">{term(scene.decision.prompt)}</p>
      <div class="options">
        {#each scene.decision.options as opt, i (i)}
          <button type="button" class="option" onclick={() => ondecision?.(i)}>
            {term(opt.text)}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</article>

<style>
  .scene {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    max-width: 42rem;
    margin-inline: auto;
    padding: var(--mmm-pad);
    /* Each sense tints the page with a faint wash so the frame is felt, not labelled. */
    border-left: 3px solid var(--sense-accent, var(--mmm-gold-deep));
    background: linear-gradient(
      to right,
      color-mix(in srgb, var(--sense-accent, var(--mmm-gold-deep)) 8%, transparent),
      transparent 30%
    );
  }
  .scene[data-sense="smell"] { --sense-accent: #8c6f4d; }
  .scene[data-sense="taste"] { --sense-accent: #a4564d; }
  .scene[data-sense="touch"] { --sense-accent: #6f7d8c; }
  .scene[data-sense="sound"] { --sense-accent: #5d7a86; }
  .scene[data-sense="sight"] { --sense-accent: var(--mmm-gold); }

  .prose,
  .beat {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .para,
  .beat-line {
    margin: 0;
    font-family: var(--mmm-font-body);
    /* Novel-readable: generous measure + leading, serif body. */
    font-size: 1.06rem;
    line-height: 1.75;
    color: var(--mmm-text);
    text-wrap: pretty;
  }
  /* The first paragraph of a scene gets a drop-letter, like a chapter opening. */
  .prose .para:first-child::first-letter {
    font-family: var(--mmm-font-display);
    font-size: 3.1rem;
    line-height: 0.8;
    float: left;
    padding-right: 0.5rem;
    color: var(--mmm-gold);
  }
  .weave {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    border-top: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 25%, transparent);
    padding-top: 1rem;
  }
  .beat.past {
    opacity: 0.62;
  }
  .beat-line {
    font-style: italic;
    color: var(--mmm-text-dim);
  }
  .weave-choice,
  .option {
    align-self: flex-start;
    text-align: left;
    font-family: var(--mmm-font-body);
    font-size: 1rem;
    line-height: 1.5;
    color: var(--mmm-text);
    background: color-mix(in srgb, var(--mmm-surface) 70%, transparent);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 50%, transparent);
    border-radius: var(--mmm-radius);
    padding: 0.7rem 1rem;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .weave-choice:hover,
  .option:hover {
    border-color: var(--mmm-gold);
    background: color-mix(in srgb, var(--mmm-gold) 12%, var(--mmm-surface));
  }
  .decision {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    border-top: 2px solid color-mix(in srgb, var(--mmm-gold) 45%, transparent);
    padding-top: 1.1rem;
  }
  .prompt {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-size: 1.08rem;
    line-height: 1.5;
    color: var(--mmm-gold-bright);
  }
  /* A major (fate-fork) decision reads heavier than a secondary one. */
  .decision[data-tier="major"] {
    border-top-color: var(--mmm-gold);
  }
  .decision[data-tier="major"] .prompt {
    font-weight: 800;
    letter-spacing: 0.01em;
  }
  .options {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .options .option {
    align-self: stretch;
  }
</style>
