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
    /* Tighter than the global gap (PL-5): the two gauge rows sat far apart, pushing the
       event card ~39% down the viewport. A small column gap + a snug row gap claws back
       vertical budget for the content without crowding the arcs. */
    column-gap: var(--mmm-gap);
    row-gap: 0.35rem;
    padding: 0.4rem var(--mmm-pad);
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
