<script lang="ts">
import { eraBandForYear } from "../../sim/genai/portrait";
import { mapKey } from "../../sim/genai/mapArt";
import { macroActForYear, type MacroAct } from "../../sim/macroActs";
import type { GameState } from "../../sim/state";

/**
 * MAP VIEW (VL-3 + MAP-ERA-PROGRESS-RICHER) — the era-progressing JOURNEY visual. A generated
 * antique-engraving cartographic base (the signature style, [[visual-layer-revival]]) under an SVG
 * DATA-OVERLAY that shows the dynasty's progress founding→stars: a lit path along the four macro-acts,
 * the current era marked, the unreached future dimmed (Roadwarden fog / 80 Days journey). MAP-ERA-
 * PROGRESS-RICHER adds finer grain: the line's exact GENERATION (g0..g9) as a marker sliding along the
 * path, and the RIVAL lines' positions as faint dots on the same axis — so the convergence race is
 * legible, not just the four coarse waypoints. The base is GenAI raster; the overlay is data-viz, NOT
 * hand-drawn cartography — honoring the no-hand-drawn-SVG-art rule.
 */

interface Props {
  gameState: GameState;
  // MAP-FIELD-LINK: the map carries the SAME per-line state the Field dossier does (faltering / fallen), so a
  // line the player sees "fallen" in the dossier reads as eliminated on the map too — the two live surfaces agree.
  /** The whole convergence field — each rival line's standing (label + rung 0..MAX_RUNG). Optional so the
   *  component still renders from `gameState` alone (the journey is meaningful without the rivals). */
  rivalStandings?: Array<{
    id: string;
    label: string;
    rung: number;
    faltering?: boolean;
    fallen?: boolean;
  }>;
  /** The player's rung (generation depth, 0..MAX_RUNG) as the rival world measures it — to place the
   *  player on the SAME rung axis as the rivals for an apples-to-apples convergence readout. */
  playerRung?: number;
}
const { gameState, rivalStandings = [], playerRung }: Props = $props();

// The four macro-acts as journey waypoints, founding → the stars.
const STAGES: Array<{ act: MacroAct; label: string }> = [
  { act: "founding", label: "Founding" },
  { act: "convergence", label: "Convergence" },
  { act: "emergence", label: "Emergence" },
  { act: "ascension", label: "The Stars" },
];

// GA-MAP-ART: the cartographic base shifts with the ERA — a colonial chart at the founding becomes an
// industrial survey, a digital globe, a stellar star-chart as the line advances. The base for the current era
// is `map_<eraBand>.png`; if it isn't generated yet, onerror falls back to the founding base (which always
// exists), and failing that the CSS base shows. So the journey reads period-true without blocking on coverage.
const FOUNDING_BASE = "/assets/generated/map/founding-map.png";
const baseSrc = $derived(
  `/assets/generated/map/${mapKey(eraBandForYear(gameState.year)).replace(/:/g, "_")}.png`,
);

const current = $derived(macroActForYear(gameState.year));
const currentIdx = $derived(Math.max(0, STAGES.findIndex((s) => s.act === current)));
// Waypoint x-positions across the chart (left = founding, right = the stars).
const xs = [14, 38, 62, 88];
const y = 50;

// MAP-ERA-PROGRESS-RICHER: the line's exact GENERATION (g0..g9), read from the live family (the
// protagonist's generation depth). Defaults to 0 when no family is founded yet — the component still
// renders the coarse journey. The spine runs 10 generations (g0 founding → g9 the stars).
const SPINE_GENS = 10;
const generation = $derived.by(() => {
  const fam = gameState.family;
  const protagonist = fam?.members.find((m) => m.id === fam.protagonistId);
  return Math.min(protagonist?.generation ?? 0, SPINE_GENS - 1);
});
// Map a 0..9 generation onto the chart's left→right founding→stars axis (the same 14..88 span the
// macro-act waypoints use), so the generation marker slides between the coarse waypoints.
const genX = $derived(14 + (generation / (SPINE_GENS - 1)) * (88 - 14));

// Rival positions on the SAME axis, by rung (0..MAX_RUNG). Rung maps to the founding→stars span; the
// rivals cluster where they've reached, so a glance shows who is ahead. Sorted high→low for the readout.
const MAX_RUNG = 5;
const rivalDots = $derived(
  rivalStandings.map((r) => ({
    ...r,
    x: 14 + (Math.min(r.rung, MAX_RUNG) / MAX_RUNG) * (88 - 14),
  })),
);
// MAP-FIELD-LINK: a FALLEN line (dropped out) can't lead the convergence — exclude it, matching the dossier
// where a fallen line never reads as "leads you".
const leader = $derived.by(() => {
  const live = rivalStandings.filter((r) => !r.fallen);
  return live.length ? [...live].sort((a, b) => b.rung - a.rung)[0] : null;
});
</script>

<section class="map" aria-label="The dynasty's journey">
  <h3>The Journey — {gameState.year}</h3>
  <div class="chart">
    <img
      class="base"
      src={baseSrc}
      alt=""
      aria-hidden="true"
      decoding="async"
      data-testid="map-base"
      onerror={(e) => {
        // The era base isn't generated — fall back to the founding base once, then hide (the CSS base shows).
        const img = e.currentTarget as HTMLImageElement;
        if (!img.src.endsWith("founding-map.png")) {
          img.src = FOUNDING_BASE;
        } else {
          img.style.display = "none";
        }
      }}
    />
    <!-- Data-overlay: the lit route to here, the current waypoint, the dimmed future. -->
    <svg class="route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <!-- the full path (dim), then the traversed portion (lit) -->
      <polyline
        points={xs.map((x) => `${x},${y}`).join(" ")}
        class="path-dim"
      />
      <polyline
        points={xs.slice(0, currentIdx + 1).map((x) => `${x},${y}`).join(" ")}
        class="path-lit"
      />
      {#each STAGES as s, i (s.act)}
        <circle
          class="waypoint"
          cx={xs[i]}
          cy={y}
          r={i === currentIdx ? 2.6 : 1.8}
          class:reached={i <= currentIdx}
          class:here={i === currentIdx}
        />
      {/each}
      <!-- MAP-ERA-PROGRESS-RICHER: faint rival markers on the founding→stars axis (who's ahead). -->
      {#each rivalDots as r (r.id)}
        <!-- MAP-FIELD-LINK: a fallen line reads eliminated (dim X-marked), a faltering one dimmer — the same
             states the Field dossier shows, so the two live surfaces never contradict. -->
        <circle
          class="rival"
          cx={r.x}
          cy={y - 4.5}
          r="1.1"
          data-rival={r.id}
          data-fallen={r.fallen ? "true" : "false"}
          data-faltering={r.faltering ? "true" : "false"}
        />
      {/each}
      <!-- the player's exact generation, sliding between the coarse waypoints. -->
      <circle class="gen-marker" cx={genX} cy={y} r="1.5" />
    </svg>
    <div class="labels">
      {#each STAGES as s, i (s.act)}
        <span class="stage" class:reached={i <= currentIdx} class:here={i === currentIdx} style="left:{xs[i]}%">
          {s.label}
        </span>
      {/each}
    </div>
  </div>
  <p class="caption">
    {#if currentIdx >= STAGES.length - 1}
      The line has reached the stars.
    {:else}
      The {STAGES[currentIdx]?.label} of the line — {STAGES.length - 1 - currentIdx} stage{STAGES.length - 1 - currentIdx === 1 ? "" : "s"} from the stars.
    {/if}
    <span class="gen-note">Generation {generation + 1} of {SPINE_GENS}.</span>
    {#if leader && playerRung !== undefined && leader.rung > playerRung}
      <span class="rival-note">{leader.label} leads the convergence.</span>
    {/if}
  </p>
</section>

<style>
  .map {
    padding: var(--mmm-pad);
  }
  h3 {
    margin: 0 0 0.6rem;
    font-family: var(--mmm-font-display);
    color: var(--mmm-gold);
    font-size: 0.95rem;
  }
  .chart {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border-radius: var(--mmm-radius);
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 45%, transparent);
  }
  .base {
    width: 100%;
    height: 100%;
    object-fit: cover;
    /* Dim the chart slightly so the route overlay reads on top. */
    filter: brightness(0.88) saturate(0.9);
  }
  .route {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .path-dim {
    fill: none;
    stroke: color-mix(in srgb, var(--mmm-ink, #1a1208) 50%, transparent);
    stroke-width: 0.7;
    stroke-dasharray: 2 1.5;
  }
  .path-lit {
    fill: none;
    stroke: var(--mmm-gold);
    stroke-width: 1.1;
    filter: drop-shadow(0 0 1px var(--mmm-gold));
  }
  circle {
    fill: color-mix(in srgb, var(--mmm-ink, #1a1208) 60%, var(--mmm-parchment, #e8dcc0));
    stroke: var(--mmm-gold-deep);
    stroke-width: 0.4;
  }
  circle.reached {
    fill: var(--mmm-gold-deep);
  }
  circle.here {
    fill: var(--mmm-gold);
    stroke: var(--mmm-gold);
  }
  /* MAP-ERA-PROGRESS-RICHER markers. */
  circle.gen-marker {
    fill: var(--mmm-red, #b22);
    stroke: var(--mmm-parchment, #e8dcc0);
    stroke-width: 0.4;
    filter: drop-shadow(0 0 1.2px var(--mmm-red, #b22));
  }
  circle.rival {
    fill: color-mix(in srgb, var(--mmm-text-dim, #888) 70%, transparent);
    stroke: none;
    opacity: 0.7;
  }
  /* MAP-FIELD-LINK: a faltering line reads dimmer; a fallen (dropped-out) line is barely-there — eliminated,
     matching the Field dossier's struck/dim register so the two live surfaces agree at a glance. */
  circle.rival[data-faltering="true"] {
    opacity: 0.4;
  }
  circle.rival[data-fallen="true"] {
    opacity: 0.18;
    fill: var(--mmm-text-dim, #888);
  }
  .labels {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .stage {
    position: absolute;
    top: calc(50% + 4%);
    transform: translateX(-50%);
    font-family: var(--mmm-font-ui);
    font-size: 0.6rem;
    letter-spacing: 0.04em;
    color: color-mix(in srgb, var(--mmm-text) 55%, transparent);
    text-shadow: 0 1px 2px rgb(0 0 0 / 0.7);
    white-space: nowrap;
  }
  .stage.reached {
    color: var(--mmm-text);
  }
  .stage.here {
    color: var(--mmm-gold);
    font-weight: 700;
  }
  .caption {
    margin: 0.6rem 0 0;
    font-family: var(--mmm-font-body);
    font-style: italic;
    font-size: 0.85rem;
    color: var(--mmm-text-dim);
  }
  .gen-note {
    display: block;
    margin-top: 0.2rem;
    font-style: normal;
    font-family: var(--mmm-font-ui);
    font-size: 0.72rem;
    letter-spacing: 0.03em;
    color: color-mix(in srgb, var(--mmm-red, #b22) 80%, var(--mmm-text));
  }
  .rival-note {
    display: block;
    font-style: normal;
    font-family: var(--mmm-font-ui);
    font-size: 0.72rem;
    color: var(--mmm-text-dim);
  }
</style>
