/**
 * ERA BANDS (RB-10) — the SINGLE source of the saga's era cues. The audio chord (ui/sound.ts) and the
 * visual wash ramp (render/palettes.ts) used to live in two parallel keyword-keyed maps that could
 * silently drift — a new era added to one and forgotten in the other meant the pad and the backdrop
 * disagreed about what era it is. This collapses both into ONE ordered table (origins → stars), keyed
 * on the same era-id keyword families, carrying BOTH cues per band so they can't diverge.
 *
 * Pure sim: no DOM, no audio/render imports, no Date/random. `chord` is plain note strings (no Tone.js
 * type leak), so this stays the dependency floor both the audio and render layers read through.
 */

/** One era band: its id, the era-id keyword family it matches, and both the audio + visual cues. */
export interface EraBand {
  /** Stable id (origins, mogul, ascent, interregnum, stars). */
  id: string;
  /** The era-id keyword family — first match wins, ordered origins → stars. */
  match: RegExp;
  /** Tone.js note names for the ambient pad chord (audio). */
  chord: readonly string[];
  /** The scene-wash vertical gradient (visual): warm origins → cool luminous stars. */
  ramp: { readonly top: string; readonly bottom: string };
}

/**
 * The era arc, origins → stars. chord values were `ERA_CHORD` (ui/sound.ts); ramp values were
 * `ERA_RAMP` (render/palettes.ts) — merged here row-for-row (both were keyed on the SAME families).
 */
export const ERA_BANDS: readonly EraBand[] = [
  {
    id: "origins",
    match: /origins|1885|founding/i,
    chord: ["C3", "E3", "G3"], // rooted, warm — the immigrant ground
    ramp: { top: "#2a2018", bottom: "#0f0b07" }, // warm earth
  },
  {
    id: "mogul",
    match: /mogul|1964|industr/i,
    chord: ["A2", "C3", "E3", "G3"], // a minor-7 weight as the line climbs
    ramp: { top: "#23262b", bottom: "#0d0f12" }, // industrial slate
  },
  {
    id: "ascent",
    match: /brand|primetime|ascent|1988|2004|2015/i,
    chord: ["D3", "F#3", "A3"], // brighter, striving
    ramp: { top: "#2e2616", bottom: "#120e06" }, // striving gold
  },
  {
    id: "interregnum",
    match: /interregnum|mars|2021|2028/i,
    chord: ["E3", "G#3", "B3", "D#4"], // tense, suspended major-7
    ramp: { top: "#1f1830", bottom: "#0a0714" }, // tense violet
  },
  {
    id: "stars",
    match: /contact|interstellar|ascension|stars/i,
    chord: ["G2", "D3", "A3", "E4"], // open fifths — luminous, vast
    ramp: { top: "#0f1d2e", bottom: "#040810" }, // open luminous deep
  },
];

/** The default band (rooted origins) when an era id matches no family. */
export const DEFAULT_ERA_BAND: EraBand = ERA_BANDS[0] as EraBand;

/** Resolve the era band for an era id (a wave/period id or a macro-act title — both carry the keywords). */
export function bandForEra(eraId: string): EraBand {
  for (const band of ERA_BANDS) if (band.match.test(eraId)) return band;
  return DEFAULT_ERA_BAND;
}
