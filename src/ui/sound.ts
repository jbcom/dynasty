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

/** Toggle whether cues play (from the `sound` setting). */
export function setSoundEnabled(on: boolean): void {
  enabled = on;
  sfx?.setMuted(!on);
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
