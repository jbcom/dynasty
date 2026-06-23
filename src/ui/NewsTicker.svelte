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
  rivalNews?: Array<{ id: string; kind: "faltered" | "surged" | "fallen"; headline: string }>;
  /** RIVAL-CROSSING-EXPLOIT: press a faltering rival (deepen its stumble for a heat cost). When provided, a
   *  "Press the advantage" button shows on each faltered dispatch. Omitted (e.g. visual fixtures) → no button. */
  onPress?: (rivalId: string) => void;
}

const { content, gameState, perScope = 1, term = (t) => t, rivalNews = [], onPress }: Props =
  $props();

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

// RIVAL-CROSSING-EXPLOIT: rivals already pressed THIS history step — their press button hides (one press per
// step, mirroring the engine's exploit guard) so the action doesn't read as still-available after it's spent.
const pressedThisStep = $derived(
  new Set(
    (gameState.presses ?? [])
      .filter((p) => p.at === gameState.history.length)
      .map((p) => p.rivalId),
  ),
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
          <!-- FALLEN-NEWS: a fallen line reads "Eliminated" — a major field event, distinct from a stumble
               (Window) or a surge (Pressure). -->
          <span class="rn-tag"
            >{r.kind === "faltered" ? "Window" : r.kind === "surged" ? "Pressure" : "Eliminated"}</span
          >
          <span class="headline">{r.headline}</span>
          {#if r.kind === "faltered" && onPress && !pressedThisStep.has(r.id)}
            <!-- RIVAL-CROSSING-EXPLOIT: press the advantage — deepen the stumble for a heat cost. Hidden once
                 pressed this step (one press per step, matching the engine's exploit guard). -->
            <button type="button" class="rn-press" onclick={() => onPress?.(r.id)}>
              Press the advantage
            </button>
          {/if}
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
    grid-template-columns: 4.5rem 1fr auto;
    border-left-color: var(--mmm-gold);
  }
  /* RIVAL-CROSSING-EXPLOIT: the press action — a small gold button on a faltered (window) dispatch. */
  .rn-press {
    grid-column: 2 / -1;
    justify-self: start;
    margin-top: 0.25rem;
    padding: 0.2rem 0.6rem;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--mmm-ink);
    background: var(--mmm-gold);
    border: none;
    border-radius: var(--mmm-radius);
    cursor: pointer;
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
  /* FALLEN-NEWS: a line dropping out of the race reads dim + struck — out of contention, not a live threat. */
  .rival-news li[data-kind="fallen"] {
    border-left-color: var(--mmm-text-dim);
    opacity: 0.8;
  }
  .rival-news li[data-kind="fallen"] .headline {
    text-decoration: line-through;
    text-decoration-color: var(--mmm-text-dim);
  }
  .rival-news li[data-kind="fallen"] .rn-tag {
    background: var(--mmm-text-dim);
    color: var(--mmm-surface);
  }
</style>
