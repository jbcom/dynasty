<script lang="ts">
import { humanizeRivalLabel } from "../sim/dynastyWorld";
import { shockLedger } from "../sim/sagaShock";
import type { Content } from "../sim/content";
import type { GameState } from "../sim/state";

interface Props {
  content: Content;
  gameState: GameState;
  /** CONVERGENCE-FIELD-IN-TIMELINE: the whole rival field (label + rung + faltering), so the player can
   *  track the race mid-run, not just at the close. Omitted (unfounded / no world) → the strip hides. */
  rivalStandings?: Array<{ id: string; label: string; rung: number; faltering: boolean }>;
  /** The player's own rung, to render the field RELATIVE to the played line. */
  playerRung?: number;
}

const { content, gameState, rivalStandings = [], playerRung = 0 }: Props = $props();

// DOSSIER-SHOCK-LEDGER: the line's disasters across the run, parsed from the shock:* flags — a "what
// befell the family" log so the player can review the hard seasons (deaths, reversals) over the hour.
const ledger = $derived(shockLedger(gameState.flags));

// CONVERGENCE-FIELD-IN-TIMELINE: the field, sorted high→low with the player's own line slotted in by rung,
// so the in-run Timeline shows where every line stands in the race (ahead/level/behind), not just the close.
const RUNG_MAX = 5;
const field = $derived(
  [
    { id: "you", name: "Your line", rung: playerRung, faltering: false, isPlayer: true },
    ...rivalStandings.map((r) => ({
      id: r.id,
      name: humanizeRivalLabel(r.label),
      rung: r.rung,
      faltering: r.faltering,
      isPlayer: false,
    })),
  ].sort((a, b) => b.rung - a.rung || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)),
);

// Hand-rolled lightweight timeline. It shows the LINE'S OWN path: from the era it was
// founded in through the current one — never the global era list. A modern line founded
// in Origins (1885) must not show the deep-history Caliphate era it never lived (PL-7).
// The future is NOT spoiled: only eras reached so far, plus a single "the road ahead is
// unwritten" teaser if more eras remain.
const foundingIndex = $derived(
  Math.max(
    0,
    content.eras.findIndex((e) => e.id === gameState.founding?.era),
  ),
);
const revealed = $derived(
  content.eras.filter((_, i) => i >= foundingIndex && i <= gameState.eraIndex),
);
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
        class:current={foundingIndex + i === gameState.eraIndex}
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
  <p class="now">You are in {content.eras[gameState.eraIndex]?.title ?? "—"}, {gameState.year}.</p>
  {#if ledger.length > 0}
    <!-- DOSSIER-SHOCK-LEDGER: the line's disasters, in order — the family's hard seasons. -->
    <div class="ledger" data-testid="shock-ledger">
      <h4>What Befell the Family</h4>
      <ul>
        {#each ledger as entry (entry.year + entry.kind)}
          <li data-shock-kind={entry.kind}>
            <span class="ledger-year">{entry.year}</span>
            <span class="ledger-label">{entry.label}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
  {#if rivalStandings.length > 0}
    <!-- CONVERGENCE-FIELD-IN-TIMELINE: where every line stands in the race, mid-run — a rung bar per line. -->
    <div class="field" data-testid="convergence-field">
      <h4>The Field</h4>
      <ul>
        {#each field as line (line.id)}
          <li data-player={line.isPlayer} data-faltering={line.faltering}>
            <span class="field-name">{line.name}</span>
            <span class="field-bar" aria-hidden="true">
              <span class="field-fill" style={`width: ${Math.round((line.rung / RUNG_MAX) * 100)}%`}></span>
            </span>
            <span class="field-rung">{line.rung}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
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
  .era-years {
    font-family: var(--mmm-font-ui);
    font-size: 0.66rem;
    color: var(--mmm-text-dim);
    font-variant-numeric: tabular-nums;
  }
  .tag {
    align-self: flex-start;
    font-size: 0.58rem;
    text-transform: uppercase;
    color: var(--mmm-extrapolated);
  }
  .markers { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 0.4rem; min-height: 10px; }
  .marker { width: 7px; height: 7px; border-radius: 50%; background: var(--mmm-gold); }
  .now { color: var(--mmm-text-dim); font-size: 0.85rem; margin-top: 0.5rem; }
  .ledger { margin-top: 0.8rem; }
  .ledger h4 {
    margin: 0 0 0.4rem;
    font-family: var(--mmm-font-display);
    color: var(--mmm-gold);
    font-size: 0.85rem;
  }
  .ledger ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.25rem; }
  .ledger li {
    display: flex;
    gap: 0.6rem;
    align-items: baseline;
    font-family: var(--mmm-font-body);
    font-size: 0.82rem;
    color: var(--mmm-text);
    border-left: 2px solid var(--mmm-red, #b22);
    padding-left: 0.5rem;
  }
  /* SHOCK-LEDGER-RECOVERIES: a comeback reads as a GOLD line, distinct from the red disaster — the log
     shows blow → recover, not just loss. */
  .ledger li[data-shock-kind="recovery"] {
    border-left-color: var(--mmm-gold);
  }
  .ledger-year {
    font-family: var(--mmm-font-ui);
    font-variant-numeric: tabular-nums;
    color: var(--mmm-text-dim);
    font-size: 0.72rem;
  }
  /* CONVERGENCE-FIELD-IN-TIMELINE: the race readout — a rung bar per line, the player's own highlighted. */
  .field { margin-top: 0.8rem; }
  .field h4 {
    margin: 0 0 0.4rem;
    font-family: var(--mmm-font-display);
    color: var(--mmm-gold);
    font-size: 0.85rem;
  }
  .field ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.3rem; }
  .field li {
    display: grid;
    grid-template-columns: 7rem 1fr 1.2rem;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.78rem;
  }
  .field-name {
    color: var(--mmm-text-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* The player's own line is named in gold + bold so "where am I" reads at a glance. */
  .field li[data-player="true"] .field-name {
    color: var(--mmm-gold);
    font-weight: 700;
  }
  .field-bar {
    height: 8px;
    background: var(--mmm-surface);
    border-radius: 999px;
    overflow: hidden;
  }
  .field-fill {
    display: block;
    height: 100%;
    background: var(--mmm-gold-deep);
    border-radius: 999px;
  }
  .field li[data-player="true"] .field-fill { background: var(--mmm-gold); }
  /* A faltering rival's bar reads in the loss register. */
  .field li[data-faltering="true"] .field-fill { background: var(--mmm-red, #b22); }
  .field-rung {
    font-family: var(--mmm-font-ui);
    font-variant-numeric: tabular-nums;
    color: var(--mmm-text-dim);
    text-align: right;
  }
</style>
