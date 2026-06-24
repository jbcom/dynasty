<script lang="ts">
/**
 * GA-VIDEO (GV-4) — CinematicView: plays a generated Veo cinematic mp4 keyed by cinematicKey (the boundary
 * "passing of the line" / the dynastic finale). The composite key maps to the asset path (`:` → `_`). If the
 * clip isn't generated yet (the on-demand set is small), the <video> HIDES on error so the surface degrades
 * cleanly to whatever sits beneath it (the dossier interstitial / the legacy report). Decorative — muted,
 * autoplay-friendly, looped; never blocks the flow.
 */
interface Props {
  /** The cinematic key (e.g. "cinematic:handoff:founding_1700s" or "cinematic:finale:stars"). */
  cinematicKey: string;
}
const { cinematicKey: key }: Props = $props();

const src = $derived(`/assets/generated/cinematics/${key.replace(/:/g, "_")}.mp4`);
</script>

<!-- biome-ignore lint/a11y/useMediaCaption: a decorative, wordless atmospheric clip — no speech to caption. -->
<video
  class="cinematic"
  {src}
  autoplay
  muted
  loop
  playsinline
  aria-hidden="true"
  data-testid="cinematic"
  onerror={(e) => {
    (e.currentTarget as HTMLVideoElement).style.display = "none";
  }}
></video>

<style>
  .cinematic {
    display: block;
    width: 100%;
    max-height: 40vh;
    object-fit: cover;
    border-radius: var(--mmm-radius);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 50%, transparent);
    box-shadow: var(--mmm-shadow);
  }
</style>
