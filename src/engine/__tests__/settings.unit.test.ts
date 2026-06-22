import { describe, expect, it } from "vitest";
import {
  clearSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  setGeminiKey,
  setLiveExtrapolation,
  setSound,
} from "../settings";
import { memoryStorage } from "../storage";

/**
 * FD-12 — player settings (Gemini key + live-extrapolation toggle) persisted via
 * the storage facade. Live mode requires a key; the key clears cleanly.
 */

describe("FD-12 settings", () => {
  it("defaults to no key and live mode off", async () => {
    const s = memoryStorage();
    expect(await loadSettings(s)).toEqual(DEFAULT_SETTINGS);
  });

  it("persists and reloads the Gemini key", async () => {
    const s = memoryStorage();
    await setGeminiKey(s, "  my-key  ");
    expect((await loadSettings(s)).geminiKey).toBe("my-key");
  });

  it("live mode reports OFF without a key even if the flag was set", async () => {
    const s = memoryStorage();
    await setLiveExtrapolation(s, true);
    expect((await loadSettings(s)).liveExtrapolation).toBe(false);
  });

  it("live mode reports ON only with both a key and the flag", async () => {
    const s = memoryStorage();
    await setGeminiKey(s, "k");
    await setLiveExtrapolation(s, true);
    expect((await loadSettings(s)).liveExtrapolation).toBe(true);
  });

  it("sound defaults ON and round-trips off/on (PF-15)", async () => {
    const s = memoryStorage();
    expect((await loadSettings(s)).sound).toBe(true); // default on (tap-driven, autoplay-safe)
    await setSound(s, false);
    expect((await loadSettings(s)).sound).toBe(false);
    await setSound(s, true);
    expect((await loadSettings(s)).sound).toBe(true);
  });

  it("clearing the key clears it and disables live mode on next load", async () => {
    const s = memoryStorage();
    await setGeminiKey(s, "k");
    await setLiveExtrapolation(s, true);
    await setGeminiKey(s, "");
    const after = await loadSettings(s);
    expect(after.geminiKey).toBe("");
    expect(after.liveExtrapolation).toBe(false);
  });

  it("clearSettings wipes both key and toggle", async () => {
    const s = memoryStorage();
    await setGeminiKey(s, "k");
    await setLiveExtrapolation(s, true);
    await clearSettings(s);
    expect(await loadSettings(s)).toEqual(DEFAULT_SETTINGS);
  });
});
