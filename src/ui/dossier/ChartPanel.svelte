<script lang="ts">
/**
 * VD-3 — ChartPanel: renders a DossierChartSpec (years × named value lines) as a uPlot line chart, the same
 * primitive StatsView uses. Real sim-state data viz (NOT the hand-drawn-SVG-figure ban). Pure presentation.
 */
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import type { ChartSpec } from "../../sim/dossier/dossier";

interface Props {
  spec: ChartSpec;
}
const { spec }: Props = $props();

let el = $state<HTMLDivElement>();
let plot: uPlot | undefined;

// A small fixed line palette (brand-adjacent) so the legend reads; cycles if there are more lines.
const PALETTE = ["#d4af37", "#a4564d", "#6f7d8c", "#5d7a86", "#8c6f4d", "#b9c2da"];

$effect(() => {
  if (!el) return;
  const data: uPlot.AlignedData = [spec.years, ...spec.lines.map((l) => l.values)];
  const opts: uPlot.Options = {
    width: el.clientWidth || 340,
    height: 200,
    scales: { x: { time: false } },
    axes: [
      {
        stroke: "#b9c2da",
        grid: { stroke: "rgba(255,255,255,0.08)" },
        values: (_u, ticks) => ticks.map((t) => String(Math.round(t))),
      },
      { stroke: "#b9c2da", grid: { stroke: "rgba(255,255,255,0.08)" } },
    ],
    series: [
      { label: "Year", value: (_u, v) => (v == null ? "--" : String(Math.round(v))) },
      ...spec.lines.map((l, i) => ({
        label: l.label,
        stroke: PALETTE[i % PALETTE.length],
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

<figure class="chart-panel">
  <figcaption>{spec.title}</figcaption>
  <div class="plot" bind:this={el}></div>
</figure>

<style>
  .chart-panel {
    margin: 0;
  }
  figcaption {
    font-family: var(--mmm-font-display);
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mmm-text-dim);
    margin-bottom: 0.4rem;
  }
  .plot {
    width: 100%;
  }
</style>
