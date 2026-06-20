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
  .hud {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--mmm-gap);
    padding: 0.6rem var(--mmm-pad);
    background: color-mix(in srgb, var(--mmm-surface) 88%, black);
    border-bottom: 1px solid var(--mmm-gold-deep);
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
  }
</style>
