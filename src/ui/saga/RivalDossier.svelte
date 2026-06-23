<script lang="ts">
import { humanizeRivalLabel } from "../../sim/dynastyWorld";
import RungStars from "./RungStars.svelte";
/**
 * RIVAL-DOSSIER-TAB — a fuller "The Field" panel than the compact slide-out RivalField: every rival line
 * with its humanized place, rung (relative to the player), and a state badge (FALTERING / SURGING / steady),
 * sorted high→low with the player's own line slotted in. For a player tracking the convergence race closely.
 * Pure presentation — reads the standings the engine already derives.
 */
interface Standing {
  id: string;
  label: string;
  rung: number;
  faltering: boolean;
  trend: "rising" | "steady" | "falling";
  fallen: boolean;
}
interface Props {
  standings: Standing[];
  /** The player's own rung, so each rival's state reads RELATIVE to the played line. */
  playerRung: number;
}
const { standings, playerRung }: Props = $props();

type State = "fallen" | "faltering" | "surging" | "steady" | "you";
const field = $derived(
  [
    {
      id: "you",
      name: "Your line",
      rung: playerRung,
      state: "you" as State,
      trend: "steady" as const,
      isPlayer: true,
    },
    ...standings.map((s) => ({
      id: s.id,
      name: humanizeRivalLabel(s.label),
      rung: s.rung,
      // DEAD-LINE-IN-FIELD: a fallen line (stuck at the floor) reads "fallen" — out of the race — taking
      // precedence over faltering/surging. Else: faltering (mid-setback) > surging (above you) > steady.
      state: (s.fallen
        ? "fallen"
        : s.faltering
          ? "faltering"
          : s.rung > playerRung
            ? "surging"
            : "steady") as State,
      // RIVAL-RUNG-TREND: the momentum arrow (rising/steady/falling) beside the rung.
      trend: s.trend,
      isPlayer: false,
    })),
  ].sort(
    (a, b) => b.rung - a.rung || (a.isPlayer ? -1 : b.isPlayer ? 1 : a.name.localeCompare(b.name)),
  ),
);

// CONVERGENCE-FIELD-SUMMARY-LINE: a one-line "state of the race" — how many rivals lead the player, and how
// many have fallen out — so the player gets the gestalt before reading the rows. Derived from the standings.
const summary = $derived.by(() => {
  const ahead = standings.filter((s) => !s.fallen && s.rung > playerRung).length;
  const fallen = standings.filter((s) => s.fallen).length;
  const lead = ahead === 0 ? "You lead the field." : `${ahead} ${ahead === 1 ? "line leads" : "lines lead"} you.`;
  const thinned = fallen > 0 ? ` ${fallen} ${fallen === 1 ? "line has" : "lines have"} fallen out.` : "";
  return lead + thinned;
});

const STATE_LABEL: Record<State, string> = {
  fallen: "Fallen",
  faltering: "Faltering",
  surging: "Surging",
  steady: "Holding",
  you: "You",
};

// RIVAL-RUNG-TREND: a momentum arrow beside the rung (rising / steady / falling).
const TREND_ARROW: Record<"rising" | "steady" | "falling", string> = {
  rising: "▲",
  steady: "—",
  falling: "▼",
};
</script>

{#if standings.length}
  <section class="dossier" data-testid="rival-dossier">
    <h3 class="dossier-title">The Field — the race toward the stars</h3>
    <!-- CONVERGENCE-FIELD-SUMMARY-LINE: the state of the race at a glance, before the per-line rows. -->
    <p class="field-summary" data-testid="field-summary">{summary}</p>
    <ul class="rows">
      {#each field as r (r.id)}
        <li class="row" class:you={r.isPlayer} data-state={r.state}>
          <span class="who">{r.name}</span>
          <span class="rung-line">
            <RungStars rung={r.rung} />
            {#if !r.isPlayer}
              <span class="trend" data-trend={r.trend} title={r.trend}>{TREND_ARROW[r.trend]}</span>
            {/if}
          </span>
          <span class="state" data-state={r.state}>{STATE_LABEL[r.state]}</span>
        </li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .dossier {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: var(--mmm-pad);
  }
  .dossier-title {
    margin: 0;
    font-family: var(--mmm-font-display);
    color: var(--mmm-gold);
    font-size: 0.95rem;
  }
  /* CONVERGENCE-FIELD-SUMMARY-LINE: the at-a-glance race state, beneath the title. */
  .field-summary {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-style: italic;
    font-size: 0.82rem;
    color: var(--mmm-text-dim);
  }
  .rows {
    list-style: none;
    margin: 0.3rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .row {
    display: grid;
    grid-template-columns: 8rem 1fr auto;
    align-items: center;
    gap: 0.6rem;
    padding: 0.3rem 0.5rem;
    border-radius: var(--mmm-radius);
    background: var(--mmm-surface);
    font-family: var(--mmm-font-body);
    font-size: 0.9rem;
  }
  .row.you {
    outline: 1px solid var(--mmm-gold-deep);
  }
  .row.you .who {
    color: var(--mmm-gold-bright);
    font-weight: 700;
  }
  /* DEAD-LINE-IN-FIELD: a fallen line reads dimmed + struck — out of the race. */
  .row[data-state="fallen"] {
    opacity: 0.55;
  }
  .row[data-state="fallen"] .who {
    text-decoration: line-through;
  }
  .who {
    color: var(--mmm-text);
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rung-line {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  /* RIVAL-RUNG-TREND: a rising line reads gold, a falling one red, steady dim. */
  .trend {
    font-size: 0.7rem;
  }
  .trend[data-trend="rising"] {
    color: var(--mmm-gold);
  }
  .trend[data-trend="falling"] {
    color: var(--mmm-red, #b22);
  }
  .trend[data-trend="steady"] {
    color: var(--mmm-text-dim);
  }
  .state {
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--mmm-text-dim);
    text-align: right;
  }
  /* A faltering rival is a window (gold); a surging one is pressure (red); you are highlighted. */
  .state[data-state="faltering"] {
    color: var(--mmm-gold);
  }
  .state[data-state="surging"] {
    color: var(--mmm-red, #b22);
  }
  .state[data-state="you"] {
    color: var(--mmm-gold-bright);
  }
  .state[data-state="fallen"] {
    color: var(--mmm-text-dim);
  }
</style>
