<script lang="ts">
/**
 * VD-3 — MapPanel: renders a DossierMapSpec as a REACH strip — the line's journey across the era bands, lit
 * up to the era it has reached. A compact "where the line has travelled over the centuries" anchor (a light
 * companion to the full MapView). Pure presentation, Svelte+CSS data viz.
 */
import type { EraBand } from "../../sim/genai/portrait";
import type { MapSpec } from "../../sim/dossier/dossier";

interface Props {
  spec: MapSpec;
}
const { spec }: Props = $props();

// Short human labels for the era bands (the waypoints on the reach strip).
const ERA_LABEL: Record<EraBand, string> = {
  founding_1700s: "1776",
  federal_1800s: "1800s",
  industrial_late1800s: "Gilded",
  early_1900s: "1900s",
  midcentury: "Mid-C",
  digital_modern: "Modern",
  near_future: "Near",
  stellar: "Stars",
};
const ALL: EraBand[] = [
  "founding_1700s",
  "federal_1800s",
  "industrial_late1800s",
  "early_1900s",
  "midcentury",
  "digital_modern",
  "near_future",
  "stellar",
];
const reached = $derived(new Set(spec.reached));
</script>

<figure class="map-panel">
  <figcaption>{spec.title}</figcaption>
  <ol class="reach" aria-label="The line's reach across the eras">
    {#each ALL as band (band)}
      <li class="stop" class:lit={reached.has(band)} class:current={band === spec.current}>
        <span class="dot" aria-hidden="true"></span>
        <span class="label">{ERA_LABEL[band]}</span>
      </li>
    {/each}
  </ol>
</figure>

<style>
  .map-panel {
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
  .reach {
    display: flex;
    align-items: flex-start;
    gap: 0;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .stop {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }
  /* The connecting rail between waypoints. */
  .stop::before {
    content: "";
    position: absolute;
    top: 5px;
    left: -50%;
    width: 100%;
    height: 2px;
    background: color-mix(in srgb, var(--mmm-text-dim) 25%, transparent);
  }
  .stop:first-child::before {
    display: none;
  }
  .stop.lit::before {
    background: var(--mmm-gold-deep);
  }
  .dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--mmm-text-dim) 30%, transparent);
    border: 1px solid var(--mmm-text-dim);
    z-index: 1;
  }
  .stop.lit .dot {
    background: var(--mmm-gold-deep);
    border-color: var(--mmm-gold);
  }
  .stop.current .dot {
    background: var(--mmm-gold-bright);
    box-shadow: 0 0 8px color-mix(in srgb, var(--mmm-gold) 70%, transparent);
  }
  .label {
    margin-top: 0.3rem;
    font-family: var(--mmm-font-body);
    font-size: 0.6rem;
    color: var(--mmm-text-dim);
  }
  .stop.current .label {
    color: var(--mmm-gold-bright);
  }
</style>
