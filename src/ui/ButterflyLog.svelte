<script lang="ts">
import type { LedgerEntry } from "../sim/state";

interface Props {
  ledger: LedgerEntry[];
}

const { ledger }: Props = $props();
// Most recent first.
const entries = $derived([...ledger].sort((a, b) => b.seq - a.seq));
</script>

<section class="log" aria-label="Butterfly Log">
  <h3>🦋 Butterfly Log</h3>
  {#if entries.length === 0}
    <p class="empty">No ripples yet. Your choices will echo here.</p>
  {:else}
    <ol>
      {#each entries as entry (entry.seq)}
        <li>
          <span class="year">{entry.year}</span>
          <span class="text">{entry.text}</span>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .log {
    padding: var(--mmm-pad);
  }
  h3 {
    margin: 0 0 0.5rem;
    color: var(--mmm-gold);
    font-family: var(--mmm-font-display);
  }
  .empty {
    color: var(--mmm-text-dim);
    font-style: italic;
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  li {
    display: grid;
    grid-template-columns: 3rem 1fr;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--mmm-surface);
    border-left: 3px solid var(--mmm-extrapolated);
    border-radius: var(--mmm-radius);
  }
  .year {
    font-weight: 700;
    color: var(--mmm-gold);
  }
  .text {
    color: var(--mmm-text);
    line-height: 1.4;
  }
</style>
