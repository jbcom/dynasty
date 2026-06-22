/**
 * RENDER PALETTES (RB-8) — the VISUAL twin of the audio era cues. The scene wash is procedural (an SVG
 * gradient, no raster asset), so the atmosphere shifts across the saga's arc the way `chordForEra`
 * shifts the ambient pad: rooted/warm at the immigrant origins → luminous/vast at the stars. Keyed on
 * the SAME era-id keyword dimension as `ERA_CHORD` in ui/sound.ts so RB-10 can fold the two parallel
 * maps into one era table without re-deriving the bands. Pure data + pure functions — no DOM, no
 * Date/random; deterministic (same era-id + sense → identical ramp).
 *
 * The sense accent reuses the values SceneReader.svelte sets on `--sense-accent`, single-sourced here so
 * the wash and the prose edge-wash agree on what each sense looks like.
 */

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
 * Era → wash ramp, matched by the era-id keywords (same regexes as ERA_CHORD). Ordered origins → stars;
 * the first match wins, so new period ids inherit a sensible neighbour and the default is the rooted
 * origins ground. The hex pairs trace the arc: earthen browns → industrial slate → striving gold →
 * suspended violet → open luminous blue.
 */
const ERA_RAMP: Array<[RegExp, Omit<EraRamp, "id"> & { id: string }]> = [
  [/origins|1885|founding/i, { id: "origins", top: "#2a2018", bottom: "#0f0b07" }], // rooted, warm earth
  [/mogul|1964|industr/i, { id: "mogul", top: "#23262b", bottom: "#0d0f12" }], // industrial slate weight
  [/brand|primetime|ascent|1988|2004|2015/i, { id: "ascent", top: "#2e2616", bottom: "#120e06" }], // striving gold
  [/interregnum|mars|2021|2028/i, { id: "interregnum", top: "#1f1830", bottom: "#0a0714" }], // tense violet
  [/contact|interstellar|ascension|stars/i, { id: "stars", top: "#0f1d2e", bottom: "#040810" }], // open luminous deep
];

const DEFAULT_RAMP: EraRamp = { id: "origins", top: "#2a2018", bottom: "#0f0b07" };

/** Resolve the wash ramp for an era id (a wave/period id or a macro-act title — both carry the keywords). */
export function rampForEra(eraId: string): EraRamp {
  for (const [re, ramp] of ERA_RAMP) if (re.test(eraId)) return ramp;
  return DEFAULT_RAMP;
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
