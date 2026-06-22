import { AudioEngine } from "../audio/engine";
import { Sfx, type SfxId } from "../audio/sfx";
import { bandForEra } from "../sim/eras";

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
// A one-shot ending sting requested before the graph started — applied AFTER pendingEra in start()'s
// resolve so it overrides the era bed (RB-10). Lets the sting land for a user who reaches the ending
// without ever tapping a play gesture (the case where audible punctuation matters most).
let pendingStingChord: string[] | null = null;

/**
 * Per-era ambient CHORD (RB-3): when no `/assets/audio/<era>.ogg` exists, AudioEngine.setEra falls back
 * to a synth pad — each era gets a distinct chord so the mood deepens across the run's arc (warm/rooted
 * early → open/luminous late). The chord comes from the SINGLE era table in sim/eras.ts (RB-10), the
 * same one the visual wash reads, so the audio and the backdrop can never disagree about the era.
 */
export function chordForEra(eraId: string): string[] {
  return [...bandForEra(eraId).chord];
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
          if (!music) return;
          // A pending sting OVERRIDES the era bed — apply only it (one setEra, no double-trigger pop).
          // Otherwise apply the run's pending era. Either way exactly one chord triggers on start.
          if (pendingStingChord) {
            music.setEra("ending-sting", pendingStingChord);
            pendingStingChord = null;
          } else if (pendingEra) {
            music.setEra(pendingEra, chordForEra(pendingEra));
          }
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

/**
 * The ending STING (RB-10) — a one-shot pad chord that colours the saga's close by its convergence
 * outcome: stars = the luminous open-fifths chord, contributed = the striving ascent chord, earthbound
 * = the rooted origins chord, extinguished = a low minor fall. Reuses the ambient pad (setEra triggers
 * the chord once), gated by the sound setting; starts the graph if a prior tap hasn't. No-op off-browser
 * or on any audio failure — the ending must render with or without sound.
 */
// Three stings reuse the ambient band chords (via the single ERA_BANDS table, so a chord tuned in
// eras.ts can't drift from its sting); extinguished is an intentional low minor fall with no band.
// EARTHBOUND_STING is the guaranteed fallback for an unknown outcome (so the lookup is never undefined).
const EARTHBOUND_STING: string[] = [...bandForEra("origins").chord]; // rooted, plain
const ENDING_STING: Record<string, string[]> = {
  stars: [...bandForEra("stars").chord], // open fifths — luminous, vast
  contributed: [...bandForEra("ascent").chord], // striving, bright
  earthbound: EARTHBOUND_STING,
  extinguished: ["C3", "Eb3", "G3", "C2"], // a low minor fall — intentionally unique, not in ERA_BANDS
};
export function playEndingSting(outcome: string): void {
  if (!enabled || typeof window === "undefined") return;
  // Guard the lookup against arbitrary keys (no object-injection): only a known outcome selects its
  // chord; anything else falls to the rooted earthbound sting.
  const chord: string[] =
    (Object.hasOwn(ENDING_STING, outcome) ? ENDING_STING[outcome] : undefined) ?? EARTHBOUND_STING;
  try {
    // If the graph is already running, apply now; otherwise stash it so start()'s resolve applies it
    // (after the era bed) — so the sting lands even for a user who reached the ending without a prior tap.
    if (music?.isStarted) {
      music.setEra(`ending:${outcome}`, chord);
    } else {
      pendingStingChord = chord;
      startMusic();
    }
  } catch {
    // The sting is non-essential — never let it break the ending screen.
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
