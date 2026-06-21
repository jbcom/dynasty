<script lang="ts">
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { Content } from "../sim/content";
import type { GameState } from "../sim/state";
import { buildMeterSeries } from "./statsSeries";
import { formatMoney } from "./theme";

interface Props {
  content: Content;
  gameState: GameState;
}

const { content, gameState }: Props = $props();
const series = $derived(buildMeterSeries(content, gameState));

let el: HTMLDivElement | undefined = $state();
let plot: uPlot | undefined;

// Meters drawn on the 0–100 axis (money is shown separately as text — its log
// scale doesn't share the linear axis cleanly).
const LINEAR: Array<keyof typeof series.byMeter> = [
  "power",
  "reputation",
  "loyalty",
  "health",
  "heat",
];

function colorFor(id: string): string {
  if (typeof document === "undefined") return "#ccc";
  return getComputedStyle(document.documentElement).getPropertyValue(`--mmm-meter-${id}`).trim() || "#ccc";
}

// The proper display label for a meter id (Title Case) — the chart legend should read
// "Power/Reputation/…", not the lowercase machine ids (PL-12), consistent with the rest of
// the UI. Falls back to the id if a def is missing. A plain function (not $derived): the
// $effect that calls it already tracks `content` reactively (Svelte 5 — review).
function labelFor(id: string): string {
  return content.meters.find((m) => m.id === id)?.label ?? id;
}

$effect(() => {
  if (!el) return;
  const data: uPlot.AlignedData = [
    series.years,
    ...LINEAR.map((id) => series.byMeter[id]),
  ];
  const opts: uPlot.Options = {
    width: el.clientWidth || 340,
    height: 220,
    scales: { x: { time: false }, y: { range: [-100, 100] } },
    axes: [
      {
        stroke: "#b9c2da",
        grid: { stroke: "rgba(255,255,255,0.08)" },
        // Years are plain integers — no thousands separator ("1890", not "1,890").
        values: (_u, ticks) => ticks.map((t) => String(Math.round(t))),
      },
      { stroke: "#b9c2da", grid: { stroke: "rgba(255,255,255,0.08)" } },
    ],
    series: [
      { label: "Year", value: (_u, v) => (v == null ? "--" : String(Math.round(v))) },
      ...LINEAR.map((id) => ({
        label: labelFor(id),
        stroke: colorFor(id),
        width: 2,
      })),
    ],
  };
  plot?.destroy();
  plot = new uPlot(opts, data, el);
  return () => {
    plot?.destroy();
    plot = undefined;
  };
});
</script>

<section class="stats" aria-label="Statistics over time">
  <h3>Trajectory</h3>
  <div class="chart" bind:this={el}></div>
  <p class="note">Net worth: {formatMoney(series.byMeter.money.at(-1) ?? 0)}</p>
</section>

<style>
  .stats { padding: var(--mmm-pad); }
  h3 { color: var(--mmm-gold); font-family: var(--mmm-font-display); margin: 0 0 0.5rem; }
  .chart { width: 100%; }
  .note { color: var(--mmm-text-dim); font-size: 0.85rem; }
</style>
