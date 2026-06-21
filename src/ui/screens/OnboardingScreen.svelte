<script lang="ts">
import type { Content } from "../../sim/content";
import { getCulture, suggestSurnames } from "../../sim/onomastics";
import { createRng } from "../../sim/rng";
import type { Place } from "../../sim/schema";
import {
  type ArrivalClass,
  availablePeriods,
  classesForPeriod,
  type PeriodBand,
  wavesForCell,
} from "../../sim/waveSelect";

/**
 * ONBOARDING (Convergence Saga, SS-7). "The story of America": the player founds a line by
 * choosing its WAVE of immigration — a 3-step funnel: PERIOD (when they crossed) → CLASS (poor
 * or middle, the arrival tier) → RACE/CULTURE (which wave, when more than one fits the cell) →
 * then bestow the family name. The class seeds the line's starting motivators (its GOAP
 * grounding). The run seed is a HIDDEN random draw (world only). Everything after — birth, date,
 * gender, given name, calling, the climb — unfolds as the in-game story.
 */

interface Props {
  content: Content;
  /** Begin the founded run: hidden seed + chosen wave place id + bestowed family name. */
  onComplete: (seed: string, place: string, surname: string) => void;
  /** Abandon onboarding and return to the title. */
  onCancel: () => void;
}

const { content, onComplete, onCancel }: Props = $props();

const seed = (() => {
  const words = crypto.getRandomValues(new Uint32Array(2));
  return `r${(words[0] ?? 0).toString(36)}${(words[1] ?? 0).toString(36)}`;
})();

const CLASS_LABEL: Record<ArrivalClass, { title: string; blurb: string }> = {
  poor: { title: "With nothing but your hands", blurb: "You arrive poor — steerage, a tenement, the lowest rung." },
  middle: { title: "With a trade and a little money", blurb: "You arrive with a skill or a small stake — the middling sort." },
};

// Funnel state: period → class → wave (race/culture) → name.
let period = $state<PeriodBand | undefined>();
let cls = $state<ArrivalClass | undefined>();
let chosen = $state<Place | undefined>();
let modalOpen = $state(false);
let typedName = $state("");

const periods = $derived(availablePeriods(content.places));
const classes = $derived(period ? classesForPeriod(content.places, period.id) : []);
const cellWaves = $derived(period && cls ? wavesForCell(content.places, period.id, cls) : []);

const suggestions = $derived.by(() => {
  if (!chosen) return [];
  const culture = getCulture({ cultures: content.onomastics }, chosen.defaultCulture);
  return suggestSurnames(culture, createRng(`${seed}::surname-offer`), 3);
});

function pickPeriod(p: PeriodBand): void {
  period = p;
  cls = undefined;
  chosen = undefined;
}
function pickClass(c: ArrivalClass): void {
  cls = c;
  // If the (period, class) cell has exactly one wave, skip the race/culture step.
  const waves = period ? wavesForCell(content.places, period.id, c) : [];
  chosen = waves.length === 1 ? waves[0] : undefined;
}
function pickWave(p: Place): void {
  chosen = p;
}
function back(): void {
  if (chosen && cellWaves.length > 1) chosen = undefined;
  else if (cls) cls = undefined;
  else if (period) period = undefined;
  else onCancel();
}

function bestow(surname: string): void {
  const place = chosen;
  const name = surname.trim().replace(/\s+/g, " ").slice(0, 32);
  if (!place || !name) return;
  onComplete(seed, place.id, name);
}
</script>

<!-- Global Escape closes the modal (the backdrop can't receive key events while focus is
     in the modal input — a11y review). `inert` on the page traps focus in the modal. -->
<svelte:window onkeydown={(e) => modalOpen && e.key === "Escape" && (modalOpen = false)} />

<main class="onboarding" inert={modalOpen}>
  {#if !period}
    <article class="card" data-phase="period">
      <p class="prompt">
        Every American line begins with a crossing. When did your people make theirs?
      </p>
      <div class="choices">
        {#each periods as p (p.id)}
          <button type="button" onclick={() => pickPeriod(p)}>{p.title}</button>
        {/each}
      </div>
    </article>
  {:else if !cls}
    <article class="card" data-phase="class">
      <p class="prompt">
        {period.title}. And what did they carry off the boat?
      </p>
      <div class="choices">
        {#each classes as c (c)}
          <button type="button" onclick={() => pickClass(c)}>
            <span class="opt-title">{CLASS_LABEL[c].title}</span>
            <span class="opt-blurb">{CLASS_LABEL[c].blurb}</span>
          </button>
        {/each}
      </div>
    </article>
  {:else if !chosen}
    <article class="card" data-phase="culture">
      <p class="prompt">
        {CLASS_LABEL[cls].blurb} But from where? Each people brought its own world.
      </p>
      <div class="choices">
        {#each cellWaves as p (p.id)}
          <button type="button" onclick={() => pickWave(p)}>
            <span class="opt-title">{p.label}</span>
            <span class="opt-blurb">{p.sensoryCue}{p.push ? ` — ${p.push}` : ""}</span>
          </button>
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

  <button class="abandon" type="button" onclick={back}>Back</button>
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
  .opt-title {
    display: block;
    font-family: var(--mmm-font-display);
    font-weight: 700;
    color: var(--mmm-gold);
  }
  .opt-blurb {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.9rem;
    color: var(--mmm-text-dim);
    line-height: 1.35;
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
