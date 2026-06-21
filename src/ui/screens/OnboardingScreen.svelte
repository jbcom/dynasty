<script lang="ts">
import type { Content } from "../../sim/content";
import { getCulture, suggestSurnames } from "../../sim/onomastics";
import { dealComposition, placeById } from "../../sim/places";
import { createRng } from "../../sim/rng";
import { composeSeed, SEED_LANES, seedLane } from "../../sim/seedComposer";

/**
 * DIEGETIC ONBOARDING (PL-3). No upfront inputs: the player authors the run seed by
 * making three place-agnostic "consciousness" choices (the emerging threads of a
 * not-yet-born mind), then — once the composed seed has dealt a place + culture — is
 * offered a culture-appropriate FAMILY name (or names their own via a quiet modal).
 * Only after both are authored does the deterministic run begin. The seed is never shown.
 */

interface Props {
  content: Content;
  /** Begin the founded run with the authored seed + surname. */
  onComplete: (seed: string, surname: string) => void;
  /** Abandon onboarding and return to the title. */
  onCancel: () => void;
}

const { content, onComplete, onCancel }: Props = $props();

// Phase: 0..2 = the three consciousness lanes; "name" = surname bestowal.
let step = $state(0);
const picks: string[] = $state([]);

// Once the three words are chosen, compose the seed + deal the origin so the surname
// bestowal can offer names that fit the dealt culture. Derived, pure, deterministic.
const seed = $derived(picks.length === SEED_LANES.length ? composeSeed(picks) : null);
const dealt = $derived(
  seed ? dealComposition(content.places, content.eras, seed) : null,
);
const dealtPlace = $derived(dealt ? placeById(content.places, dealt.place) : undefined);
const suggestions = $derived.by(() => {
  if (!dealt || !seed) return [];
  const culture = getCulture({ cultures: content.onomastics }, dealt.culture);
  return suggestSurnames(culture, createRng(`${seed}::surname-offer`), 3);
});

let modalOpen = $state(false);
let typedName = $state("");

function pickWord(word: string): void {
  picks.push(word);
  if (picks.length >= SEED_LANES.length) step = SEED_LANES.length; // → name phase
  else step += 1;
}

function bestow(surname: string): void {
  const finalSeed = seed;
  // Normalize a typed name: collapse internal whitespace and cap length defensively
  // (the input maxlength is a soft client cap; never found a line on junk or a blank).
  const name = surname.trim().replace(/\s+/g, " ").slice(0, 32);
  if (!finalSeed || !name) return;
  onComplete(finalSeed, name);
}

const currentLane = $derived.by(() => {
  const key = SEED_LANES[step];
  return key ? seedLane(key) : null;
});
</script>

<!-- Global Escape closes the modal (the backdrop can't receive key events while focus is
     in the modal input — a11y review). `inert` on the page traps focus in the modal. -->
<svelte:window onkeydown={(e) => modalOpen && e.key === "Escape" && (modalOpen = false)} />

<main class="onboarding" inert={modalOpen}>
  {#if currentLane}
    <article class="card" data-phase="consciousness" data-step={step}>
      <p class="prompt">{currentLane.prompt}</p>
      <div class="choices">
        {#each currentLane.words as choice (choice.word)}
          <button type="button" onclick={() => pickWord(choice.word)}>
            {choice.fragment}
          </button>
        {/each}
      </div>
      <p class="step-dots" aria-hidden="true">
        {#each SEED_LANES as _, i (i)}
          <span class:done={i < step} class:active={i === step}>◆</span>
        {/each}
      </p>
    </article>
  {:else}
    <article class="card" data-phase="name">
      <p class="prompt">
        The dark resolves into the world — {dealtPlace?.sensoryCue ?? "a place not yet named"}.
        Somewhere ahead, a name is already waiting to be laid over you like a mantle, to be
        carried down a line that does not yet exist. Which will it be?
      </p>
      <div class="choices">
        {#each suggestions as name (name)}
          <button type="button" onclick={() => bestow(name)}>{name}</button>
        {/each}
        <button class="own" type="button" onclick={() => (modalOpen = true)}>
          Name your own line…
        </button>
      </div>
    </article>
  {/if}

  <button class="abandon" type="button" onclick={onCancel}>Back</button>
</main>

{#if modalOpen}
  <!-- Non-disruptive overlay: the onboarding card stays mounted (inert) underneath; the
       backdrop is a real button so click AND keyboard (Enter/Space) dismiss it, and global
       Escape dismisses too — naming your own line never jolts you out of the moment. -->
  <button class="modal-backdrop" type="button" aria-label="Dismiss" onclick={() => (modalOpen = false)}
  ></button>
  <div class="modal" role="dialog" aria-modal="true" aria-label="Name your own line">
    <p class="modal-prompt">Speak the name your line will carry through the centuries.</p>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      bind:value={typedName}
      autofocus
      autocomplete="off"
      maxlength="32"
      placeholder="a family name"
      onkeydown={(e) => e.key === "Enter" && typedName.trim() && bestow(typedName)}
    />
    <div class="modal-actions">
      <button class="ghost" type="button" onclick={() => (modalOpen = false)}>Cancel</button>
      <button class="confirm" type="button" disabled={!typedName.trim()} onclick={() => bestow(typedName)}>
        Bestow it
      </button>
    </div>
  </div>
{/if}

<style>
  .onboarding {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    min-height: 100dvh;
    padding: max(1.25rem, env(safe-area-inset-top)) var(--mmm-pad);
    background: radial-gradient(120% 80% at 50% 0%, var(--mmm-navy-light) 0%, var(--mmm-navy) 55%, var(--mmm-navy-deep) 100%);
  }
  .card {
    max-width: 34rem;
    width: min(34rem, 92vw);
    padding: var(--mmm-pad);
    border-radius: var(--mmm-radius-lg);
    background: color-mix(in srgb, var(--mmm-surface) 55%, transparent);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 50%, transparent);
    box-shadow: var(--mmm-shadow);
  }
  .prompt {
    margin: 0 0 1.1rem;
    font-family: var(--mmm-font-body);
    font-style: italic;
    font-size: 1.08rem;
    line-height: 1.5;
    color: var(--mmm-text);
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .choices button {
    text-align: left;
    padding: 0.85rem 1rem;
    border-radius: var(--mmm-radius);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 55%, transparent);
    background: color-mix(in srgb, var(--mmm-navy-deep) 70%, transparent);
    color: var(--mmm-text);
    font-family: var(--mmm-font-body);
    font-size: 1rem;
    line-height: 1.4;
    cursor: pointer;
    transition:
      border-color var(--mmm-dur-fast) var(--mmm-ease),
      transform var(--mmm-dur-fast) var(--mmm-ease);
  }
  .choices button:hover,
  .choices button:focus-visible {
    border-color: var(--mmm-gold);
    transform: translateY(-1px);
    outline: none;
  }
  .choices .own {
    font-family: var(--mmm-font-display);
    color: var(--mmm-gold);
    text-align: center;
    font-style: italic;
  }
  .step-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin: 1.2rem 0 0;
    font-size: 0.6rem;
    color: color-mix(in srgb, var(--mmm-gold-deep) 50%, transparent);
  }
  .step-dots .done {
    color: var(--mmm-gold-deep);
  }
  .step-dots .active {
    color: var(--mmm-gold);
  }
  .abandon {
    background: none;
    border: none;
    color: var(--mmm-text-dim);
    font-family: var(--mmm-font-body);
    font-size: 0.85rem;
    cursor: pointer;
  }
  .abandon:hover {
    color: var(--mmm-text);
  }
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.55);
    backdrop-filter: blur(2px);
    border: none;
    cursor: pointer;
  }
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(24rem, 90vw);
    padding: 1.5rem;
    border-radius: var(--mmm-radius-lg);
    background: var(--mmm-surface);
    border: 1px solid var(--mmm-gold-deep);
    box-shadow: var(--mmm-shadow);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .modal-prompt {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-style: italic;
    color: var(--mmm-text);
  }
  .modal input {
    padding: 0.7rem 0.8rem;
    border-radius: var(--mmm-radius);
    border: 1px solid var(--mmm-gold-deep);
    background: var(--mmm-navy-deep);
    color: var(--mmm-text);
    font-family: var(--mmm-font-display);
    font-size: 1.1rem;
    width: 100%;
  }
  .modal input:focus-visible {
    outline: 2px solid var(--mmm-gold);
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
  }
  .modal-actions button {
    padding: 0.55rem 1rem;
    border-radius: var(--mmm-radius);
    font-family: var(--mmm-font-display);
    cursor: pointer;
  }
  .ghost {
    background: none;
    border: 1px solid var(--mmm-gold-deep);
    color: var(--mmm-text-dim);
  }
  .confirm {
    background: var(--mmm-gold);
    border: 1px solid var(--mmm-gold);
    color: var(--mmm-navy-deep);
    font-weight: 700;
  }
  .confirm:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  @media (prefers-reduced-motion: reduce) {
    .choices button {
      transition: none;
    }
  }
</style>
