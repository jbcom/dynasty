<script lang="ts">
import type { Content } from "../../sim/content";
import type { ConvergenceEnding } from "../../sim/convergence";
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
  /** The dynastic CONVERGENCE ending (toward the stars / contributed / earthbound / extinguished). */
  convergence?: ConvergenceEnding | null;
  onRestart: () => void;
}

const { content, state, end, convergence = null, onRestart }: Props = $props();

/** How the line's century-spanning arc finally read — the dynastic framing above the per-run end. */
const CONVERGENCE_LABEL: Record<string, string> = {
  stars: "Your line reached the stars",
  contributed: "Your line helped humanity reach the stars",
  earthbound: "Your line remained earthbound",
  extinguished: "Your line was extinguished",
};

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

// THE DYNASTY (PL-9): this is a saga about a LINE, not one life — so the legacy report
// celebrates the family that was built. Generations reached, souls born into the line, and
// the span of years from the founding to this ending. Null for an unfounded fixture run.
const dynasty = $derived.by(() => {
  const fam = state.family;
  if (!fam || fam.members.length === 0) return null;
  // reduce (not Math.max(...spread)) — a long millennium run can build a large family, and
  // spreading a big array into Math.max/min risks a call-stack overflow (gemini review).
  let topGen = 0;
  let firstBorn = Number.POSITIVE_INFINITY;
  for (const m of fam.members) {
    if (m.generation > topGen) topGen = m.generation;
    if (m.born < firstBorn) firstBorn = m.born;
  }
  const span = Math.max(0, end.year - firstBorn);
  const houseName = fam.members[0]?.surname ?? "—";
  return { generations: topGen + 1, members: fam.members.length, span, houseName };
});
</script>

<main class="report" data-end={end.kind} data-tier={tier} class:apex={isApex}>
  {#if convergence}
    <!-- The dynastic CONVERGENCE framing: how the line's century-spanning arc finally read. -->
    <p class="convergence" data-destination={convergence.destination} data-testid="convergence">
      {CONVERGENCE_LABEL[convergence.destination] ?? convergence.title} — <strong>{term(convergence.title)}</strong>
    </p>
  {/if}
  {#if isApex}<p class="apex-kicker">★ Apex Ending ★</p>{/if}
  <h1>{title}</h1>
  <p class="reason">{term(end.reason)}</p>
  <p class="pole" data-pole={pole}>You ended in <strong>{poleLabel}</strong>.</p>
  <p class="year">Final year: {end.year} · {spectrumLabel(state.personality)}</p>

  {#if dynasty}
    <p class="dynasty">
      The House of <strong>{dynasty.houseName}</strong> endured
      <strong>{dynasty.span}</strong> years across
      <strong>{dynasty.generations}</strong>
      {dynasty.generations === 1 ? "generation" : "generations"} —
      <strong>{dynasty.members}</strong>
      {dynasty.members === 1 ? "soul" : "souls"} born into the line.
    </p>
  {/if}

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
  .convergence {
    margin: 0 0 0.4rem;
    font-family: var(--mmm-font-display);
    font-size: 0.9rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--mmm-text-dim);
  }
  .convergence[data-destination="stars"] strong {
    color: var(--mmm-gold-bright);
  }
  .convergence[data-destination="extinguished"] {
    color: color-mix(in srgb, #c0504d 70%, var(--mmm-text-dim));
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
  /* The dynastic epitaph (PL-9): the saga's whole point — the line, not the life. */
  .dynasty {
    margin: 0.75rem auto 0;
    max-width: 30rem;
    font-family: var(--mmm-font-body);
    font-size: 1rem;
    line-height: 1.55;
    color: var(--mmm-text);
    border-top: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 50%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 50%, transparent);
    padding: 0.6rem 0;
  }
  .dynasty strong {
    color: var(--mmm-gold);
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
