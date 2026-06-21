<script lang="ts">
import type { Meters } from "../sim/meters";
import type { MeterDef } from "../sim/schema";
import MeterGauge from "./MeterGauge.svelte";

interface Props {
  defs: MeterDef[];
  meters: Meters;
}

const { defs, meters }: Props = $props();
</script>

<div class="hud" role="group" aria-label="Status meters">
  {#each defs as def (def.id)}
    <MeterGauge {def} value={meters[def.id]} />
  {/each}
</div>

<style>
  /* An EVEN grid so no meter is orphaned (flex-wrap left Heat alone on a second row on
     phones). 3 columns on narrow screens — six meters read as a tidy 3×2 — widening to
     all-six-across once there's room. justify-items:center keeps each gauge centered in
     its cell, and the grid is centered as a whole. */
  .hud {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    justify-items: center;
    align-items: start;
    gap: var(--mmm-gap);
    padding: 0.6rem var(--mmm-pad);
    background: color-mix(in srgb, var(--mmm-surface) 88%, black);
    border-bottom: 1px solid var(--mmm-gold-deep);
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
  }
  @media (min-width: 34rem) {
    .hud {
      grid-template-columns: repeat(6, 1fr);
    }
  }
</style>
