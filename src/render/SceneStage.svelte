<script lang="ts">
import { onMount } from "svelte";
import { fade } from "svelte/transition";
import type { SceneFrame } from "./composeScene";

/**
 * SCENE STAGE (RB-8 step 4) — renders a composeScene() descriptor as the visual backdrop of the paged
 * novel: a procedural era WASH (an SVG vertical gradient + the sense accent glow) with the stacked
 * caricature portrait LAYERS above it. Mounted BEHIND the SceneReader prose (the consumer gives it a
 * lower stacking context), so the prose stays the focus and the stage is felt, not read.
 *
 * Built atmosphere-first per the design spec: the wash is fully procedural and ships now; the portrait
 * layer <img>s resolve real caricature SVG art (the repo's idiom — hand-authored SVG, never raster)
 * from assets.json as it lands and HIDE on load error, so a not-yet-authored layer is invisible rather
 * than a broken-image box (placeholder-free, not stubbed).
 *
 * The whole stage cross-fades when the frame's `key` changes (a generation turn, an era crossing) —
 * gated by prefers-reduced-motion. Pure presentation: it reads only the descriptor, never the sim.
 */

interface Props {
  frame: SceneFrame;
  /** Asset base path; layer ids resolve to `${base}/${layer.asset}.svg`. */
  assetBase?: string;
}
const { frame, assetBase = "/assets" }: Props = $props();

// Whether the user prefers reduced motion — reactive, so a mid-session OS-pref toggle takes effect and
// SSR/test (no matchMedia) defaults to motion-off-until-mount. Seeded in onMount + a change listener.
let reduceMotion = $state(false);
onMount(() => {
  if (typeof window.matchMedia !== "function") return;
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduceMotion = mql.matches;
  const onChange = (e: MediaQueryListEvent) => {
    reduceMotion = e.matches;
  };
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
});

// Hide a layer image that fails to load (art not yet authored) so the stage degrades to the wash alone.
function hideOnError(e: Event) {
  const el = e.currentTarget as HTMLImageElement | null;
  if (el) el.style.visibility = "hidden";
}

// A DOM-safe gradient id base: frame.key carries ":" and (when eraId is a macro-act title) spaces,
// which are invalid in an SVG id and break the `url(#…)` reference. Slugify to [A-Za-z0-9_-].
const gradId = $derived(frame.key.replace(/[^A-Za-z0-9_-]+/g, "-"));
</script>

<!-- key on the descriptor identity so a changed line/era cross-fades the whole stage. -->
{#key frame.key}
  <div
    class="stage"
    class:silhouette={frame.silhouette}
    data-testid="scene-stage"
    data-stage-key={frame.key}
    aria-hidden="true"
    in:fade={{ duration: reduceMotion ? 0 : 480 }}
  >
    {#if frame.wash}
      <!-- Procedural era wash: a vertical gradient (warm origins → cool stars) with the sense accent
           bloomed at the lower third. SVG so it's crisp at any size and carries no asset cost. -->
      <svg class="wash" preserveAspectRatio="none" viewBox="0 0 100 100" data-testid="scene-wash">
        <defs>
          <linearGradient id={`grad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color={frame.wash.top} />
            <stop offset="100%" stop-color={frame.wash.bottom} />
          </linearGradient>
          {#if frame.accent}
            <radialGradient id={`glow-${gradId}`} cx="50%" cy="78%" r="70%">
              <stop offset="0%" stop-color={frame.accent} stop-opacity="0.22" />
              <stop offset="60%" stop-color={frame.accent} stop-opacity="0" />
            </radialGradient>
          {/if}
        </defs>
        <rect x="0" y="0" width="100" height="100" fill={`url(#grad-${gradId})`} />
        {#if frame.accent}
          <rect x="0" y="0" width="100" height="100" fill={`url(#glow-${gradId})`} />
        {/if}
      </svg>
    {/if}

    <!-- Stacked caricature portrait layers. Each hides itself on load error until its art exists. -->
    <div class="portrait" class:is-silhouette={frame.silhouette}>
      {#each frame.layers as layer (layer.role + layer.asset)}
        <img
          class="layer"
          data-role={layer.role}
          src={`${assetBase}/${layer.asset}.svg`}
          alt=""
          onerror={hideOnError}
        />
      {/each}
    </div>
  </div>
{/key}

<style>
  .stage {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none; /* the prose/tap-layer above owns interaction */
  }
  .wash {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  .portrait {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }
  /* All layers stack in the same grid cell so base/tier/mood/outcome composite. */
  .layer {
    grid-area: 1 / 1;
    max-width: min(70%, 28rem);
    max-height: 70%;
    object-fit: contain;
    /* The portrait sits low + faint so the prose reads over it. */
    align-self: end;
    opacity: 0.5;
    filter: drop-shadow(0 0 24px rgba(0, 0, 0, 0.5));
  }
  /* Rival vignette: smaller, dimmer, no bloom — a glimpse, not the focus. */
  .is-silhouette .layer {
    max-width: min(40%, 14rem);
    opacity: 0.3;
    filter: none;
  }
</style>
