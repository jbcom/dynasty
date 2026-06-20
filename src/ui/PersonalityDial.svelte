<script lang="ts">
import {
  archetypeOf,
  perceptionGap,
  type Personality,
  spectrumLabel,
  tyrannyUtopiaAxis,
} from "../sim/personality";
import type { MoralPole } from "../sim/moralAxis";

interface Props {
  personality: Personality;
  /** Branch-relative resolved moral pole (from moralPoleOf). Optional — omit before the run is live. */
  pole?: MoralPole;
  /** Branch-relative label for the pole (from moralPoleLabel). Falls back to generic pole name. */
  poleLabel?: string;
}

const { personality, pole, poleLabel }: Props = $props();

const axis = $derived(tyrannyUtopiaAxis(personality)); // -100 utopian … +100 tyrannical
const label = $derived(spectrumLabel(personality));
const archetype = $derived(archetypeOf(personality));
const gap = $derived(perceptionGap(personality));

// Map the -100..100 axis onto a 0..100% needle position.
const needlePct = $derived(((axis + 100) / 200) * 100);

const archetypeLabel: Record<string, string> = {
  communist_visionary: "Communist Visionary",
  social_democrat: "Social Democrat",
  dealmaker: "Dealmaker",
  populist_strongman: "Populist Strongman",
  megalomaniac_king: "Megalomaniac King",
};
</script>

<section class="dial" data-axis={axis} aria-label="Personality — tyranny to utopia">
  <div class="track">
    <span class="pole left">Utopia</span>
    <div class="bar">
      <span class="needle" style={`left:${needlePct}%`}></span>
    </div>
    <span class="pole right">Tyranny</span>
  </div>
  <div class="readout">
    <span class="spectrum" data-band={label}>{label}</span>
    <span class="archetype">{archetypeLabel[archetype]}</span>
  </div>
  {#if pole}
    <div class="pole-badge" data-pole={pole} aria-label="Current moral pole: {poleLabel ?? pole}">
      <img class="pole-icon" src={`/assets/icons/ui/pole-${pole}.svg`} alt="" aria-hidden="true" />
      <span class="pole-name">{poleLabel ?? pole}</span>
    </div>
  {/if}
  {#if gap >= 50}
    <p class="delusion" title="The world sees one man; he sees another.">
      The world and the mirror disagree.
    </p>
  {/if}
</section>

<style>
  .dial {
    padding: 0.45rem var(--mmm-pad);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .track {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.4rem;
  }
  .pole {
    font-family: var(--mmm-font-body);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--mmm-text-dim);
  }
  .pole.left {
    color: var(--mmm-startrek);
  }
  .pole.right {
    color: var(--mmm-red);
  }
  .bar {
    position: relative;
    height: 8px;
    border-radius: 4px;
    /* utopia (left, cyan) → contested (gold) → tyranny (right, red) */
    background: linear-gradient(
      to right,
      var(--mmm-startrek),
      var(--mmm-gold) 50%,
      var(--mmm-red)
    );
  }
  .needle {
    position: absolute;
    top: -3px;
    width: 4px;
    height: 14px;
    border-radius: 2px;
    background: var(--mmm-text);
    box-shadow: 0 0 4px rgb(0 0 0 / 0.6);
    transform: translateX(-50%);
    transition: left var(--mmm-dur) var(--mmm-ease);
  }
  .readout {
    display: flex;
    justify-content: space-between;
    font-family: var(--mmm-font-body);
    font-size: 0.74rem;
  }
  .spectrum {
    font-weight: 700;
    color: var(--mmm-text);
  }
  .spectrum[data-band="Utopian"] {
    color: var(--mmm-startrek);
  }
  .spectrum[data-band="Tyrannical"] {
    color: var(--mmm-red);
  }
  .archetype {
    color: var(--mmm-gold);
  }
  .delusion {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-size: 0.7rem;
    font-style: italic;
    color: var(--mmm-extrapolated);
  }
  .pole-badge {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-family: var(--mmm-font-body);
    font-size: 0.72rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    width: fit-content;
    background: color-mix(in srgb, var(--mmm-surface) 70%, transparent);
    border: 1px solid currentcolor;
  }
  .pole-badge[data-pole="utopian"] {
    color: var(--mmm-startrek);
  }
  .pole-badge[data-pole="centrist"] {
    color: var(--mmm-gold);
  }
  .pole-badge[data-pole="dictatorial"] {
    color: var(--mmm-red);
  }
  .pole-icon {
    width: 14px;
    height: 14px;
    opacity: 0.9;
    /* Safe fallback: dim-text color for any unrecognised data-pole value.
       (#9eaabf approximation of --mmm-text-dim without a CSS var inside filter) */
    filter: invert(68%) sepia(8%) saturate(380%) hue-rotate(187deg) brightness(95%);
  }
  /* Tint pole icon to match the badge's pole color. */
  .pole-badge[data-pole="utopian"] .pole-icon {
    /* cyan #2fb6c9 */
    filter: invert(62%) sepia(52%) saturate(490%) hue-rotate(157deg) brightness(90%);
  }
  .pole-badge[data-pole="centrist"] .pole-icon {
    /* gold #d4af37 */
    filter: invert(72%) sepia(38%) saturate(680%) hue-rotate(2deg) brightness(92%);
  }
  .pole-badge[data-pole="dictatorial"] .pole-icon {
    /* red #b22234 */
    filter: invert(17%) sepia(72%) saturate(1800%) hue-rotate(336deg) brightness(80%);
  }
  .pole-name {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
</style>
