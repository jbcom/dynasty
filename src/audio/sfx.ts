import { Howl } from "howler";

/**
 * One-shot sound effects via Howler.js. Howler handles ogg/mp3/wav with format
 * fallback and its own pooling, so it's a better fit for fire-and-forget cues
 * than Tone.js (which we keep for the synth graph + musical scheduling). SFX are
 * lazily constructed on first use and safely no-op if a file is missing.
 */
export type SfxId = "stinger" | "achievement" | "click" | "victory";

const SOURCES: Record<SfxId, string[]> = {
  stinger: ["/assets/audio/stinger.ogg"],
  achievement: ["/assets/audio/achievement.ogg"],
  click: ["/assets/audio/click.ogg"],
  victory: ["/assets/audio/victory_stinger.ogg"],
};

export class Sfx {
  private cache = new Map<SfxId, Howl>();
  private muted = false;

  private get(id: SfxId): Howl {
    let howl = this.cache.get(id);
    if (!howl) {
      howl = new Howl({ src: SOURCES[id], volume: 0.6, preload: true });
      this.cache.set(id, howl);
    }
    return howl;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /** Play a one-shot effect. No-ops when muted. */
  play(id: SfxId): void {
    if (this.muted) return;
    try {
      this.get(id).play();
    } catch {
      // Audio unavailable (SSR / no context yet) — ignore.
    }
  }

  /** Pre-warm sounds so the first real play has no decode latency. */
  preload(...ids: SfxId[]): void {
    for (const id of ids) this.get(id);
  }

  dispose(): void {
    for (const howl of this.cache.values()) howl.unload();
    this.cache.clear();
  }
}
