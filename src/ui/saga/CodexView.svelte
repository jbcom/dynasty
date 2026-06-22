<script lang="ts">
import type { CodexEntry } from "../../sim/saga/schema";

/**
 * CODEX VIEW (PF-11) — optional Suzerain-style lore briefs (waves + macro-acts), shown inside the
 * slide-out menu. Never required to read; collapsed by default, tap a title to expand its body. Pure
 * presentation over the loaded codex entries; resolves identity tokens through the injected `term` fn.
 */

interface Props {
  entries: CodexEntry[];
  term?: (text: string) => string;
}
const { entries, term = (t) => t }: Props = $props();

let openId = $state<string | null>(null);
</script>

<section class="codex" data-testid="codex">
  <h3 class="codex-title">Codex</h3>
  {#if entries.length === 0}
    <p class="empty">No lore recorded yet.</p>
  {/if}
  {#each entries as e (e.id)}
    <article class="entry" class:open={openId === e.id}>
      <button
        type="button"
        class="entry-head"
        aria-expanded={openId === e.id}
        onclick={() => (openId = openId === e.id ? null : e.id)}
      >
        {term(e.title)}
      </button>
      {#if openId === e.id}
        <p class="entry-body">{term(e.body)}</p>
      {/if}
    </article>
  {/each}
</section>

<style>
  .codex {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .codex-title {
    margin: 0 0 0.2rem;
    font-family: var(--mmm-font-display);
    font-size: 0.82rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mmm-gold-deep);
  }
  .empty {
    margin: 0;
    color: var(--mmm-text-dim);
    font-style: italic;
    font-size: 0.9rem;
  }
  .entry-head {
    width: 100%;
    text-align: left;
    appearance: none;
    border: none;
    background: none;
    padding: 0.4rem 0;
    cursor: pointer;
    font-family: var(--mmm-font-display);
    font-size: 1rem;
    color: var(--mmm-gold);
    border-bottom: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 22%, transparent);
  }
  .entry.open .entry-head {
    color: var(--mmm-gold-bright);
  }
  .entry-body {
    margin: 0.4rem 0 0.6rem;
    font-family: var(--mmm-font-body);
    font-size: 0.98rem;
    line-height: 1.7;
    color: var(--mmm-text);
    text-wrap: pretty;
  }
</style>
