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
      music.start().then(() => {
        if (pendingEra && music) music.setEra(pendingEra);
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
    if (music?.isStarted) music.setEra(eraId);
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
