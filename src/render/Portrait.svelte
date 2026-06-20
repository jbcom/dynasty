<script lang="ts">
import { resolvePortrait } from "./portraits";

interface Props {
  portraitId: string;
  size?: number;
}

const { portraitId, size = 120 }: Props = $props();
const def = $derived(resolvePortrait(portraitId));
</script>

<div
  class="portrait"
  data-portrait={def.id}
  style={`--size:${size}px; --accent:${def.accent}`}
  role="img"
  aria-label={`${def.label} portrait`}
>
  {#each def.layers as layer, i (i)}
    {#if layer.src}
      <img class="layer" style={`z-index:${layer.z}`} src={`/assets/${layer.src}`} alt="" />
    {:else}
      <div class={`layer gen ${layer.variant ?? ""}`} style={`z-index:${layer.z}`}></div>
    {/if}
  {/each}
  <span class="frame"></span>
</div>

<style>
  .portrait {
    position: relative;
    width: var(--size);
    height: var(--size);
    border-radius: var(--mmm-radius);
    overflow: hidden;
    isolation: isolate;
  }
  .layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .gen.bg {
    background: radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--accent) 55%, transparent), var(--mmm-navy-deep));
  }
  .gen.silhouette {
    background:
      radial-gradient(ellipse 38% 30% at 50% 40%, color-mix(in srgb, var(--accent) 80%, black) 60%, transparent 62%),
      radial-gradient(ellipse 52% 40% at 50% 100%, color-mix(in srgb, var(--accent) 70%, black) 60%, transparent 62%);
  }
  .frame {
    position: absolute;
    inset: 0;
    z-index: 10;
    border: 2px solid var(--accent);
    border-radius: inherit;
    box-shadow: inset 0 0 12px rgb(0 0 0 / 0.5);
    pointer-events: none;
  }
</style>
