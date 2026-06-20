<script lang="ts">
interface Props {
  /** True when a save exists, enabling Continue. */
  hasSave: boolean;
  onNewGame: (seed: string) => void;
  onContinue: () => void;
}

const { hasSave, onNewGame, onContinue }: Props = $props();
let seed = $state("");

function start(): void {
  onNewGame(seed.trim() || randomSeed());
}

function randomSeed(): string {
  // Non-sim randomness (UI only) — picking a default seed string.
  return Math.floor(Date.now() % 1e9).toString(36) + "-dynasty";
}
</script>

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
    <button class="primary" type="button" onclick={start}>Begin a Dynasty</button>
    {#if hasSave}
      <button class="secondary" type="button" onclick={onContinue}>Continue the Saga</button>
    {/if}
  </div>
</main>

<style>
  .title {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    min-height: 100dvh;
    padding: max(var(--mmm-pad), env(safe-area-inset-top)) var(--mmm-pad);
    text-align: center;
    background:
      radial-gradient(120% 80% at 50% 0%, var(--mmm-navy-light) 0%, var(--mmm-navy) 55%, var(--mmm-navy-deep) 100%);
  }
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
    /* Gilded gradient wordmark with a soft engraved depth. */
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
    transition: transform var(--mmm-dur-fast) var(--mmm-ease),
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
</style>
