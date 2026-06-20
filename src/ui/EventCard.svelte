<script lang="ts">
import type { Choice, GameEvent } from "../sim/schema";
import { impact } from "./haptics";

interface Props {
  event: GameEvent;
  /** Called with the chosen choice id after haptics fire. */
  onchoose: (choiceId: string) => void;
  /** Disable inputs while a transition animates. */
  busy?: boolean;
  /** Branch-aware term interpolation; identity by default (alt-history AH1). */
  term?: (text: string) => string;
}

const { event, onchoose, busy = false, term = (t) => t }: Props = $props();

async function choose(choice: Choice): Promise<void> {
  if (busy) return;
  await impact(choice.effects);
  onchoose(choice.id);
}
</script>

<article class="card" data-event={event.id}>
  <div class="badges">
    <span class="year">{event.year}</span>
    <!-- No "Extrapolated" badge — stating it is obvious and breaks immersion;
         the year already signals past vs future. -->
  </div>

  <h2>{term(event.title)}</h2>
  <p class="scene">{term(event.scene)}</p>
  <!-- researchNote stays in the data as authoring provenance, but is NOT shown
       as a separate panel — the factual grounding is woven into the scene prose
       so the player never pivots between game-fiction and a footnote. -->

  <div class="choices">
    {#each event.choices as choice (choice.id)}
      <button type="button" disabled={busy} onclick={() => choose(choice)}>
        {term(choice.text)}
      </button>
    {/each}
  </div>
</article>

<style>
  .card {
    max-width: 34rem;
    margin: 0 auto;
    padding: var(--mmm-pad);
    /* Opaque fallback for devices where backdrop-filter is disabled/unsupported. */
    background: var(--mmm-surface);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 70%, transparent);
    border-radius: var(--mmm-radius-lg);
    box-shadow: var(--mmm-shadow);
  }
  @supports (backdrop-filter: blur(1px)) {
    .card {
      background: color-mix(in srgb, var(--mmm-surface) 80%, transparent);
      backdrop-filter: blur(8px);
    }
  }
  .badges {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
  }
  .year {
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    color: var(--mmm-gold);
    font-family: var(--mmm-font-body);
    text-transform: uppercase;
  }
  h2 {
    margin: 0 0 0.5rem;
    font-family: var(--mmm-font-display);
    font-size: 1.3rem;
    font-weight: 700;
    line-height: 1.2;
    color: var(--mmm-text);
  }
  .scene {
    margin: 0 0 1rem;
    font-family: var(--mmm-font-body);
    font-size: 1rem;
    line-height: 1.6;
    color: var(--mmm-text);
    border-left: 2px solid var(--mmm-gold-deep);
    padding-left: 0.75rem;
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
  button {
    text-align: left;
    padding: 0.65rem 0.9rem;
    background: color-mix(in srgb, var(--mmm-navy-light) 80%, var(--mmm-navy-deep));
    color: var(--mmm-text);
    border: 1px solid var(--mmm-gold-deep);
    border-radius: var(--mmm-radius);
    font-family: var(--mmm-font-body);
    font-size: 0.97rem;
    line-height: 1.45;
    cursor: pointer;
    transition:
      transform var(--mmm-dur-fast) var(--mmm-ease),
      background var(--mmm-dur-fast) var(--mmm-ease),
      border-color var(--mmm-dur-fast) var(--mmm-ease);
  }
  button:hover:not(:disabled) {
    background: var(--mmm-navy-light);
    transform: translateY(-1px);
    border-color: var(--mmm-gold);
    box-shadow: 0 2px 8px rgb(212 175 55 / 0.15);
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
