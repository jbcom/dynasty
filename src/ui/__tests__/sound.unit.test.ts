import { describe, expect, it } from "vitest";
import {
  chordForEra,
  playCue,
  playEndingSting,
  setMusicEra,
  setSoundEnabled,
  startMusic,
} from "../sound";

/**
 * The sound facade (PF-15/PF-17) is browser-guarded + fully try/caught — every entry point must be a
 * safe no-op off-browser (node tests, SSR) and never throw, since audio is non-essential to play.
 */

describe("sound facade", () => {
  it("all cue/music entry points no-op safely off-browser", () => {
    // In the node test environment there is no `window`, so these must not throw.
    expect(() => setSoundEnabled(false)).not.toThrow();
    expect(() => setSoundEnabled(true)).not.toThrow();
    expect(() => playCue("click")).not.toThrow();
    expect(() => playCue("stinger")).not.toThrow();
    expect(() => startMusic()).not.toThrow();
    expect(() => setMusicEra("origins")).not.toThrow();
    // RB-10: the ending sting is safe for every outcome (and an unknown one) off-browser.
    for (const o of ["stars", "contributed", "earthbound", "extinguished", "??"]) {
      expect(() => playEndingSting(o)).not.toThrow();
    }
  });

  it("respects the enabled flag (disabled → cues short-circuit before touching audio)", () => {
    setSoundEnabled(false);
    expect(() => playCue("click")).not.toThrow();
    expect(() => startMusic()).not.toThrow();
    setSoundEnabled(true); // restore
  });

  it("RB-3: distinct per-era ambient chords (mood deepens across the arc), with a rooted default", () => {
    const origins = chordForEra("origins");
    const stars = chordForEra("ascension-interstellar");
    expect(origins).toEqual(["C3", "E3", "G3"]); // rooted, warm
    expect(stars).not.toEqual(origins); // a different mood late in the arc
    expect(stars.length).toBeGreaterThanOrEqual(3);
    // An unknown era id falls back to the rooted default rather than throwing.
    expect(chordForEra("totally-unknown-era")).toEqual(["C3", "E3", "G3"]);
  });
});
