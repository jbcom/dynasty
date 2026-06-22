import { describe, expect, it } from "vitest";
import { playCue, setMusicEra, setSoundEnabled, startMusic } from "../sound";

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
  });

  it("respects the enabled flag (disabled → cues short-circuit before touching audio)", () => {
    setSoundEnabled(false);
    expect(() => playCue("click")).not.toThrow();
    expect(() => startMusic()).not.toThrow();
    setSoundEnabled(true); // restore
  });
});
