<script lang="ts">
import { untrack } from "svelte";

interface Props {
  geminiKey: string;
  liveExtrapolation: boolean;
  /** Persist a new key (empty clears it). */
  onSaveKey: (key: string) => void;
  /** Toggle live extrapolation. */
  onToggleLive: (on: boolean) => void;
  onBack: () => void;
}

const { geminiKey, liveExtrapolation, onSaveKey, onToggleLive, onBack }: Props = $props();

// The screen mounts fresh whenever Settings opens, so the drafts are seeded ONCE
// from the persisted values (editing is local until saved); untrack makes the
// intentional one-time read explicit so it isn't flagged as a reactive capture.
let keyDraft = $state(untrack(() => geminiKey));
let live = $state(untrack(() => liveExtrapolation));
let saved = $state(false);

const hasKey = $derived(keyDraft.trim().length > 0);

function saveKey(): void {
  onSaveKey(keyDraft.trim());
  saved = true;
}

function toggleLive(): void {
  // Live mode is meaningless without a key.
  if (!hasKey) return;
  live = !live;
  onToggleLive(live);
}

function clearKey(): void {
  keyDraft = "";
  live = false;
  onSaveKey("");
  onToggleLive(false);
  saved = true;
}
</script>

<main class="settings">
  <div class="masthead">
    <span class="eyebrow">SETTINGS</span>
    <h2>The Study</h2>
  </div>

  <div class="panel">
    <h3>Live Extrapolation</h3>
    <p class="blurb">
      When a line outruns its authored history, Dynasty can ask Google's Gemini to
      extrapolate the next chapter — using your own API key, stored only on this
      device. Off by default; the game is complete without it.
    </p>

    <label for="gkey">Gemini API key</label>
    <input
      id="gkey"
      type="password"
      bind:value={keyDraft}
      placeholder="paste your key (stays on this device)"
      autocomplete="off"
      oninput={() => (saved = false)}
    />
    <div class="row">
      <button class="primary" type="button" disabled={!hasKey} onclick={saveKey}>Save key</button>
      <button class="ghost" type="button" onclick={clearKey}>Clear</button>
    </div>

    <button
      class="toggle"
      type="button"
      class:on={live}
      disabled={!hasKey}
      aria-pressed={live}
      onclick={toggleLive}
    >
      <span class="dot" aria-hidden="true"></span>
      Live extrapolation {live ? "ON" : "OFF"}
    </button>
    {#if !hasKey}
      <p class="hint">Enter a key to enable live extrapolation.</p>
    {:else if saved}
      <p class="hint">Saved on this device.</p>
    {/if}
  </div>

  <button class="back-btn" type="button" onclick={onBack}>← Back</button>
</main>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    min-height: 100dvh;
    padding: max(1.5rem, env(safe-area-inset-top)) var(--mmm-pad);
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
    gap: 0.25rem;
  }
  .eyebrow {
    font-family: var(--mmm-font-body);
    font-size: 0.74rem;
    letter-spacing: 0.42em;
    text-indent: 0.42em;
    color: var(--mmm-gold-deep);
    text-transform: uppercase;
  }
  h2 {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-weight: 800;
    font-size: clamp(2rem, 9vw, 3rem);
    background: linear-gradient(180deg, var(--mmm-gold-bright), var(--mmm-gold-deep));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    width: min(26rem, 92vw);
    padding: 1.25rem;
    border-radius: var(--mmm-radius-lg);
    background: color-mix(in srgb, var(--mmm-surface) 55%, transparent);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 60%, transparent);
    box-shadow: var(--mmm-shadow);
    text-align: left;
  }
  h3 {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--mmm-gold);
  }
  .blurb {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--mmm-text-dim);
  }
  label {
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
  .row {
    display: flex;
    gap: 0.6rem;
  }
  button {
    padding: 0.7rem 0.9rem;
    border-radius: var(--mmm-radius);
    font-family: var(--mmm-font-display);
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    border: 1px solid var(--mmm-gold-deep);
    transition: transform var(--mmm-dur-fast) var(--mmm-ease);
  }
  button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .primary {
    background: linear-gradient(180deg, var(--mmm-gold-bright), var(--mmm-gold-deep));
    color: var(--mmm-ink);
    flex: 1;
  }
  .ghost {
    background: transparent;
    color: var(--mmm-text);
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: var(--mmm-navy-deep);
    color: var(--mmm-text);
    margin-top: 0.3rem;
  }
  .toggle .dot {
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 50%;
    background: var(--mmm-text-dim);
    transition: background var(--mmm-dur-fast) var(--mmm-ease);
  }
  .toggle.on .dot {
    background: var(--mmm-gold);
    box-shadow: 0 0 8px var(--mmm-gold);
  }
  .hint {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-size: 0.75rem;
    font-style: italic;
    color: var(--mmm-text-dim);
  }
  .back-btn {
    background: transparent;
    color: var(--mmm-text-dim);
    border-color: transparent;
    font-size: 0.9rem;
  }
  .back-btn:hover {
    color: var(--mmm-text);
  }
</style>
