<script lang="ts">
import { isCritHigh, isCritLow, meterFraction } from "../sim/meters";
import type { MeterDef } from "../sim/schema";
import { formatMoney } from "./theme";

interface Props {
  def: MeterDef;
  value: number;
}

const { def, value }: Props = $props();

const fraction = $derived(meterFraction(def, value));
const crit = $derived(isCritLow(def, value) || isCritHigh(def, value));
const display = $derived(def.scale === "log" ? formatMoney(value) : `${Math.round(value)}`);

// SVG arc geometry (semicircle gauge).
const R = 34;
const CIRC = Math.PI * R; // half circumference
const dash = $derived(`${fraction * CIRC} ${CIRC}`);
</script>

<div class="gauge" class:crit data-meter={def.id} title={def.label}>
  <svg viewBox="0 0 80 50" width="72" height="45" aria-hidden="true">
    <path class="track" d="M6 44 A34 34 0 0 1 74 44" fill="none" stroke-width="7" />
    <path
      class="fill"
      d="M6 44 A34 34 0 0 1 74 44"
      fill="none"
      stroke-width="7"
      stroke-linecap="round"
      stroke-dasharray={dash}
      style={`stroke: var(--mmm-meter-${def.id});`}
    />
  </svg>
  <span class="icon" aria-hidden="true">{def.icon}</span>
  <span class="value">{display}</span>
  <span class="label">{def.label}</span>
</div>

<style>
  .gauge {
    display: grid;
    grid-template-rows: auto auto auto;
    justify-items: center;
    gap: 0.1rem;
    min-width: 4.5rem;
  }
  svg {
    display: block;
  }
  .track {
    stroke: color-mix(in srgb, var(--mmm-text-dim) 30%, transparent);
  }
  .fill {
    transition: stroke-dasharray var(--mmm-dur) var(--mmm-ease);
  }
  .icon {
    margin-top: -1.6rem;
    font-size: 1.1rem;
  }
  .value {
    font-weight: 700;
    font-size: 0.85rem;
    color: var(--mmm-text);
  }
  .label {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--mmm-text-dim);
  }
  .crit .value {
    color: var(--mmm-crit);
  }
  .crit .icon {
    animation: pulse 0.9s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      opacity: 0.45;
    }
  }
</style>
