<script lang="ts">
/**
 * VD-3 — GraphPanel: renders a DossierGraphSpec as a radial NETWORK (the player at center, rivals around,
 * sized by rung, fallen lines dimmed). Adapts the ButterflyGraph SVG pattern. Pure presentation — the spec
 * comes from the pure buildDossier selector. Data viz (NOT the hand-drawn-SVG-figure ban).
 */
import type { GraphSpec } from "../../sim/dossier/dossier";

interface Props {
  spec: GraphSpec;
}
const { spec }: Props = $props();

const SIZE = 240;
const C = SIZE / 2;

// Lay the player at the center; the rivals evenly around a ring, radius scaled so the field reads.
const layout = $derived.by(() => {
  const you = spec.nodes.find((n) => n.you);
  const rivals = spec.nodes.filter((n) => !n.you);
  const ring = rivals.map((n, i) => {
    // Deterministic angular placement (i / count) — no Math.random (replay-stable presentation).
    const angle = (i / Math.max(1, rivals.length)) * Math.PI * 2 - Math.PI / 2;
    const r = SIZE * 0.34;
    return { ...n, x: C + Math.cos(angle) * r, y: C + Math.sin(angle) * r };
  });
  return { you: you ? { ...you, x: C, y: C } : null, ring };
});

/** Node radius scaled by rung (weight 0..5) so standing reads at a glance. */
function nodeR(weight: number): number {
  return 6 + weight * 2.2;
}
</script>

<figure class="graph-panel">
  <figcaption>{spec.title}</figcaption>
  <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${spec.title}: the rival field`}>
    {#each layout.ring as r (r.id)}
      {#if layout.you}
        <!-- a tie from the player to each rival line; opposing/contributing styling is future (VD-7). -->
        <line x1={layout.you.x} y1={layout.you.y} x2={r.x} y2={r.y} class="tie" class:fallen={r.fallen} />
      {/if}
    {/each}
    {#each layout.ring as r (r.id)}
      <g transform={`translate(${r.x} ${r.y})`} class="node" class:fallen={r.fallen}>
        <circle r={nodeR(r.weight)} />
        <text y="3">{r.label}</text>
      </g>
    {/each}
    {#if layout.you}
      <g transform={`translate(${layout.you.x} ${layout.you.y})`} class="node you">
        <circle r={nodeR(layout.you.weight)} />
        <text y="3">You</text>
      </g>
    {/if}
  </svg>
</figure>

<style>
  .graph-panel {
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
  svg {
    width: 100%;
    height: auto;
    max-width: 16rem;
  }
  .tie {
    stroke: color-mix(in srgb, var(--mmm-gold-deep) 50%, transparent);
    stroke-width: 1;
  }
  .tie.fallen {
    stroke: color-mix(in srgb, var(--mmm-text-dim) 30%, transparent);
    stroke-dasharray: 2 3;
  }
  .node circle {
    fill: color-mix(in srgb, var(--mmm-navy-light) 80%, var(--mmm-gold-deep));
    stroke: var(--mmm-gold-deep);
    stroke-width: 1;
  }
  .node.you circle {
    fill: var(--mmm-gold);
    stroke: var(--mmm-gold-bright);
  }
  .node.fallen circle {
    fill: color-mix(in srgb, var(--mmm-navy) 70%, transparent);
    stroke: var(--mmm-text-dim);
    opacity: 0.6;
  }
  .node text {
    fill: var(--mmm-text);
    font-family: var(--mmm-font-body);
    font-size: 0.5rem;
    text-anchor: middle;
    transform: translateY(1.1rem);
  }
  .node.you text {
    fill: var(--mmm-navy-deep);
    font-weight: 700;
    transform: translateY(0);
  }
</style>
