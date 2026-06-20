<script lang="ts">
import type { Content } from "../sim/content";
import type { GameState } from "../sim/state";
import { resolveCurrency } from "../sim/systemic";
import { formatMoneyIn } from "./theme";

interface Props {
  content: Content;
  gameState: GameState;
}

const { content, gameState }: Props = $props();

// The active currency relabels net worth (reichsmark/rand/marscrip/…).
const currency = $derived(resolveCurrency(content, gameState));

// Live markets the player is exposed to, with index + regime + position.
const markets = $derived(
  content.markets.map((m) => ({
    def: m,
    state: gameState.markets[m.id],
  })),
);

// Rank ladders: current rung label + whether the player is below their peak.
const ranks = $derived(
  content.ranks.map((r) => {
    const rs = gameState.ranks[r.id];
    const rung = rs?.rung ?? 0;
    return {
      def: r,
      label: r.rungs[Math.min(rung, r.rungs.length - 1)] ?? "—",
      fallen: rs ? rs.rung < rs.peak : false,
    };
  }),
);

function regimeTone(regime: string | undefined): string {
  if (!regime) return "neutral";
  if (/boom|bull|hot|viral|pump|carry/.test(regime)) return "up";
  if (/bust|crash|slump|rug|backlash|tarnished|decompression/.test(regime)) return "down";
  return "neutral";
}
</script>

<section class="markets" aria-label="Markets and ranks">
  <header>
    <h3>💹 Markets</h3>
    <span class="currency">Denominated in {currency.name} ({currency.symbol})</span>
  </header>

  {#if markets.length === 0}
    <p class="empty">No markets are live yet.</p>
  {:else}
    <ul class="market-list">
      {#each markets as m (m.def.id)}
        <li data-tone={regimeTone(m.state?.regime)}>
          <span class="name">{m.def.label}</span>
          <span class="regime">{m.state?.regime ?? "—"}</span>
          <span class="index">{Math.round(m.state?.index ?? m.def.baseIndex)}</span>
          {#if m.state && m.state.holding !== 0}
            <span class="position" class:short={m.state.holding < 0}>
              {m.state.holding > 0 ? "LONG" : "SHORT"}
              {#if m.state.leverage > 1}·{m.state.leverage}×{/if}
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if ranks.length > 0}
    <h3>🪜 Standing</h3>
    <ul class="rank-list">
      {#each ranks as r (r.def.id)}
        <li class:fallen={r.fallen}>
          <span class="rank-label">{r.def.label}</span>
          <span class="rung">{r.label}{#if r.fallen} ▼{/if}</span>
        </li>
      {/each}
    </ul>
  {/if}

  <p class="net-worth">Net worth: {formatMoneyIn(gameState.meters.money, currency.symbol)}</p>
</section>

<style>
  .markets {
    padding: var(--mmm-pad);
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  h3 {
    margin: 0.75rem 0 0.4rem;
    color: var(--mmm-gold);
    font-family: var(--mmm-font-display);
    font-size: 0.95rem;
  }
  .currency {
    font-size: 0.7rem;
    color: var(--mmm-text-dim);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .market-list li {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 0.5rem;
    align-items: baseline;
    padding: 0.35rem 0.5rem;
    background: var(--mmm-surface);
    border-left: 3px solid var(--mmm-gold-deep);
    border-radius: var(--mmm-radius);
    font-size: 0.8rem;
  }
  .market-list li[data-tone="up"] {
    border-left-color: var(--mmm-startrek, #3bd6c6);
  }
  .market-list li[data-tone="down"] {
    border-left-color: var(--mmm-red);
  }
  .name {
    color: var(--mmm-text);
    font-weight: 700;
  }
  .regime {
    color: var(--mmm-text-dim);
    font-style: italic;
    font-size: 0.7rem;
  }
  .index {
    color: var(--mmm-gold);
    font-variant-numeric: tabular-nums;
  }
  .position {
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--mmm-navy);
    background: var(--mmm-startrek, #3bd6c6);
    padding: 0.1rem 0.3rem;
    border-radius: 999px;
  }
  .position.short {
    background: var(--mmm-red);
    color: var(--mmm-text);
  }
  .rank-list li {
    display: flex;
    justify-content: space-between;
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
  }
  .rank-list li.fallen .rung {
    color: var(--mmm-red);
  }
  .rank-label {
    color: var(--mmm-text-dim);
  }
  .rung {
    color: var(--mmm-text);
    font-weight: 700;
  }
  .net-worth {
    margin-top: 0.75rem;
    color: var(--mmm-gold);
    font-weight: 700;
  }
  .empty {
    color: var(--mmm-text-dim);
    font-style: italic;
  }
</style>
