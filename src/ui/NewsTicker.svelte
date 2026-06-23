<script lang="ts">
import type { Content } from "../sim/content";
import type { GameState } from "../sim/state";
import { branchOf } from "../sim/branch";
import { newsForYear, timelinesForBranch } from "../sim/worldtime";

interface Props {
  content: Content;
  gameState: GameState;
  /** How many headlines per scope to surface. */
  perScope?: number;
  /** Branch-aware term interpolation; identity by default (alt-history AH1). */
  term?: (text: string) => string;
  /** RIVAL-RACE-PRESENCE: dispatches about the rival lines near the player's station — a stumble (a window)
   *  or a surge past the player (pressure). Rendered above the world news so the race is felt in-run. */
  rivalNews?: Array<{ id: string; kind: "faltered" | "surged"; headline: string }>;
}

const { content, gameState, perScope = 1, term = (t) => t, rivalNews = [] }: Props = $props();

// Diegetic news from the four (or five) parallel world timelines — the wider
// world reported at the current in-world year.
const news = $derived(
  content.worldTimelines.length > 0
    ? newsForYear(
        timelinesForBranch(content.worldTimelines, branchOf(gameState)),
        gameState.year,
        perScope,
      )
    : [],
);

const scopeLabel: Record<string, string> = {
  manhattan: "NYC",
  eastcoast: "East Coast",
  westcoast: "West Coast",
  usa: "USA",
  world: "World",
  mores: "Society",
  religion: "Faith",
  science: "Science",
};
</script>

<section class="news" aria-label="World news">
  {#if rivalNews.length > 0}
    <!-- RIVAL-RACE-PRESENCE: the rival lines near your station — a stumble (a window) or a surge (pressure). -->
    <ul class="rival-news" data-testid="rival-news">
      {#each rivalNews as r (r.id + r.kind)}
        <li data-kind={r.kind}>
          <span class="rn-tag">{r.kind === "faltered" ? "Window" : "Pressure"}</span>
          <span class="headline">{r.headline}</span>
        </li>
      {/each}
    </ul>
  {/if}
  <h3>
    <img class="h-icon" src="/assets/icons/ui/news.svg" alt="" aria-hidden="true" />The Wider World — {gameState.year}
  </h3>
  {#if news.length > 0}
    <ul>
      {#each news as item (item.scope + item.headline)}
        <li>
          <span class="scope" data-scope={item.scope}>{scopeLabel[item.scope] ?? item.scope}</span>
          <span class="headline">{term(item.headline)}</span>
          <span class="year">{item.year}</span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="empty">The wider world is quiet for now — no dispatches reach you this year.</p>
  {/if}
</section>

<style>
  .news {
    padding: var(--mmm-pad);
  }
  h3 {
    margin: 0 0 0.5rem;
    color: var(--mmm-gold);
    font-family: var(--mmm-font-display);
    font-size: 0.95rem;
  }
  .empty {
    margin: 0;
    color: var(--mmm-text-dim);
    font-style: italic;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  li {
    display: grid;
    grid-template-columns: 5rem 1fr auto;
    gap: 0.5rem;
    align-items: baseline;
    padding: 0.4rem 0.5rem;
    background: var(--mmm-surface);
    border-left: 3px solid var(--mmm-gold-deep);
    border-radius: var(--mmm-radius);
    font-size: 0.8rem;
  }
  .scope {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--mmm-navy);
    background: var(--mmm-gold);
    padding: 0.1rem 0.35rem;
    border-radius: 999px;
    text-align: center;
  }
  .headline {
    color: var(--mmm-text);
    font-style: italic;
  }
  .year {
    color: var(--mmm-text-dim);
    font-weight: 700;
  }
  /* RIVAL-RACE-PRESENCE: dispatches about the rivals near your station, above the world news. */
  .rival-news {
    margin: 0 0 0.6rem;
  }
  .rival-news li {
    grid-template-columns: 4.5rem 1fr;
    border-left-color: var(--mmm-gold);
  }
  /* A stumble is an opportunity (gold); a surge past you is pressure (red). */
  .rival-news li[data-kind="surged"] {
    border-left-color: var(--mmm-red, #b22);
  }
  .rn-tag {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--mmm-navy);
    background: var(--mmm-gold);
    padding: 0.1rem 0.35rem;
    border-radius: 999px;
    text-align: center;
  }
  .rival-news li[data-kind="surged"] .rn-tag {
    background: var(--mmm-red, #b22);
    color: var(--mmm-text);
  }
</style>
