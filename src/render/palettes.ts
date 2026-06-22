/**
 * RENDER PALETTES (RB-8/RB-10) — the VISUAL side of the era cues. The scene wash is procedural (an SVG
 * gradient, no raster asset), so the atmosphere shifts across the saga's arc the way the audio chord
 * shifts the pad: rooted/warm at the immigrant origins → luminous/vast at the stars. The ramp now comes
 * from the SINGLE era table in sim/eras.ts (RB-10) — the same band the audio `chordForEra` reads — so
 * the two cues can't drift. Pure functions — no DOM, no Date/random; deterministic.
 *
 * The sense accent reuses the values SceneReader.svelte sets on `--sense-accent`, single-sourced here so
 * the wash and the prose edge-wash agree on what each sense looks like.
 */

import { bandForEra } from "../sim/eras";
import type { Sense } from "../sim/saga/schema";

/** A scene-wash ramp: two gradient stops (top → bottom) over which the sense accent is layered. */
export interface EraRamp {
  /** Stable id of the matched era band — for tests + the SceneStage `data-era`. */
  id: string;
  /** Warm/cool base of the wash at this era (top stop of the vertical gradient). */
  top: string;
  /** The deeper ground tone (bottom stop). */
  bottom: string;
}

/**
 * Resolve the wash ramp for an era id (a wave/period id or a macro-act title — both carry the keywords).
 * The ramp comes from the SINGLE era table in sim/eras.ts (RB-10) — the same band the audio chord reads
 * — so the backdrop and the pad can never disagree about the era. (id + ramp lifted from the band.)
 */
export function rampForEra(eraId: string): EraRamp {
  const band = bandForEra(eraId);
  return { id: band.id, top: band.ramp.top, bottom: band.ramp.bottom };
}

/**
 * Sense → accent colour. Mirrors SceneReader.svelte's `--sense-accent` per-sense values exactly so the
 * full-bleed wash and the prose's left-edge wash read as the same atmosphere. `sight` defers to the
 * brand gold (resolved by the consumer via the CSS var) — represented here as the gold-deep fallback so
 * this module stays free of CSS-var coupling.
 */
const SENSE_ACCENT: Record<Sense, string> = {
  smell: "#8c6f4d",
  taste: "#a4564d",
  touch: "#6f7d8c",
  sound: "#5d7a86",
  sight: "#b8893a", // the brand gold-deep (SceneReader uses var(--mmm-gold) for sight)
};

export function accentForSense(sense: Sense): string {
  return SENSE_ACCENT[sense] ?? SENSE_ACCENT.sight;
}
