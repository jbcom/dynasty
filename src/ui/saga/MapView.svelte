<script lang="ts">
import { macroActForYear, type MacroAct } from "../../sim/macroActs";
import type { GameState } from "../../sim/state";

/**
 * MAP VIEW (VL-3) — the era-progressing JOURNEY visual. A generated antique-engraving cartographic base
 * (the signature style, [[visual-layer-revival]]) under an SVG DATA-OVERLAY that shows the dynasty's
 * progress founding→stars: a lit path along the four macro-acts, the current era marked, the unreached
 * future dimmed (Roadwarden fog / 80 Days journey). The base is GenAI raster; the overlay is data-viz
 * (nodes/route/fog), NOT hand-drawn cartography — honoring the no-hand-drawn-SVG-art rule.
 */

interface Props {
  gameState: GameState;
}
const { gameState }: Props = $props();

// The four macro-acts as journey waypoints, founding → the stars.
const STAGES: Array<{ act: MacroAct; label: string }> = [
  { act: "founding", label: "Founding" },
  { act: "convergence", label: "Convergence" },
  { act: "emergence", label: "Emergence" },
  { act: "ascension", label: "The Stars" },
];

const current = $derived(macroActForYear(gameState.year));
const currentIdx = $derived(Math.max(0, STAGES.findIndex((s) => s.act === current)));
// Waypoint x-positions across the chart (left = founding, right = the stars).
const xs = [14, 38, 62, 88];
const y = 50;
</script>

<section class="map" aria-label="The dynasty's journey">
  <h3>The Journey — {gameState.year}</h3>
  <div class="chart">
    <img class="base" src="/assets/generated/map/founding-map.png" alt="" aria-hidden="true" decoding="async" />
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
          cx={xs[i]}
          cy={y}
          r={i === currentIdx ? 2.6 : 1.8}
          class:reached={i <= currentIdx}
          class:here={i === currentIdx}
        />
      {/each}
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
</style>
