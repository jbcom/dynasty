<script lang="ts">
interface Props {
  hasSave: boolean;
  /**
   * Begin a line (CP-R4 diegetic birth): the player gives a seed (optional) + a
   * surname; the origin is DEALT from the seed and DISCOVERED in the Epoch-0 birth.
   */
  onBirth: (seed: string, surname: string) => void;
  onContinue: () => void;
  onSettings: () => void;
}

const { hasSave, onBirth, onContinue, onSettings }: Props = $props();

let seed = $state("");
let surname = $state("");

function effectiveSeed(): string {
  return seed.trim() || `${Math.floor(Date.now() % 1e9).toString(36)}-dynasty`;
}

function begin(): void {
  if (!surname.trim()) return;
  onBirth(effectiveSeed(), surname.trim());
}
</script>

<main class="panel-screen">
  <div class="masthead">
    <span class="eyebrow">A DYNASTIC SAGA</span>
    <h1>Dynasty</h1>
    <div class="rule" aria-hidden="true"><span class="diamond">◆</span></div>
    <p class="tagline">Give your line a name. Discover where the hand of fate has dealt it.</p>
  </div>
  <div class="panel">
    <label for="surname">Family name</label>
    <input
      id="surname"
      bind:value={surname}
      placeholder="your dynasty's surname"
      autocomplete="off"
      maxlength="32"
    />
    <label for="seed">Seed (optional)</label>
    <input id="seed" bind:value={seed} placeholder="leave blank for random" autocomplete="off" />
    <button class="primary" type="button" disabled={!surname.trim()} onclick={begin}>
      New Game — Begin a Line
    </button>
    {#if hasSave}
      <button class="secondary" type="button" onclick={onContinue}>Load Game — Continue</button>
    {/if}
    <button class="secondary" type="button" onclick={onSettings}>Settings</button>
  </div>
</main>

<style>
  .panel-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    min-height: 100dvh;
    padding: max(1.25rem, env(safe-area-inset-top)) var(--mmm-pad);
    text-align: center;
    background: radial-gradient(120% 80% at 50% 0%, var(--mmm-navy-light) 0%, var(--mmm-navy) 55%, var(--mmm-navy-deep) 100%);
    justify-content: center;
  }
  .masthead {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }
  .eyebrow {
    font-family: var(--mmm-font-body);
    font-size: 0.72rem;
    letter-spacing: 0.4em;
    text-indent: 0.4em;
    color: var(--mmm-gold-deep);
    text-transform: uppercase;
  }
  h1 {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-weight: 800;
    font-size: clamp(3.2rem, 15vw, 5rem);
    /* line-height is intentionally tight for the cap-height look, but that clips the
       line-box ABOVE the glyph descenders (the "y" tail), so the rule below would
       overlap. Pad the bottom by the descender depth to give the tail its own room. */
    line-height: 0.95;
    padding-bottom: 0.18em;
    background: linear-gradient(180deg, var(--mmm-gold-bright) 0%, var(--mmm-gold) 45%, var(--mmm-gold-deep) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 0 18px rgb(212 175 55 / 0.25));
  }
  .rule {
    display: flex;
    align-items: center;
    justify-content: center;
    width: min(18rem, 70vw);
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
    padding: 0 0.6rem;
  }
  .tagline {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-style: italic;
    color: var(--mmm-text-dim);
    max-width: 32rem;
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    width: min(26rem, 92vw);
    padding: 1.25rem;
    border-radius: var(--mmm-radius-lg);
    background: color-mix(in srgb, var(--mmm-surface) 55%, transparent);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 60%, transparent);
    box-shadow: var(--mmm-shadow);
    text-align: left;
  }
  label {
    font-family: var(--mmm-font-body);
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    color: var(--mmm-text-dim);
  }
  input {
    padding: 0.6rem 0.7rem;
    border-radius: var(--mmm-radius);
    border: 1px solid var(--mmm-gold-deep);
    background: var(--mmm-navy-deep);
    color: var(--mmm-text);
    font-family: var(--mmm-font-body);
    font-size: 1rem;
    width: 100%;
  }
  input:focus-visible {
    outline: 2px solid var(--mmm-gold);
  }
  button {
    cursor: pointer;
    transition: transform var(--mmm-dur-fast) var(--mmm-ease);
  }
  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .primary {
    padding: 0.8rem;
    border-radius: var(--mmm-radius);
    font-family: var(--mmm-font-display);
    font-weight: 700;
    font-size: 1.05rem;
    border: 1px solid var(--mmm-gold-deep);
    background: linear-gradient(180deg, var(--mmm-gold-bright), var(--mmm-gold-deep));
    color: var(--mmm-ink);
    box-shadow: var(--mmm-shadow-gold);
    margin-top: 0.4rem;
  }
  .secondary {
    padding: 0.8rem;
    border-radius: var(--mmm-radius);
    font-family: var(--mmm-font-display);
    font-weight: 700;
    border: 1px solid var(--mmm-gold-deep);
    background: transparent;
    color: var(--mmm-text);
  }
</style>
