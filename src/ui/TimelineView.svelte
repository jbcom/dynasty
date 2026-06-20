<script lang="ts">
import type { Content } from "../sim/content";
import type { GameState } from "../sim/state";

interface Props {
  content: Content;
  gameState: GameState;
}

const { content, gameState }: Props = $props();

// Hand-rolled lightweight timeline. The future is NOT spoiled: only eras the
// player has actually reached (up to and including the current one) are shown,
// plus a single "the road ahead is unwritten" teaser if more eras remain.
const revealed = $derived(content.eras.filter((_, i) => i <= gameState.eraIndex));
const hasFuture = $derived(gameState.eraIndex < content.eras.length - 1);
const eventsByYear = $derived(
  gameState.history.map((h) => ({ year: h.year, id: h.eventId })),
);
</script>

<section class="timeline" aria-label="Life timeline">
  <h3>Timeline</h3>
  <div class="scroll">
    {#each revealed as era, i (era.id)}
      <div
        class="era"
        class:current={i === gameState.eraIndex}
        style={`--accent: ${era.paletteAccent}`}
      >
        <div class="era-head">
          <span class="era-title">{era.title}</span>
          <span class="era-years">{era.yearStart}–{era.yearEnd}</span>
          {#if era.extrapolated}<span class="tag">future</span>{/if}
        </div>
        <div class="markers">
          {#each eventsByYear.filter((e) => e.year >= era.yearStart && e.year <= era.yearEnd) as ev (ev.id)}
            <span class="marker" title={`${ev.id} (${ev.year})`}></span>
          {/each}
        </div>
      </div>
    {/each}
    {#if hasFuture}
      <div class="era unwritten" aria-label="The road ahead is unwritten">
        <div class="era-head">
          <span class="era-title">?</span>
          <span class="era-years">the road ahead</span>
        </div>
      </div>
    {/if}
  </div>
  <p class="now">You are in {revealed[gameState.eraIndex]?.title ?? "—"}, {gameState.year}.</p>
</section>

<style>
  .timeline { padding: var(--mmm-pad); }
  h3 { color: var(--mmm-gold); font-family: var(--mmm-font-display); margin: 0 0 0.5rem; }
  .scroll { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; }
  .era {
    flex: 0 0 9rem;
    padding: 0.5rem;
    border-radius: var(--mmm-radius);
    background: var(--mmm-surface);
    border-top: 3px solid var(--accent);
    opacity: 0.9;
  }
  .era.current { outline: 2px solid var(--mmm-gold); opacity: 1; }
  .era.unwritten {
    border-top-color: var(--mmm-text-dim);
    border-top-style: dashed;
    opacity: 0.45;
    display: flex;
    align-items: center;
    justify-content: center;
    font-style: italic;
  }
  .era.unwritten .era-title { font-size: 1.4rem; color: var(--mmm-text-dim); }
  .era-head { display: flex; flex-direction: column; gap: 0.1rem; }
  .era-title { font-weight: 700; color: var(--mmm-text); font-size: 0.82rem; }
  .era-years { font-size: 0.68rem; color: var(--mmm-text-dim); }
  .tag {
    align-self: flex-start;
    font-size: 0.58rem;
    text-transform: uppercase;
    color: var(--mmm-extrapolated);
  }
  .markers { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 0.4rem; min-height: 10px; }
  .marker { width: 7px; height: 7px; border-radius: 50%; background: var(--mmm-gold); }
  .now { color: var(--mmm-text-dim); font-size: 0.85rem; margin-top: 0.5rem; }
</style>
