<script lang="ts">
import RungStars from "./RungStars.svelte";
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
}
const { standings, playerRung }: Props = $props();

// The player's line is ranked INLINE with the rivals (rung desc, label tiebreak) — not pinned to the
// top — so the row's position reads as its true standing in the convergence race. Ties keep the player
// above a same-rung rival so "where am I" stays unambiguous.
const field = $derived(
  [
    { id: "you", label: "Your line", rung: playerRung, isPlayer: true },
    ...standings.map((s) => ({ ...s, isPlayer: false })),
  ].sort(
    (a, b) =>
      b.rung - a.rung ||
      (a.isPlayer ? -1 : b.isPlayer ? 1 : a.label.localeCompare(b.label)),
  ),
);
</script>

{#if standings.length}
  <section class="field" data-testid="rival-field">
    <h3 class="field-title">The field</h3>
    <ul class="rows">
      {#each field as r (r.id)}
        <!-- Player row carries .you + the test hook; rivals use their own label (no id-munging). -->
        <li class="row" class:you={r.isPlayer} data-testid={r.isPlayer ? "field-you" : undefined}>
          <span class="who">{r.label}</span>
          <RungStars rung={r.rung} />
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
</style>
