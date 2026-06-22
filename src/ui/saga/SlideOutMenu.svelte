<script lang="ts">
import type { Snippet } from "svelte";

/**
 * SLIDE-OUT MENU (PF-3) — a top-right hamburger that slides a panel in from the right holding the
 * NON-ESSENTIAL HUD (meters, motivators, the utopia–tyranny axis) + in-game settings, so the play
 * surface keeps only the act-chapter headline + year always-visible and gives the unfolding story the
 * room. Pure presentation: the caller passes the panel contents as a snippet; open state is local.
 */

interface Props {
  /** The menu body — the moved HUD panels + settings, rendered when open. */
  children: Snippet;
  /** Optional label for the hamburger (a11y). */
  label?: string;
}
const { children, label = "Menu" }: Props = $props();

let open = $state(false);
</script>

<button
  type="button"
  class="hamburger"
  aria-label={label}
  aria-expanded={open}
  data-testid="hud-hamburger"
  onclick={() => (open = !open)}
>
  <span class="bar"></span>
  <span class="bar"></span>
  <span class="bar"></span>
</button>

{#if open}
  <!-- Scrim closes the menu on tap-away. -->
  <button
    type="button"
    class="scrim"
    aria-label="Close menu"
    data-testid="hud-scrim"
    onclick={() => (open = false)}
  ></button>
  <aside class="panel" data-testid="hud-menu">
    <header class="panel-head">
      <span class="panel-title">The Line</span>
      <button type="button" class="close" aria-label="Close" onclick={() => (open = false)}>×</button>
    </header>
    <div class="panel-body">
      {@render children()}
    </div>
  </aside>
{/if}

<style>
  .hamburger {
    position: fixed;
    top: max(0.7rem, env(safe-area-inset-top));
    right: max(0.7rem, env(safe-area-inset-right));
    z-index: 30;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 2.6rem;
    height: 2.6rem;
    padding: 0.6rem;
    border-radius: var(--mmm-radius);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 45%, transparent);
    background: color-mix(in srgb, var(--mmm-surface) 70%, transparent);
    backdrop-filter: blur(6px);
    cursor: pointer;
  }
  .bar {
    height: 2px;
    border-radius: 1px;
    background: var(--mmm-gold);
  }
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 31;
    border: none;
    background: color-mix(in srgb, #000 55%, transparent);
    cursor: pointer;
    animation: fade-in 0.2s ease both;
  }
  .panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 32;
    width: min(88vw, 26rem);
    display: flex;
    flex-direction: column;
    padding: max(1rem, env(safe-area-inset-top)) 1rem 1rem;
    background: var(--mmm-surface);
    border-left: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 45%, transparent);
    box-shadow: -12px 0 32px color-mix(in srgb, #000 45%, transparent);
    overflow-y: auto;
    animation: slide-in 0.24s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  }
  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  .panel-title {
    font-family: var(--mmm-font-display);
    font-size: 1.1rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--mmm-gold);
  }
  .close {
    appearance: none;
    border: none;
    background: none;
    font-size: 1.6rem;
    line-height: 1;
    color: var(--mmm-text-dim);
    cursor: pointer;
  }
  .panel-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  @keyframes slide-in {
    from { transform: translateX(100%); }
    to { transform: none; }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .panel { animation: none; }
    .scrim { animation: none; }
  }
</style>
