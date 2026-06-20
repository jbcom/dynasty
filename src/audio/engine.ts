import * as Tone from "tone";

/**
 * Audio engine wrapping Tone.js. Builds a small graph — a master volume, a synth
 * for choice stingers, a membrane synth for meter blips, and a per-era ambient
 * pad. The AudioContext can only start after a user gesture, so `start()` must be
 * called from a click handler before any sound plays.
 */
export class AudioEngine {
  private started = false;
  private muted = false;
  private master!: Tone.Volume;
  private stinger!: Tone.Synth;
  private blip!: Tone.MembraneSynth;
  private pad!: Tone.PolySynth;
  private padLoop: Tone.Loop | null = null;
  private currentEra: string | null = null;
  /** Monotonic schedule cursor so back-to-back cues never share a start time. */
  private lastCueTime = 0;

  /** Next strictly-increasing schedule time for a one-shot cue. */
  private nextCueTime(): number {
    const now = Tone.now();
    this.lastCueTime = Math.max(now, this.lastCueTime + 0.02);
    return this.lastCueTime;
  }

  /** Build the graph and resume the context. Idempotent. */
  async start(): Promise<void> {
    if (this.started) return;
    await Tone.start();
    this.master = new Tone.Volume(-8).toDestination();
    this.stinger = new Tone.Synth({ oscillator: { type: "triangle" } }).connect(this.master);
    this.blip = new Tone.MembraneSynth().connect(this.master);
    this.pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 1.5, decay: 0.5, sustain: 0.6, release: 3 },
    }).connect(this.master);
    this.pad.volume.value = -22;
    this.started = true;
  }

  get isStarted(): boolean {
    return this.started;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.started) this.master.mute = muted;
  }

  /** Short positive/negative cue when a choice resolves. */
  playStinger(positive: boolean): void {
    if (!this.started || this.muted) return;
    this.stinger.triggerAttackRelease(positive ? "C5" : "G3", "16n", this.nextCueTime());
  }

  /** Tiny tick when a meter changes. */
  playBlip(): void {
    if (!this.started || this.muted) return;
    this.blip.triggerAttackRelease("C2", "32n", this.nextCueTime());
  }

  /**
   * Switch the ambient bed to an era. Each era gets a distinct root chord so the
   * mood shifts. Safe to call repeatedly; no-ops if already on that era.
   */
  setEra(eraId: string, chord: string[] = ["C3", "E3", "G3"]): void {
    if (!this.started || this.currentEra === eraId) return;
    this.currentEra = eraId;
    this.padLoop?.dispose();
    this.padLoop = new Tone.Loop((time) => {
      this.pad.triggerAttackRelease(chord, "2n", time);
    }, "2n").start(0);
    if (Tone.getTransport().state !== "started") Tone.getTransport().start();
  }

  /** Stop everything and free nodes. */
  dispose(): void {
    this.padLoop?.dispose();
    if (this.started) {
      this.stinger.dispose();
      this.blip.dispose();
      this.pad.dispose();
      this.master.dispose();
    }
    this.started = false;
    this.currentEra = null;
  }
}
