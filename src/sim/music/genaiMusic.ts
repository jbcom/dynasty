/**
 * GA-MUSIC (GM-1) — pure Lyria prompts for the per-era ambient SCORE. The AudioEngine already loads
 * `/assets/audio/<track>.ogg` per era (with a synth-chord fallback); this generates an era-appropriate
 * generative score for each of the 10 ambientTrack slots so the bed SHIFTS as the dynasty moves through the
 * centuries. The score is GENERATED OFFLINE (a Lyria realtime stream captured to an .ogg) — no API at sim
 * runtime (sim purity). Spec: docs/.../genai-surface-audit + the directive GA-MUSIC item.
 *
 * Pure prompt strings + a stable track list; the live Lyria client + capture are the offline runner's job.
 */

/** The 10 ambient-track slots (eras share tracks; see src/data/eras/index.json `ambientTrack`). */
export type MusicTrack =
  | "boyhood"
  | "mogul"
  | "brand"
  | "primetime"
  | "ascent"
  | "interregnum"
  | "victory"
  | "atomic"
  | "unification"
  | "redplanet";

/** Every track slot, in chronological order — the offline runner sweeps these. */
export const MUSIC_TRACKS: readonly MusicTrack[] = [
  "boyhood",
  "mogul",
  "brand",
  "primetime",
  "ascent",
  "interregnum",
  "victory",
  "atomic",
  "unification",
  "redplanet",
];

/** The era character each track scores — a Lyria weighted-prompt describing the bed's mood + instrumentation. */
const TRACK_MOOD: Record<MusicTrack, string> = {
  boyhood:
    "a tender, nascent ambient score for an origin / boyhood era: warm strings, soft piano, a hopeful unhurried theme",
  mogul:
    "a striving, mid-century-mercantile ambient bed: brushed jazz drums, upright bass, a confident climbing motif",
  brand:
    "a glossy 1980s boom-and-brand ambient score: analog synth pads, restrained drum machine, neon ambition",
  primetime:
    "a slick prime-time broadcast ambient bed: polished electronic textures, a bright televisual sheen, momentum",
  ascent:
    "a tense, contemporary ascent ambient score: pulsing low synth, sparse percussion, gathering power and unease",
  interregnum:
    "a brooding interregnum ambient bed: minor drones, distant strings, a held breath between reigns",
  victory:
    "a triumphant ascendancy ambient score: swelling brass and strings, a stately victorious theme, monumental",
  atomic:
    "a dread, atomic-horror ambient bed: ominous low drones, metallic shimmer, the hush before catastrophe",
  unification:
    "a vast, unifying near-future ambient score: shimmering pads, a wide hopeful chord movement, scale and order",
  redplanet:
    "an awed, interstellar ambient bed: weightless drones, distant choir-like pads, the cold grandeur of the stars",
};

/** The deterministic key for a track's generated score asset (the .ogg stem the AudioEngine loads). */
export function musicTrackKey(track: MusicTrack): string {
  return track;
}

/**
 * Build the Lyria weighted-prompt text for a track's era score (GM-1). A LOOPABLE ambient bed (no abrupt
 * starts/ends), instrumental, period-true. Pure. The offline runner passes this to ai.live.music as the
 * weighted prompt and captures the stream to `/assets/audio/<track>.ogg`.
 */
export function buildMusicPrompt(track: MusicTrack): string {
  return [
    TRACK_MOOD[track],
    "Instrumental only, no vocals. A seamless, LOOPABLE ambient bed for a narrative game — slow-evolving,",
    "never abrupt, sits under prose without demanding attention. Period-true to its era.",
  ].join(" ");
}
