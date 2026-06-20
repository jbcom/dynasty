<script lang="ts">
import { meterFraction } from "../sim/meters";
import type { MeterDef } from "../sim/schema";
import type { GameState } from "../sim/state";
import { formatMoney } from "./theme";

interface Props {
  defs: MeterDef[];
  gameState: GameState;
}

const { defs, gameState }: Props = $props();
const flags = $derived([...gameState.flags].sort());
</script>

<section class="dossier" aria-label="Dossier">
  <h3>Dossier — {gameState.year}</h3>

  <ul class="meters">
    {#each defs as def (def.id)}
      <li>
        <span class="icon">{def.icon}</span>
        <span class="name">{def.label}</span>
        <span class="val">
          {def.scale === "log" ? formatMoney(gameState.meters[def.id]) : Math.round(gameState.meters[def.id])}
        </span>
        <span class="bar"><i style={`width:${meterFraction(def, gameState.meters[def.id]) * 100}%; background:var(--mmm-meter-${def.id})`}></i></span>
      </li>
    {/each}
  </ul>

  <h4>Flags ({flags.length})</h4>
  {#if flags.length === 0}
    <p class="empty">No notable flags yet.</p>
  {:else}
    <div class="flags">
      {#each flags as flag (flag)}<span class="chip">{flag}</span>{/each}
    </div>
  {/if}
</section>

<style>
  .dossier { padding: var(--mmm-pad); }
  h3, h4 { color: var(--mmm-gold); font-family: var(--mmm-font-display); margin: 0 0 0.5rem; }
  h4 { margin-top: 1rem; font-size: 0.95rem; }
  .meters { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .meters li {
    display: grid;
    grid-template-columns: 1.4rem 1fr auto;
    grid-template-areas: "icon name val" "bar bar bar";
    align-items: center;
    gap: 0.2rem 0.5rem;
  }
  .icon { grid-area: icon; }
  .name { grid-area: name; color: var(--mmm-text); }
  .val { grid-area: val; font-weight: 700; color: var(--mmm-text); }
  .bar { grid-area: bar; height: 5px; background: color-mix(in srgb, var(--mmm-text-dim) 25%, transparent); border-radius: 3px; overflow: hidden; }
  .bar i { display: block; height: 100%; }
  .empty { color: var(--mmm-text-dim); font-style: italic; }
  .flags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .chip {
    font-size: 0.72rem;
    padding: 0.15rem 0.5rem;
    background: var(--mmm-surface);
    border: 1px solid var(--mmm-gold-deep);
    border-radius: 999px;
    color: var(--mmm-text-dim);
  }
</style>
