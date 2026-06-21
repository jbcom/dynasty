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

// DELTA FEEDBACK (PL-2): flash a +N/-N badge when the value moves after a choice, so the
// cause→effect of a beat is legible on the gauge. A log-scale meter (money) formats the
// delta with the money formatter; linear meters show the rounded point change. The badge
// keys off `seq` so the CSS animation restarts on every change (even same magnitude).
// `prev` starts undefined so the first render (mount) establishes a baseline without
// flashing a spurious delta.
let prev: number | undefined;
let badge = $state<{ text: string; up: boolean; seq: number } | null>(null);
let seq = 0;
$effect(() => {
  const current = value;
  const last = prev;
  prev = current;
  if (last === undefined || current === last) return;
  const delta = current - last;
  const up = delta > 0;
  const sign = up ? "+" : "−";
  const mag = def.scale === "log" ? formatMoney(Math.abs(delta)) : `${Math.round(Math.abs(delta))}`;
  // Suppress a badge whose displayed magnitude rounds to nothing (a sub-unit drift
  // shows as a spurious "−0"); the change is real but not worth flashing.
  if (mag === "0" || mag === "$0") return;
  seq += 1;
  badge = { text: `${sign}${mag}`, up, seq };
});
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
  <img
    class="icon"
    src={`/assets/icons/${def.id}.svg`}
    alt=""
    aria-hidden="true"
    width="22"
    height="22"
    decoding="async"
  />
  <span class="value">{display}</span>
  <span class="label">{def.label}</span>
  {#if badge}
    {#key badge.seq}
      <span class="delta" class:up={badge.up} class:down={!badge.up} aria-hidden="true"
        >{badge.text}</span
      >
    {/key}
  {/if}
</div>

<style>
  .gauge {
    display: grid;
    grid-template-rows: auto auto auto;
    justify-items: center;
    gap: 0.1rem;
    min-width: 4.5rem;
    /* Icon overlaps the arc via absolute positioning — relative context needed. */
    position: relative;
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
    /* Positioned over the arc midpoint — avoids the Firefox grid margin-top bug. */
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    width: 22px;
    height: 22px;
    object-fit: contain;
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.5));
  }
  .value {
    font-family: var(--mmm-font-display);
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--mmm-text);
  }
  .label {
    font-family: var(--mmm-font-body);
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
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
  /* Delta badge (PL-2): floats up and fades over the gauge when the value changes. */
  .delta {
    position: absolute;
    top: -0.2rem;
    left: 50%;
    font-family: var(--mmm-font-display);
    font-weight: 700;
    font-size: 0.8rem;
    white-space: nowrap;
    pointer-events: none;
    text-shadow: 0 1px 3px rgb(0 0 0 / 0.7);
    animation: delta-float 1.1s var(--mmm-ease) forwards;
  }
  .delta.up {
    color: var(--mmm-gold-bright);
  }
  .delta.down {
    color: var(--mmm-crit);
  }
  @keyframes delta-float {
    0% {
      opacity: 0;
      transform: translate(-50%, 0.3rem);
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -0.9rem);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .delta {
      animation-duration: 0.01ms;
    }
  }
</style>
