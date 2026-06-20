<script lang="ts">
import type { DynastyKey } from "../../sim/slots";

interface Props {
  /** True when a save exists, enabling Continue. */
  hasSave: boolean;
  onNewGame: (seed: string, dynasty: DynastyKey) => void;
  onContinue: () => void;
}

const { hasSave, onNewGame, onContinue }: Props = $props();
let seed = $state("");
let step = $state<"title" | "dynasty-select">("title");

function beginDynasty(): void {
  step = "dynasty-select";
}

function chooseDynasty(dynasty: DynastyKey): void {
  onNewGame(seed.trim() || randomSeed(), dynasty);
}

function back(): void {
  step = "title";
}

function randomSeed(): string {
  // Non-sim randomness (UI only) — picking a default seed string.
  return Math.floor(Date.now() % 1e9).toString(36) + "-dynasty";
}

const DYNASTIES: Array<{
  key: DynastyKey;
  name: string;
  house: string;
  founding: string;
  tagline: string;
  icon: string;
  accent: string;
}> = [
  {
    key: "trump",
    name: "Trump",
    house: "The House of Trump",
    founding: "Kallstadt, 1885",
    tagline: "A barber's apprentice leaves Bavaria and builds the most brazen commercial dynasty in American history.",
    icon: "/assets/icons/dynasty-trump.svg",
    accent: "var(--mmm-gold)",
  },
  {
    key: "kennedy",
    name: "Kennedy",
    house: "The House of Kennedy",
    founding: "County Wexford, 1848",
    tagline: "A famine immigrant survives the coffin ships and raises the most glamorous political dynasty of the twentieth century.",
    icon: "/assets/icons/dynasty-kennedy.svg",
    accent: "#4a9eff",
  },
  {
    key: "musk",
    name: "Musk",
    house: "The House of Musk",
    founding: "Cape Colony, 1906",
    tagline: "A South African aviator's grandson inherits first-principles thinking and builds civilizations — on Earth, and beyond.",
    icon: "/assets/icons/dynasty-musk.svg",
    accent: "#c0c8d8",
  },
];
</script>

{#if step === "title"}
  <main class="title">
    <div class="masthead">
      <span class="eyebrow">A DYNASTIC SAGA</span>
      <h1>Dynasty</h1>
      <div class="rule" aria-hidden="true">
        <span class="diamond">◆</span>
      </div>
      <p class="tagline">Bloodline, fortune, and the long arc of power.</p>
    </div>

    <div class="panel">
      <label for="seed">Seed (optional)</label>
      <input id="seed" bind:value={seed} placeholder="leave blank for random" autocomplete="off" />
      <button class="primary" type="button" onclick={beginDynasty}>Begin a Dynasty</button>
      {#if hasSave}
        <button class="secondary" type="button" onclick={onContinue}>Continue the Saga</button>
      {/if}
    </div>
  </main>
{:else}
  <main class="carousel-screen">
    <div class="carousel-masthead">
      <span class="eyebrow">CHOOSE YOUR BLOODLINE</span>
      <h2>Which Dynasty?</h2>
      <p class="carousel-sub">Each house carries a different origin, a different grammar of power.</p>
    </div>

    <div class="carousel">
      {#each DYNASTIES as d (d.key)}
        <button
          class="dynasty-card"
          type="button"
          style="--house-accent: {d.accent}"
          onclick={() => chooseDynasty(d.key)}
        >
          <img class="dynasty-icon" src={d.icon} alt="" aria-hidden="true" />
          <span class="dynasty-house">{d.house}</span>
          <span class="dynasty-name">{d.name}</span>
          <span class="dynasty-founding">{d.founding}</span>
          <p class="dynasty-tagline">{d.tagline}</p>
          <span class="dynasty-cta">Play as {d.name} →</span>
        </button>
      {/each}
    </div>

    <button class="back-btn" type="button" onclick={back}>← Back</button>
  </main>
{/if}

<style>
  /* ── Shared ───────────────────────────────────────────── */
  .title,
  .carousel-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    min-height: 100dvh;
    padding: max(var(--mmm-pad), env(safe-area-inset-top)) var(--mmm-pad);
    text-align: center;
    background:
      radial-gradient(120% 80% at 50% 0%, var(--mmm-navy-light) 0%, var(--mmm-navy) 55%, var(--mmm-navy-deep) 100%);
  }

  /* ── Title step ───────────────────────────────────────── */
  .masthead {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
  }
  .eyebrow {
    font-family: var(--mmm-font-body);
    font-size: 0.74rem;
    letter-spacing: 0.42em;
    text-indent: 0.42em;
    color: var(--mmm-gold-deep);
    text-transform: uppercase;
  }
  h1 {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-weight: 800;
    font-size: clamp(3.4rem, 16vw, 5.5rem);
    line-height: 0.95;
    letter-spacing: 0.01em;
    background: linear-gradient(
      180deg,
      var(--mmm-gold-bright) 0%,
      var(--mmm-gold) 45%,
      var(--mmm-gold-deep) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 1px 0 rgb(0 0 0 / 0.35);
    filter: drop-shadow(0 0 18px rgb(212 175 55 / 0.25));
  }
  .rule {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: min(18rem, 70vw);
    margin: 0.15rem 0 0.1rem;
    color: var(--mmm-gold-deep);
  }
  .rule::before,
  .rule::after {
    content: "";
    height: 1px;
    flex: 1;
    background: linear-gradient(90deg, transparent, var(--mmm-gold-deep));
  }
  .rule::after {
    background: linear-gradient(90deg, var(--mmm-gold-deep), transparent);
  }
  .diamond {
    font-size: 0.7rem;
    color: var(--mmm-gold);
  }
  .tagline {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-size: 1.05rem;
    font-style: italic;
    color: var(--mmm-text-dim);
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    width: min(21rem, 90vw);
    padding: 1.25rem;
    border-radius: var(--mmm-radius-lg);
    background: color-mix(in srgb, var(--mmm-surface) 55%, transparent);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 60%, transparent);
    box-shadow: var(--mmm-shadow);
    backdrop-filter: blur(6px);
  }
  label {
    text-align: left;
    font-family: var(--mmm-font-body);
    font-size: 0.82rem;
    letter-spacing: 0.04em;
    color: var(--mmm-text-dim);
  }
  input {
    padding: 0.65rem 0.7rem;
    border-radius: var(--mmm-radius);
    border: 1px solid var(--mmm-gold-deep);
    background: var(--mmm-navy-deep);
    color: var(--mmm-text);
    font-family: var(--mmm-font-body);
    font-size: 1rem;
  }
  input:focus-visible {
    outline: 2px solid var(--mmm-gold);
    outline-offset: 1px;
  }
  button {
    padding: 0.8rem;
    border-radius: var(--mmm-radius);
    font-family: var(--mmm-font-display);
    font-weight: 700;
    font-size: 1.05rem;
    letter-spacing: 0.02em;
    cursor: pointer;
    border: 1px solid var(--mmm-gold-deep);
    transition:
      transform var(--mmm-dur-fast) var(--mmm-ease),
      box-shadow var(--mmm-dur-fast) var(--mmm-ease);
  }
  button:hover {
    transform: translateY(-1px);
  }
  .primary {
    background: linear-gradient(180deg, var(--mmm-gold-bright), var(--mmm-gold-deep));
    color: var(--mmm-ink);
    box-shadow: var(--mmm-shadow-gold);
  }
  .secondary {
    background: transparent;
    color: var(--mmm-text);
  }

  /* ── Carousel step ────────────────────────────────────── */
  .carousel-screen {
    justify-content: center;
    padding-top: max(1.5rem, env(safe-area-inset-top));
  }
  .carousel-masthead {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  h2 {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-weight: 800;
    font-size: clamp(2rem, 10vw, 3.2rem);
    line-height: 1;
    background: linear-gradient(
      180deg,
      var(--mmm-gold-bright) 0%,
      var(--mmm-gold) 50%,
      var(--mmm-gold-deep) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .carousel-sub {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-size: 0.9rem;
    font-style: italic;
    color: var(--mmm-text-dim);
    max-width: 28rem;
  }
  .carousel {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    width: min(64rem, 95vw);
  }
  .dynasty-card {
    flex: 1 1 min(16rem, 85vw);
    max-width: 20rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 1.5rem 1.25rem;
    border-radius: var(--mmm-radius-lg);
    background: color-mix(in srgb, var(--mmm-surface) 60%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--house-accent) 40%, transparent);
    box-shadow:
      0 2px 18px rgb(0 0 0 / 0.35),
      inset 0 1px 0 color-mix(in srgb, var(--house-accent) 20%, transparent);
    cursor: pointer;
    text-align: center;
    transition:
      transform var(--mmm-dur-fast) var(--mmm-ease),
      box-shadow var(--mmm-dur-fast) var(--mmm-ease),
      border-color var(--mmm-dur-fast) var(--mmm-ease);
  }
  @supports (backdrop-filter: blur(4px)) {
    .dynasty-card {
      backdrop-filter: blur(4px);
    }
  }
  .dynasty-card:hover,
  .dynasty-card:focus-visible {
    transform: translateY(-3px);
    border-color: var(--house-accent);
    box-shadow:
      0 8px 32px rgb(0 0 0 / 0.4),
      0 0 18px color-mix(in srgb, var(--house-accent) 35%, transparent),
      inset 0 1px 0 color-mix(in srgb, var(--house-accent) 30%, transparent);
  }
  .dynasty-card:focus-visible {
    outline: 2px solid var(--house-accent);
    outline-offset: 2px;
  }
  .dynasty-icon {
    width: 2.5rem;
    height: 2.5rem;
    object-fit: contain;
  }
  .dynasty-house {
    font-family: var(--mmm-font-body);
    font-size: 0.68rem;
    letter-spacing: 0.36em;
    text-indent: 0.36em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--house-accent) 85%, var(--mmm-text-dim));
  }
  .dynasty-name {
    font-family: var(--mmm-font-display);
    font-weight: 800;
    font-size: clamp(1.6rem, 7vw, 2.2rem);
    line-height: 1;
    color: var(--house-accent);
    filter: drop-shadow(0 0 10px color-mix(in srgb, var(--house-accent) 30%, transparent));
  }
  .dynasty-founding {
    font-family: var(--mmm-font-body);
    font-size: 0.75rem;
    font-style: italic;
    color: var(--mmm-text-dim);
  }
  .dynasty-tagline {
    margin: 0.4rem 0 0.6rem;
    font-family: var(--mmm-font-body);
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--mmm-text-dim);
    flex: 1;
  }
  .dynasty-cta {
    font-family: var(--mmm-font-display);
    font-weight: 700;
    font-size: 0.9rem;
    letter-spacing: 0.04em;
    color: var(--house-accent);
    margin-top: 0.25rem;
  }
  .back-btn {
    background: transparent;
    color: var(--mmm-text-dim);
    border-color: transparent;
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }
  .back-btn:hover {
    color: var(--mmm-text);
  }
</style>
