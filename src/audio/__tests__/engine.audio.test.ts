import { afterEach, describe, expect, it } from "vitest";
import { AudioEngine } from "../engine";

let engine: AudioEngine | undefined;

afterEach(() => {
  engine?.dispose();
  engine = undefined;
});

describe("AudioEngine", () => {
  it("is inert before start (no throw on play calls)", () => {
    engine = new AudioEngine();
    expect(engine.isStarted).toBe(false);
    // These must be safe no-ops pre-start.
    expect(() => engine?.playStinger(true)).not.toThrow();
    expect(() => engine?.playBlip()).not.toThrow();
    expect(() => engine?.setEra("boyhood")).not.toThrow();
    // GA-TTS: narration is a no-op (null) before start.
    expect(engine.playNarration("narration:founding:founding_1700s")).toBeNull();
  });

  it("builds the Tone graph on start", async () => {
    engine = new AudioEngine();
    await engine.start();
    expect(engine.isStarted).toBe(true);
    // Idempotent.
    await engine.start();
    expect(engine.isStarted).toBe(true);
  });

  it("plays stingers, blips, and switches eras after start", async () => {
    engine = new AudioEngine();
    await engine.start();
    expect(() => engine?.playStinger(true)).not.toThrow();
    expect(() => engine?.playStinger(false)).not.toThrow();
    expect(() => engine?.playBlip()).not.toThrow();
    expect(() => engine?.setEra("mogul", ["D3", "F3", "A3"])).not.toThrow();
  });

  it("honors mute", async () => {
    engine = new AudioEngine();
    await engine.start();
    engine.setMuted(true);
    expect(() => engine?.playStinger(true)).not.toThrow();
    // GA-TTS: muted → narration no-ops (null), never throws.
    expect(engine.playNarration("narration:finale:stellar")).toBeNull();
    engine.setMuted(false);
  });

  it("GA-TTS: plays a one-shot narration after start (missing asset degrades silently, no throw)", async () => {
    engine = new AudioEngine();
    await engine.start();
    // The asset isn't generated in tests — playNarration returns a Player and the onerror path cleans it up
    // silently (a 404/decode surfaces async). The call itself must never throw.
    expect(() => engine?.playNarration("narration:founding:midcentury")).not.toThrow();
  });

  it("can be disposed and is no longer started", async () => {
    engine = new AudioEngine();
    await engine.start();
    engine.dispose();
    expect(engine.isStarted).toBe(false);
  });
});
