<script lang="ts">
import {
  archetypeOf,
  perceptionGap,
  type Personality,
  spectrumLabel,
  tyrannyUtopiaAxis,
} from "../sim/personality";

interface Props {
  personality: Personality;
}

const { personality }: Props = $props();

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
  {#if gap >= 50}
    <p class="delusion" title="The world sees one man; he sees another.">
      The world and the mirror disagree.
    </p>
  {/if}
</section>

<style>
  .dial {
    padding: 0.4rem var(--mmm-pad);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .track {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.4rem;
  }
  .pole {
    font-size: 0.6rem;
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
    font-size: 0.72rem;
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
    font-size: 0.62rem;
    font-style: italic;
    color: var(--mmm-extrapolated);
  }
</style>
