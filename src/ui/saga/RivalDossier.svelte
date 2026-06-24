<script lang="ts">
import { humanizeRivalLabel } from "../../sim/dynastyWorld";
import {
  type EraBand,
  encounterPortraitKey,
  rivalEncounterFacets,
} from "../../sim/genai/portrait";
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
  /** GA-ENCOUNTER-PORTRAITS: the current era band, so each rival line gets an era-true "head" portrait.
   *  Optional — without it the field still renders (the portrait is enrichment, not load-bearing). */
  eraBand?: EraBand;
}
const { standings, playerRung, eraBand }: Props = $props();

// GA-ENCOUNTER-PORTRAITS: the encounter-portrait asset path for a rival line's head (era × line identity), or
// null when no era band is supplied. `:` → `_` maps the composite key to the cached portrait file.
function rivalHeadSrc(rivalId: string): string | null {
  if (!eraBand) return null;
  const key = encounterPortraitKey(rivalEncounterFacets(rivalId, eraBand));
  return `/assets/generated/portraits/${key.replace(/:/g, "_")}.png`;
}

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
          {#if !r.isPlayer && rivalHeadSrc(r.id)}
            <!-- GA-ENCOUNTER-PORTRAITS: the rival line's era-true head; hides on error (ungenerated → no head,
                 the row still reads). aria-hidden — the name beside it is the accessible label. -->
            <img
              class="head"
              src={rivalHeadSrc(r.id)}
              alt=""
              aria-hidden="true"
              decoding="async"
              data-testid="rival-head"
              onerror={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          {/if}
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
{:else}
  <!-- DOSSIER-EMPTY-VOICE: early game, no near-vantage lines yet — a grace note, not a blank panel, mirroring
       the finale's SHOCK-LEDGER-EMPTY-VOICE. The race exists; the other lines just haven't surfaced yet. -->
  <section class="dossier" data-testid="rival-dossier-empty">
    <h3 class="dossier-title">The Field — the race toward the stars</h3>
    <p class="field-empty">The other lines are still finding their feet — the race has yet to take shape.</p>
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
  /* DOSSIER-EMPTY-VOICE: the early-game grace note — a quiet line, not a blank panel. */
  .field-empty {
    margin: 0.3rem 0 0;
    font-family: var(--mmm-font-body);
    font-style: italic;
    font-size: 0.85rem;
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
  /* GA-ENCOUNTER-PORTRAITS: the rival head sits in the first column beside the name (which stays the label).
     A small circular era-true bust; if it errors it hides and the name column simply reads alone. */
  .row:has(.head) {
    grid-template-columns: 1.7rem calc(8rem - 2.3rem) 1fr auto;
  }
  .head {
    width: 1.7rem;
    height: 1.7rem;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 50%, transparent);
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
