/**
 * ERA BANDS — the single source of the per-era ambient CHORD (RB-10). `chordForEra` (ui/sound.ts) reads
 * this one ordered table (origins → stars), keyed on the era-id keyword families, so the pad mood
 * deepens across the run's arc and a new era is added in exactly one place.
 *
 * Pure sim: no DOM, no audio import, no Date/random. `chord` is plain note strings (no Tone.js type
 * leak), so this stays the dependency floor the audio layer reads through.
 *
 * (RB-10 originally also carried a visual `ramp` for an asset-compositing wash; that subsystem was
 * removed — UI atmosphere is Svelte + CSS, not asset layers — so this is chord-only.)
 */

/** One era band: its id, the era-id keyword family it matches, and the ambient pad chord. */
export interface EraBand {
  /** Stable id (origins, mogul, ascent, interregnum, stars). */
  id: string;
  /** The era-id keyword family — first match wins, ordered origins → stars. */
  match: RegExp;
  /** Tone.js note names for the ambient pad chord. */
  chord: readonly string[];
}

/** The era arc, origins → stars (chord mood: rooted/warm early → open/luminous late). */
export const ERA_BANDS: readonly EraBand[] = [
  { id: "origins", match: /origins|1885|founding/i, chord: ["C3", "E3", "G3"] }, // rooted, warm
  { id: "mogul", match: /mogul|1964|industr/i, chord: ["A2", "C3", "E3", "G3"] }, // minor-7 weight
  { id: "ascent", match: /brand|primetime|ascent|1988|2004|2015/i, chord: ["D3", "F#3", "A3"] }, // striving
  { id: "interregnum", match: /interregnum|mars|2021|2028/i, chord: ["E3", "G#3", "B3", "D#4"] }, // suspended maj7
  { id: "stars", match: /contact|interstellar|ascension|stars/i, chord: ["G2", "D3", "A3", "E4"] }, // open fifths
];

/** The default band (rooted origins) when an era id matches no family. */
export const DEFAULT_ERA_BAND: EraBand = ERA_BANDS[0] as EraBand;

/** Resolve the era band for an era id (a wave/period id or a macro-act title — both carry the keywords). */
export function bandForEra(eraId: string): EraBand {
  for (const band of ERA_BANDS) if (band.match.test(eraId)) return band;
  return DEFAULT_ERA_BAND;
}
