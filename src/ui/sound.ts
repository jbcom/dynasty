import { AudioEngine } from "../audio/engine";
import { Sfx, type SfxId } from "../audio/sfx";

/**
 * SOUND CUES (PF-15) — a single lazily-constructed Sfx the play surface uses for page-turn + choice
 * cues. Gated by the player's `sound` setting (setEnabled). Browser-only + fire-and-forget: Howl is
 * constructed on first cue (so SSR/tests don't touch the audio API), and every play is wrapped so a
 * missing file or a blocked audio context can never break play. Cues are driven by taps, so the
 * browser's autoplay policy is satisfied.
 */

let sfx: Sfx | null = null;
let enabled = true;

// The Tone.js music graph (per-era ambient bed). Started lazily on the first play gesture (autoplay
// policy) and kept in sync with the run's era. Separate from the one-shot Sfx.
let music: AudioEngine | null = null;
let pendingEra: string | null = null;

/**
 * Per-era ambient CHORD (RB-3): when no `/assets/audio/<era>.ogg` exists, AudioEngine.setEra falls back
 * to a synth pad — give each era a distinct chord so the mood deepens across the run's arc (warm/rooted
 * early → open/luminous late) instead of every era playing the same C-E-G. Matched by era-id prefix so
 * new period ids inherit a sensible neighbour; the default is the rooted origins chord.
 */
const ERA_CHORD: Array<[RegExp, string[]]> = [
  [/origins|1885|founding/i, ["C3", "E3", "G3"]], // rooted, warm — the immigrant ground
  [/mogul|1964|industr/i, ["A2", "C3", "E3", "G3"]], // a minor-7 weight as the line climbs
  [/brand|primetime|ascent|1988|2004|2015/i, ["D3", "F#3", "A3"]], // brighter, striving
  [/interregnum|mars|2021|2028/i, ["E3", "G#3", "B3", "D#4"]], // tense, suspended major-7
  [/contact|interstellar|ascension|stars/i, ["G2", "D3", "A3", "E4"]], // open fifths — luminous, vast
];
export function chordForEra(eraId: string): string[] {
  for (const [re, chord] of ERA_CHORD) if (re.test(eraId)) return chord;
  return ["C3", "E3", "G3"];
}

/** Toggle whether cues play (from the `sound` setting). */
export function setSoundEnabled(on: boolean): void {
  enabled = on;
  sfx?.setMuted(!on);
  music?.setMuted(!on);
}

/**
 * Start the ambient music graph — MUST be called from a user gesture (a tap), per browser autoplay
 * policy. Idempotent + fully guarded; once started, any pending era is applied. No-op when sound is
 * disabled or off-browser.
 */
export function startMusic(): void {
  if (!enabled || typeof window === "undefined") return;
  try {
    if (!music) {
      music = new AudioEngine();
      music.setMuted(!enabled);
    }
    if (!music.isStarted) {
      // start() is async; its rejection won't reach the surrounding try/catch, so handle it here.
      music
        .start()
        .then(() => {
          if (pendingEra && music) music.setEra(pendingEra, chordForEra(pendingEra));
        })
        .catch(() => {
          // Music is non-essential — a blocked audio context must never surface as an unhandled rejection.
        });
    }
  } catch {
    // Music is non-essential.
  }
}

/** Switch the ambient bed to a run era. Remembered + applied once the graph has started. */
export function setMusicEra(eraId: string): void {
  pendingEra = eraId;
  try {
    if (music?.isStarted) music.setEra(eraId, chordForEra(eraId));
  } catch {
    // ignore
  }
}

/** Play a one-shot cue if sound is enabled. No-ops outside the browser or on any audio failure. */
export function playCue(id: SfxId): void {
  if (!enabled || typeof window === "undefined") return;
  try {
    if (!sfx) {
      sfx = new Sfx();
      sfx.setMuted(!enabled);
    }
    sfx.play(id);
  } catch {
    // Audio is non-essential — never let a cue failure interrupt play.
  }
}
