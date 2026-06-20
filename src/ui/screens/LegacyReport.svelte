<script lang="ts">
import type { EndState, GameState } from "../../sim/state";
import ButterflyGraph from "../ButterflyGraph.svelte";
import { formatMoney } from "../theme";

interface Props {
  state: GameState;
  end: EndState;
  onRestart: () => void;
}

const { state, end, onRestart }: Props = $props();

const headline: Record<EndState["kind"], string> = {
  death: "The End of an Era",
  coup: "Toppled",
  victory: "Total Victory",
};
</script>

<main class="report" data-end={end.kind}>
  <h1>{headline[end.kind]}</h1>
  <p class="reason">{end.reason}</p>
  <p class="year">Final year: {end.year}</p>

  <dl class="stats">
    <div><dt>Net worth</dt><dd>{formatMoney(state.meters.money)}</dd></div>
    <div><dt>Power</dt><dd>{Math.round(state.meters.power)}</dd></div>
    <div><dt>Reputation</dt><dd>{Math.round(state.meters.reputation)}</dd></div>
    <div><dt>Decisions made</dt><dd>{state.history.length}</dd></div>
  </dl>

  <h2>The chain of consequence</h2>
  <ButterflyGraph ledger={state.ledger} size={320} />

  <button class="primary" type="button" onclick={onRestart}>Play Again</button>
</main>

<style>
  .report {
    max-width: 34rem;
    margin: 0 auto;
    padding: var(--mmm-pad);
    text-align: center;
  }
  h1 {
    font-family: var(--mmm-font-display);
    color: var(--mmm-gold);
    margin: 0.5rem 0 0.25rem;
  }
  .report[data-end="victory"] h1 {
    color: var(--mmm-gold-bright);
    text-shadow: var(--mmm-shadow-gold);
  }
  .report[data-end="death"] h1,
  .report[data-end="coup"] h1 {
    color: var(--mmm-red);
  }
  .reason {
    color: var(--mmm-text);
    font-size: 1.05rem;
  }
  .year {
    color: var(--mmm-text-dim);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin: 1rem 0;
  }
  .stats div {
    background: var(--mmm-surface);
    border-radius: var(--mmm-radius);
    padding: 0.6rem;
  }
  dt {
    font-size: 0.72rem;
    text-transform: uppercase;
    color: var(--mmm-text-dim);
  }
  dd {
    margin: 0.2rem 0 0;
    font-weight: 700;
    font-size: 1.2rem;
    color: var(--mmm-text);
  }
  h2 {
    font-family: var(--mmm-font-display);
    color: var(--mmm-gold);
    font-size: 1.1rem;
  }
  .primary {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: var(--mmm-gold);
    color: var(--mmm-ink);
    border: none;
    border-radius: var(--mmm-radius);
    font-weight: 700;
    cursor: pointer;
  }
</style>
