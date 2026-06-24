<script lang="ts">
/**
 * VD-3 — BriefPanel: the dossier's GenAI path-voice analytical prose (the intel assessment / R&D memo /
 * market outlook). The text is resolved by the runner from `briefKey` (cached, like scenes) and passed in;
 * undefined while it resolves → a quiet placeholder line so the layout holds. Pure presentation.
 */
interface Props {
  /** The resolved brief prose (paragraphs), or undefined while it's still being generated/loaded. */
  paragraphs?: string[];
}
const { paragraphs }: Props = $props();
</script>

<figure class="brief-panel">
  <figcaption>Assessment</figcaption>
  {#if paragraphs && paragraphs.length > 0}
    {#each paragraphs as p, i (i)}
      <p class="brief">{p}</p>
    {/each}
  {:else}
    <p class="brief pending" aria-live="polite">Compiling the assessment…</p>
  {/if}
</figure>

<style>
  .brief-panel {
    margin: 0;
    max-width: 62ch;
  }
  figcaption {
    font-family: var(--mmm-font-display);
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mmm-text-dim);
    margin-bottom: 0.4rem;
  }
  .brief {
    margin: 0 0 0.8rem;
    font-family: var(--mmm-font-body);
    font-size: 1.02rem;
    line-height: 1.7;
    color: var(--mmm-text);
    text-wrap: pretty;
  }
  .brief.pending {
    color: var(--mmm-text-dim);
    font-style: italic;
  }
</style>
