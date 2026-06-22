<script lang="ts">
/**
 * RIVAL FIELD (RB-5) — the whole convergence race at a glance: every other line's current standing
 * (rung), sorted high→low, with the player's own rung marked for comparison. Complements the
 * near-vantage "Other lines" glimpses (which show only lines near your station) with the FULL field,
 * so the player can see where the dynasty sits in the race toward the stars. Pure presentation.
 */
interface Standing {
  id: string;
  label: string;
  rung: number;
}
interface Props {
  standings: Standing[];
  /** The player's own rung, shown inline so the field is read relative to the played line. */
  playerRung: number;
  /** Human label for a wave id (the run's waveLabel binding); falls back to a tidied id. */
  labelFor?: (id: string) => string;
}
const { standings, playerRung, labelFor = (s) => s.replace(/^rival:/, "").replace(/_/g, " ") }: Props =
  $props();
</script>

{#if standings.length}
  <section class="field" data-testid="rival-field">
    <h3 class="field-title">The field</h3>
    <ul class="rows">
      <li class="row you" data-testid="field-you">
        <span class="who">Your line</span>
        <span class="rungs" aria-label={`rung ${playerRung}`}>{"★".repeat(playerRung + 1)}</span>
      </li>
      {#each standings as s (s.id)}
        <li class="row">
          <span class="who">{labelFor(s.id)}</span>
          <span class="rungs" aria-label={`rung ${s.rung}`}>{"★".repeat(s.rung + 1)}</span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: var(--mmm-pad);
  }
  .field-title {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-size: 0.8rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--mmm-text-dim);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.8rem;
    font-family: var(--mmm-font-body);
    font-size: 0.95rem;
  }
  .row.you .who {
    color: var(--mmm-gold-bright);
    font-weight: 700;
  }
  .who {
    color: var(--mmm-text);
    text-transform: capitalize;
  }
  .rungs {
    color: var(--mmm-gold);
    letter-spacing: 0.05em;
    white-space: nowrap;
  }
</style>
