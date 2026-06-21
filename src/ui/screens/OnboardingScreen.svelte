<script lang="ts">
import type { Content } from "../../sim/content";
import { getCulture, suggestSurnames } from "../../sim/onomastics";
import { placeById } from "../../sim/places";
import { createRng } from "../../sim/rng";
import type { Place } from "../../sim/schema";

/**
 * ONBOARDING ENTRY (OB-3). The player CHOOSES a location from concrete, discernible sensory
 * cues — geography, the one pre-founding choice (it fixes place → era → culture). The run
 * seed is a HIDDEN random draw (world only — never authored, never shown). Then a family
 * name is bestowed (culture-appropriate suggestions, or name-your-own). Everything else —
 * birth + date, gender, given name, calling, partner, the branch fork — unfolds as the
 * AUTHORED Epoch-0 story in-game (OB-4/OB-5), not here.
 */

interface Props {
  content: Content;
  /** Begin the founded run: hidden seed + chosen place id + bestowed family name. */
  onComplete: (seed: string, place: string, surname: string) => void;
  /** Abandon onboarding and return to the title. */
  onCancel: () => void;
}

const { content, onComplete, onCancel }: Props = $props();

// A fresh hidden seed for this run — drives the WORLD (events/markets/mortality/procgen),
// never the player's identity. Drawn once per onboarding via the browser's CSPRNG so each
// New Game reshuffles the world; locked into the run + save from here on.
const seed = `r${Math.floor(crypto.getRandomValues(new Uint32Array(2)).reduce((a, b) => a * 0x100000000 + b, 0)).toString(36)}`;

// Phase: "place" = location pick; "name" = family-name bestowal for the chosen place.
let chosen = $state<Place | undefined>();
let modalOpen = $state(false);
let typedName = $state("");

const suggestions = $derived.by(() => {
  if (!chosen) return [];
  const culture = getCulture({ cultures: content.onomastics }, chosen.defaultCulture);
  return suggestSurnames(culture, createRng(`${seed}::surname-offer`), 3);
});

function pickPlace(p: Place): void {
  chosen = p;
}

function bestow(surname: string): void {
  const place = chosen;
  // Normalize a typed name: collapse internal whitespace + cap length defensively.
  const name = surname.trim().replace(/\s+/g, " ").slice(0, 32);
  if (!place || !name) return;
  onComplete(seed, place.id, name);
}
</script>

<!-- Global Escape closes the modal (the backdrop can't receive key events while focus is
     in the modal input — a11y review). `inert` on the page traps focus in the modal. -->
<svelte:window onkeydown={(e) => modalOpen && e.key === "Escape" && (modalOpen = false)} />

<main class="onboarding" inert={modalOpen}>
  {#if !chosen}
    <article class="card" data-phase="place">
      <p class="prompt">
        A line has to begin somewhere. Before the first cry, before the first choice, there is
        only a place — and you can already feel it. Where does your story open?
      </p>
      <div class="choices">
        {#each content.places as p (p.id)}
          <button type="button" onclick={() => pickPlace(p)}>{p.sensoryCue}</button>
        {/each}
      </div>
    </article>
  {:else}
    <article class="card" data-phase="name">
      <p class="prompt">
        {chosen.sensoryCue} — this is where the {chosen.label} line takes root. A name is
        waiting to be laid over it, carried down a line that does not yet exist. Which will it be?
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
