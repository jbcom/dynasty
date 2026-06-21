<script lang="ts">
import type { StartMoment } from "../../sim/schema";

interface Props {
  /** The start-moments to found a line at (content.startMoments). */
  moments: StartMoment[];
  /** True when a save exists, enabling Continue. */
  hasSave: boolean;
  /** Found a dynasty: the chosen moment, the player's surname, and a seed. */
  onFound: (momentId: string, surname: string, seed: string) => void;
  onContinue: () => void;
}

const { moments, hasSave, onFound, onContinue }: Props = $props();

let step = $state<"title" | "moment-select" | "name-entry">("title");
let seed = $state("");
let surname = $state("");
let chosenId = $state<string | null>(null);

const chosenMoment = $derived(moments.find((m) => m.id === chosenId) ?? null);

function beginFounding(): void {
  step = "moment-select";
}
function chooseMoment(id: string): void {
  chosenId = id;
  step = "name-entry";
}
function confirmFounding(): void {
  const name = surname.trim();
  if (!chosenId || !name) return;
  onFound(chosenId, name, seed.trim() || randomSeed());
}
function backToTitle(): void {
  step = "title";
}
function backToMoments(): void {
  step = "moment-select";
  chosenId = null;
}
function randomSeed(): string {
  // Non-sim randomness (UI only) — a default seed string.
  return Math.floor(Date.now() % 1e9).toString(36) + "-dynasty";
}
</script>

{#if step === "title"}
  <main class="title">
    <div class="masthead">
      <span class="eyebrow">A DYNASTIC SAGA</span>
      <h1>Dynasty</h1>
      <div class="rule" aria-hidden="true"><span class="diamond">◆</span></div>
      <p class="tagline">Found a line. Steer it across the centuries.</p>
    </div>

    <div class="panel">
      <label for="seed">Seed (optional)</label>
      <input id="seed" bind:value={seed} placeholder="leave blank for random" autocomplete="off" />
      <button class="primary" type="button" onclick={beginFounding}>Found a Dynasty</button>
      {#if hasSave}
        <button class="secondary" type="button" onclick={onContinue}>Continue the Saga</button>
      {/if}
    </div>
  </main>
{:else if step === "moment-select"}
  <main class="select-screen">
    <div class="select-masthead">
      <span class="eyebrow">CHOOSE YOUR HINGE</span>
      <h2>Where History Turns</h2>
      <p class="select-sub">Found your line at a pivotal moment. Real time, real place — your name.</p>
    </div>

    <div class="moments">
      {#each moments as m (m.id)}
        <button
          class="moment-card"
          class:deep={m.deepHistory}
          type="button"
          onclick={() => chooseMoment(m.id)}
        >
          <span class="moment-archetype">{m.archetype}</span>
          <span class="moment-label">{m.label}</span>
          <span class="moment-where">{m.place} · {m.year}</span>
          <p class="moment-scene">{m.scene}</p>
          {#if m.deepHistory}<span class="moment-deep">Deep history</span>{/if}
          <span class="moment-cta">Found here →</span>
        </button>
      {/each}
    </div>

    <button class="back-btn" type="button" onclick={backToTitle}>← Back</button>
  </main>
{:else}
  <main class="name-screen">
    <div class="select-masthead">
      <span class="eyebrow">NAME YOUR LINE</span>
      <h2>The Founding</h2>
      {#if chosenMoment}
        <p class="select-sub">{chosenMoment.label} — {chosenMoment.place}, {chosenMoment.year}</p>
      {/if}
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
      <p class="founding-note">
        A progenitor will be named in the {chosenMoment?.culture.replace(/_/g, " ")} tradition. From
        them, the line begins.
      </p>
      <button class="primary" type="button" disabled={!surname.trim()} onclick={confirmFounding}>
        Begin the Line
      </button>
      <button class="back-btn" type="button" onclick={backToMoments}>← Choose another moment</button>
    </div>
  </main>
{/if}

<style>
  .title,
  .select-screen,
  .name-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    min-height: 100dvh;
    padding: max(var(--mmm-pad), env(safe-area-inset-top)) var(--mmm-pad);
    text-align: center;
    background: radial-gradient(
      120% 80% at 50% 0%,
      var(--mmm-navy-light) 0%,
      var(--mmm-navy) 55%,
      var(--mmm-navy-deep) 100%
    );
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
    width: min(24rem, 92vw);
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
  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
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
  .founding-note {
    margin: 0.1rem 0 0.3rem;
    font-family: var(--mmm-font-body);
    font-size: 0.82rem;
    font-style: italic;
    line-height: 1.5;
    color: var(--mmm-text-dim);
    text-align: left;
  }

  /* ── Moment select ────────────────────────────────────── */
  .select-screen {
    justify-content: flex-start;
    padding-top: max(1.5rem, env(safe-area-inset-top));
  }
  .select-masthead {
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
  .select-sub {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-size: 0.9rem;
    font-style: italic;
    color: var(--mmm-text-dim);
    max-width: 30rem;
  }
  .moments {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    width: min(68rem, 96vw);
  }
  .moment-card {
    flex: 1 1 min(16rem, 85vw);
    max-width: 20rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
    padding: 1.25rem;
    border-radius: var(--mmm-radius-lg);
    background: color-mix(in srgb, var(--mmm-surface) 60%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--mmm-gold-deep) 40%, transparent);
    box-shadow: 0 2px 18px rgb(0 0 0 / 0.35);
    cursor: pointer;
    text-align: left;
    transition:
      transform var(--mmm-dur-fast) var(--mmm-ease),
      box-shadow var(--mmm-dur-fast) var(--mmm-ease),
      border-color var(--mmm-dur-fast) var(--mmm-ease);
  }
  .moment-card.deep {
    border-color: color-mix(in srgb, #1d7a5f 55%, transparent);
  }
  @supports (backdrop-filter: blur(4px)) {
    .moment-card {
      backdrop-filter: blur(4px);
    }
  }
  .moment-card:hover,
  .moment-card:focus-visible {
    transform: translateY(-3px);
    border-color: var(--mmm-gold);
    box-shadow:
      0 8px 32px rgb(0 0 0 / 0.4),
      0 0 18px color-mix(in srgb, var(--mmm-gold) 30%, transparent);
  }
  .moment-card:focus-visible {
    outline: 2px solid var(--mmm-gold);
    outline-offset: 2px;
  }
  .moment-archetype {
    font-family: var(--mmm-font-body);
    font-size: 0.66rem;
    letter-spacing: 0.32em;
    text-indent: 0.32em;
    text-transform: uppercase;
    color: var(--mmm-gold-deep);
  }
  .moment-label {
    font-family: var(--mmm-font-display);
    font-weight: 800;
    font-size: 1.2rem;
    line-height: 1.1;
    color: var(--mmm-gold);
  }
  .moment-where {
    font-family: var(--mmm-font-body);
    font-size: 0.75rem;
    font-style: italic;
    color: var(--mmm-text-dim);
  }
  .moment-scene {
    margin: 0.3rem 0 0.4rem;
    font-family: var(--mmm-font-body);
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--mmm-text-dim);
    flex: 1;
  }
  .moment-deep {
    align-self: flex-start;
    font-family: var(--mmm-font-body);
    font-size: 0.66rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #4fd1a5;
  }
  .moment-cta {
    font-family: var(--mmm-font-display);
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
    color: var(--mmm-gold);
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
