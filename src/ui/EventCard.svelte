<script lang="ts">
import type { Choice, GameEvent } from "../sim/schema";
import { impact } from "./haptics";

interface Props {
  event: GameEvent;
  /** Called with the chosen choice id after haptics fire. */
  onchoose: (choiceId: string) => void;
  /** Disable inputs while a transition animates. */
  busy?: boolean;
}

const { event, onchoose, busy = false }: Props = $props();

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

  <h2>{event.title}</h2>
  <p class="scene">{event.scene}</p>
  <!-- researchNote stays in the data as authoring provenance, but is NOT shown
       as a separate panel — the factual grounding is woven into the scene prose
       so the player never pivots between game-fiction and a footnote. -->

  <div class="choices">
    {#each event.choices as choice (choice.id)}
      <button type="button" disabled={busy} onclick={() => choose(choice)}>
        {choice.text}
      </button>
    {/each}
  </div>
</article>

<style>
  .card {
    max-width: 34rem;
    margin: 0 auto;
    padding: var(--mmm-pad);
    background: var(--mmm-surface);
    border: 1px solid var(--mmm-gold-deep);
    border-radius: var(--mmm-radius-lg);
    box-shadow: var(--mmm-shadow);
  }
  .badges {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
  }
  .year {
    font-weight: 700;
    color: var(--mmm-gold);
    font-family: var(--mmm-font-display);
  }
  h2 {
    margin: 0 0 0.4rem;
    font-family: var(--mmm-font-display);
    color: var(--mmm-text);
  }
  .scene {
    margin: 0 0 0.9rem;
    line-height: 1.5;
    color: var(--mmm-text);
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  button {
    text-align: left;
    padding: 0.7rem 0.9rem;
    background: var(--mmm-navy-light);
    color: var(--mmm-text);
    border: 1px solid var(--mmm-gold-deep);
    border-radius: var(--mmm-radius);
    font-size: 0.95rem;
    cursor: pointer;
    transition:
      transform var(--mmm-dur-fast) var(--mmm-ease),
      background var(--mmm-dur-fast) var(--mmm-ease);
  }
  button:hover:not(:disabled) {
    background: var(--mmm-navy);
    transform: translateY(-1px);
    border-color: var(--mmm-gold);
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
