<script lang="ts">
import type { Content } from "../../sim/content";
import type { ConvergenceEnding } from "../../sim/convergence";
import type { Ending } from "../../sim/schema";
import { spectrumLabel } from "../../sim/personality";
import { branchOf } from "../../sim/branch";
import { moralPoleLabel, moralPoleOf } from "../../sim/moralAxis";
import { applyTerms, runTerms } from "../../sim/terms";
import { humanizeRivalLabel } from "../../sim/dynastyWorld";
import { shockLedger } from "../../sim/sagaShock";
import type { EndState, GameState } from "../../sim/state";
import ButterflyGraph from "../ButterflyGraph.svelte";
import { formatMoney } from "../theme";
import { onMount } from "svelte";
import { playEndingSting } from "../sound";

interface Props {
  content: Content;
  state: GameState;
  end: EndState;
  /** The dynastic CONVERGENCE ending (toward the stars / contributed / earthbound / extinguished). */
  convergence?: ConvergenceEnding | null;
  /** CONVERGENCE-RIVAL-FINALE: the whole field's final standings — every rival line that raced alongside,
   *  so the close reads as the field's reckoning, not just the player's. */
  rivalStandings?: Array<{
    id: string;
    label: string;
    rung: number;
    faltering: boolean;
    // FALLEN-NEWS-IN-ENDING: a line that dropped OUT of the race entirely (isFallen) gets a distinct finale
    // fate, set apart from a line that merely finished low or faltering. Optional so older callers still type.
    fallen?: boolean;
  }>;
  onRestart: () => void;
}

const { content, state, end, convergence = null, rivalStandings = [], onRestart }: Props = $props();

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

// CONVERGENCE-RIVAL-FINALE: the rivals that raced alongside get their own reckoning at the close — each
// line's final station + a one-line fate, so the ending reads as the whole field's, not just the player's.
// The fate is read off the rival's final rung (relative to the 0..MAX ladder), whether it dropped out of the
// race entirely (FALLEN-NEWS-IN-ENDING — a line written off, the in-run "Eliminated" dispatch paid off here),
// and whether it merely ended faltering.
const RIVAL_MAX_RUNG = 5; // the convergence rung ladder height (classRung MAX_RUNG)
function rivalFate(rung: number, faltering: boolean, fallen: boolean): string {
  // A dropped-out line is set apart from one that merely finished low or stumbled at the last.
  if (fallen) return "dropped out of the race entirely, its line spent";
  if (faltering) return "faltered at the last, its climb broken";
  if (rung >= RIVAL_MAX_RUNG) return "reached the stars in its own right";
  if (rung >= RIVAL_MAX_RUNG - 1) return "rose high, a power among the lines";
  if (rung >= 2) return "made its mark, then settled";
  return "never rose far from where it began";
}
// Sorted high→low already (the engine sorts standings); render every line so the field's whole arc shows.
const rivals = $derived(
  rivalStandings.map((r) => ({
    id: r.id,
    name: humanizeRivalLabel(r.label),
    rung: r.rung,
    fate: rivalFate(r.rung, r.faltering, r.fallen ?? false),
    faltering: r.faltering,
    fallen: r.fallen ?? false,
  })),
);

// LEDGER-IN-LEGACY-REPORT: the line's hard seasons + comebacks, gathered for the final reckoning. The
// in-run Timeline shows this log live; the close shows it WHOLE — every disaster and recovery the line
// lived through, so the finale reflects the trials, not just the verdict. Empty for a shock-free run.
const ledger = $derived(shockLedger(state.flags));

// AGENCY-IN-LEGACY: tally what the PLAYER actively DID across the run from the side-logs — rivals pressed
// (state.presses), recoveries invested (state.recoveryInvests). The close credits these interventions in a
// "By Your Own Hand" line, distinct from the field/luck. Each count omitted from the line when zero.
// Grammatical list-join: "a" → "a"; "a, b" → "a and b"; "a, b, c" → "a, b, and c" (Oxford comma at 3+).
function joinClauses(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}
const agency = $derived.by(() => {
  const pressed = state.presses?.length ?? 0;
  const invested = state.recoveryInvests?.length ?? 0;
  const parts: string[] = [];
  if (pressed > 0) parts.push(`pressed ${pressed} faltering ${pressed === 1 ? "rival" : "rivals"}`);
  if (invested > 0)
    parts.push(`forced ${invested} ${invested === 1 ? "recovery" : "recoveries"} with your own resources`);
  return parts;
});

// A one-shot ending sting coloured by the convergence outcome, fired once when the report mounts
// (audio-gated + fully guarded inside playEndingSting). The saga's close gets an audible punctuation.
onMount(() => {
  playEndingSting(convergence?.destination ?? "earthbound");
});
</script>

<main class="report" data-end={end.kind} data-tier={tier} class:apex={isApex}>
  {#if convergence}
    <!-- The dynastic CONVERGENCE framing: how the line's century-spanning arc finally read. -->
    <p class="convergence" data-destination={convergence.destination} data-testid="convergence">
      {CONVERGENCE_LABEL[convergence.destination] ?? convergence.title} — <strong>{term(convergence.title)}</strong>
    </p>
    <!-- CONVERGENCE-ENDING-DEPTH: the earned finale, narrated — the century-spanning arc resolved in prose. -->
    {#if convergence.prose}
      <p class="convergence-prose" data-testid="convergence-prose">{term(convergence.prose)}</p>
    {/if}
    <!-- RIVAL-FATE-IN-CONVERGENCE-ENDING: how the field ended relative to you — the race's result, in a coda. -->
    {#if convergence.rivalEpilogue}
      <p class="rival-epilogue" data-testid="rival-epilogue">{term(convergence.rivalEpilogue)}</p>
    {/if}
  {/if}
  {#if isApex}<p class="apex-kicker">★ Apex Ending ★</p>{/if}
  <h1>{title}</h1>
  <p class="reason">{term(end.reason)}</p>
  <p class="pole" data-pole={pole}>You ended in <strong>{poleLabel}</strong>.</p>
  <p class="year">Final year: {end.year} · {spectrumLabel(state.personality)}</p>

  {#if rivals.length > 0}
    <!-- CONVERGENCE-RIVAL-FINALE: the field's reckoning — every line that raced alongside, and how it ended. -->
    <section class="rival-finale" data-testid="rival-finale">
      <h2>The Other Lines</h2>
      <ul>
        {#each rivals as r (r.id)}
          <!-- FALLEN-NEWS-IN-ENDING: a dropped-out line reads struck-through, set apart from a faltering one. -->
          <li data-faltering={r.faltering} data-fallen={r.fallen}>
            <span class="rf-name">{r.name}</span>
            <span class="rf-fate">{r.fate}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

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

  {#if ledger.length > 0}
    <!-- LEDGER-IN-LEGACY-REPORT: the whole saga's trials — every disaster (red) and comeback (gold). -->
    <section class="hard-seasons" data-testid="legacy-ledger">
      <h2>The Family's Hard Seasons</h2>
      <ul>
        {#each ledger as entry (entry.year + entry.kind)}
          <li data-shock-kind={entry.kind}>
            <span class="ls-year">{entry.year}</span>
            <span class="ls-label">{entry.label}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if agency.length > 0}
    <!-- AGENCY-IN-LEGACY: what the player actively DID — the interventions that bent the saga by hand. -->
    <p class="agency" data-testid="agency">
      <strong>By your own hand:</strong> you {joinClauses(agency)}.
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
  .convergence-prose {
    margin: 0 auto 0.8rem;
    max-width: 56ch;
    font-family: var(--mmm-font-body);
    font-style: italic;
    font-size: 1rem;
    line-height: 1.55;
    color: var(--mmm-text);
  }
  /* RIVAL-FATE-IN-CONVERGENCE-ENDING: the field coda — quieter than the finale prose, the race's last word. */
  .rival-epilogue {
    margin: 0 auto 0.8rem;
    max-width: 52ch;
    font-family: var(--mmm-font-body);
    font-size: 0.9rem;
    line-height: 1.5;
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
  /* CONVERGENCE-RIVAL-FINALE: the field's reckoning — the other lines and their fates. */
  .rival-finale {
    margin: 1rem auto 0;
    max-width: 30rem;
    text-align: left;
  }
  .rival-finale ul {
    list-style: none;
    margin: 0.4rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .rival-finale li {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    font-family: var(--mmm-font-body);
    font-size: 0.9rem;
    border-left: 2px solid color-mix(in srgb, var(--mmm-gold-deep) 60%, transparent);
    padding-left: 0.5rem;
  }
  /* A line that faltered at the close reads in the loss register. */
  .rival-finale li[data-faltering="true"] {
    border-left-color: var(--mmm-red, #b22);
  }
  /* FALLEN-NEWS-IN-ENDING: a line that dropped OUT of the race entirely reads dim + struck — out of contention,
     set apart from one that merely stumbled at the last. Takes visual precedence over the faltering register. */
  .rival-finale li[data-fallen="true"] {
    border-left-color: var(--mmm-text-dim);
    opacity: 0.7;
  }
  .rival-finale li[data-fallen="true"] .rf-name {
    text-decoration: line-through;
    text-decoration-color: var(--mmm-text-dim);
    color: var(--mmm-text-dim);
  }
  .rf-name {
    font-weight: 700;
    color: var(--mmm-gold);
  }
  .rf-fate {
    color: var(--mmm-text-dim);
    font-style: italic;
    font-size: 0.82rem;
  }
  /* AGENCY-IN-LEGACY: the player's own interventions — credited in gold, the active counterpart to the ledger. */
  .agency {
    margin: 0.8rem auto 0;
    max-width: 30rem;
    text-align: left;
    font-family: var(--mmm-font-body);
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--mmm-text);
  }
  .agency strong {
    color: var(--mmm-gold);
  }
  /* LEDGER-IN-LEGACY-REPORT: the line's trials, mirroring the in-run Timeline ledger voice. */
  .hard-seasons {
    margin: 1rem auto 0;
    max-width: 30rem;
    text-align: left;
  }
  .hard-seasons ul {
    list-style: none;
    margin: 0.4rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .hard-seasons li {
    display: flex;
    gap: 0.6rem;
    align-items: baseline;
    font-family: var(--mmm-font-body);
    font-size: 0.9rem;
    color: var(--mmm-text);
    border-left: 2px solid var(--mmm-red, #b22);
    padding-left: 0.5rem;
  }
  .hard-seasons li[data-shock-kind="recovery"] {
    border-left-color: var(--mmm-gold);
  }
  .ls-year {
    font-family: var(--mmm-font-ui);
    font-variant-numeric: tabular-nums;
    color: var(--mmm-text-dim);
    font-size: 0.78rem;
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
