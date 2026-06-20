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
  return Math.floor(Date.now() % 1e9).toString(36) + "-maga";
}
</script>

<main class="title">
  <h1>MAGA Money Moves</h1>
  <p class="tagline">From Queens to the King.</p>

  <div class="panel">
    <label for="seed">Seed (optional)</label>
    <input id="seed" bind:value={seed} placeholder="leave blank for random" autocomplete="off" />
    <button class="primary" type="button" onclick={start}>New Game</button>
    {#if hasSave}
      <button class="secondary" type="button" onclick={onContinue}>Continue</button>
    {/if}
  </div>
</main>

<style>
  .title {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 100dvh;
    padding: var(--mmm-pad);
    text-align: center;
  }
  h1 {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-size: 2.6rem;
    color: var(--mmm-gold);
    text-shadow: var(--mmm-shadow-gold);
  }
  .tagline {
    margin: 0 0 1rem;
    color: var(--mmm-text-dim);
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    width: min(20rem, 90vw);
  }
  label {
    text-align: left;
    font-size: 0.78rem;
    color: var(--mmm-text-dim);
  }
  input {
    padding: 0.6rem;
    border-radius: var(--mmm-radius);
    border: 1px solid var(--mmm-gold-deep);
    background: var(--mmm-surface);
    color: var(--mmm-text);
  }
  button {
    padding: 0.75rem;
    border-radius: var(--mmm-radius);
    font-weight: 700;
    cursor: pointer;
    border: 1px solid var(--mmm-gold-deep);
  }
  .primary {
    background: var(--mmm-gold);
    color: var(--mmm-ink);
  }
  .secondary {
    background: transparent;
    color: var(--mmm-text);
  }
</style>
