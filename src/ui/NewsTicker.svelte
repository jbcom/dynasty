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
}

const { content, gameState, perScope = 1, term = (t) => t }: Props = $props();

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

{#if news.length > 0}
  <section class="news" aria-label="World news">
    <h3>
      <img class="h-icon" src="/assets/icons/ui/news.svg" alt="" aria-hidden="true" />The Wider World — {gameState.year}
    </h3>
    <ul>
      {#each news as item (item.scope + item.headline)}
        <li>
          <span class="scope" data-scope={item.scope}>{scopeLabel[item.scope] ?? item.scope}</span>
          <span class="headline">{term(item.headline)}</span>
          <span class="year">{item.year}</span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

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
</style>
