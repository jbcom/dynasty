<script lang="ts">
import type { LedgerEntry } from "../sim/state";
import { type GraphLink, type GraphNode, layoutButterfly } from "./butterflyLayout";

interface Props {
  ledger: LedgerEntry[];
  size?: number;
}

const { ledger, size = 360 }: Props = $props();
const layout = $derived(layoutButterfly(ledger, size, size));

function nodeXY(n: GraphNode): { x: number; y: number } {
  return { x: n.x ?? size / 2, y: n.y ?? size / 2 };
}

// d3-force's forceLink replaces link.source/target string ids with node object
// references; accept either form when resolving an endpoint.
function endpointId(end: GraphLink["source"]): string {
  return typeof end === "object" ? (end as GraphNode).id : String(end);
}
</script>

<div class="graph-wrap" data-empty={layout.nodes.length === 0}>
  {#if layout.nodes.length === 0}
    <p class="empty">The web of consequence is still empty.</p>
  {:else}
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Butterfly cause and effect graph">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--mmm-gold-deep)" />
        </marker>
      </defs>
      {#each layout.links as link, i (i)}
        {@const s = layout.nodes.find((n) => n.id === endpointId(link.source))}
        {@const t = layout.nodes.find((n) => n.id === endpointId(link.target))}
        {#if s && t}
          <line
            x1={nodeXY(s).x}
            y1={nodeXY(s).y}
            x2={nodeXY(t).x}
            y2={nodeXY(t).y}
            stroke="var(--mmm-gold-deep)"
            stroke-width="1.5"
            marker-end="url(#arrow)"
          />
        {/if}
      {/each}
      {#each layout.nodes as node (node.id)}
        {@const p = nodeXY(node)}
        <g transform={`translate(${p.x} ${p.y})`} class={node.kind}>
          <circle r="7" />
          <text x="10" y="4">{node.label}</text>
        </g>
      {/each}
    </svg>
  {/if}
</div>

<style>
  .graph-wrap {
    display: flex;
    justify-content: center;
    padding: var(--mmm-pad);
  }
  .empty {
    color: var(--mmm-text-dim);
    font-style: italic;
  }
  text {
    fill: var(--mmm-text);
    font-size: 0.62rem;
  }
  .cause circle {
    fill: var(--mmm-gold);
  }
  .effect circle {
    fill: var(--mmm-extrapolated);
  }
</style>
