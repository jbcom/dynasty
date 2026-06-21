<script lang="ts">
import type { Content } from "../../sim/content";
import type { Ending } from "../../sim/schema";
import { spectrumLabel } from "../../sim/personality";
import { branchOf } from "../../sim/branch";
import { moralPoleLabel, moralPoleOf } from "../../sim/moralAxis";
import { applyTerms, runTerms } from "../../sim/terms";
import type { EndState, GameState } from "../../sim/state";
import ButterflyGraph from "../ButterflyGraph.svelte";
import { formatMoney } from "../theme";

interface Props {
  content: Content;
  state: GameState;
  end: EndState;
  onRestart: () => void;
}

const { content, state, end, onRestart }: Props = $props();

// Look up the authored ending that fired for its title + tier (drives copy/art).
const ending = $derived<Ending | undefined>(
  content.endings.find((e) => e.id === end.endingId),
);
// Fallback titles by kind for built-in/no-endingId terminal states.
const KIND_TITLE: Record<string, string> = {
  victory: "Total Victory",
  death: "The End of an Era",
  coup: "Toppled",
};
const resolvedTerms = $derived(runTerms(content.terms, branchOf(state), state));
const term = $derived((text: string) => applyTerms(text, resolvedTerms));
const title = $derived(term(ending?.title ?? KIND_TITLE[end.kind] ?? "The End"));
const tier = $derived(ending?.tier ?? (end.kind === "victory" ? "endgame-good" : "endgame-bad"));
const isApex = $derived(tier === "apex");
// The moral pole, named in the branch's OWN value system — so the outcome is
// interrogated on its own terms (a Reich "utopia" is monstrous-but-coherent).
const pole = $derived(moralPoleOf(state));
const poleLabel = $derived(moralPoleLabel(state));
</script>

<main class="report" data-end={end.kind} data-tier={tier} class:apex={isApex}>
  {#if isApex}<p class="apex-kicker">★ Apex Ending ★</p>{/if}
  <h1>{title}</h1>
  <p class="reason">{term(end.reason)}</p>
  <p class="pole" data-pole={pole}>You ended in <strong>{poleLabel}</strong>.</p>
  <p class="year">Final year: {end.year} · {spectrumLabel(state.personality)}</p>

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
  .report[data-tier="endgame-good"] h1 {
    color: var(--mmm-gold-bright);
    text-shadow: var(--mmm-shadow-gold);
  }
  .report[data-tier="endgame-bad"] h1,
  .report[data-tier="early-bad"] h1 {
    color: var(--mmm-red);
  }
  /* The apex (benevolent First Contact / warp gift) gets the grandest treatment. */
  .report.apex {
    background: radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--mmm-startrek) 22%, transparent), transparent 60%);
  }
  .report.apex h1 {
    color: var(--mmm-startrek);
    text-shadow: 0 0 18px color-mix(in srgb, var(--mmm-startrek) 70%, transparent);
    font-size: 2.4rem;
  }
  .apex-kicker {
    margin: 0;
    color: var(--mmm-gold-bright);
    letter-spacing: 0.3em;
    font-size: 0.7rem;
  }
  .reason {
    color: var(--mmm-text);
    font-size: 1.05rem;
  }
  .pole {
    color: var(--mmm-text-dim);
    font-style: italic;
  }
  .pole[data-pole="utopian"] strong {
    color: var(--mmm-startrek, #3bd6c6);
  }
  .pole[data-pole="dictatorial"] strong {
    color: var(--mmm-red);
  }
  .pole[data-pole="centrist"] strong {
    color: var(--mmm-gold);
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
