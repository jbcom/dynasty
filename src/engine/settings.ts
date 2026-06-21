import type { Storage } from "./storage";

/**
 * FD-12 — player SETTINGS persisted via the same storage facade as saves
 * (Capacitor Preferences on device — the secure on-device store — localStorage on
 * web). Holds the player's OWN Gemini API key (for optional runtime live
 * extrapolation, Mode B) and the live-extrapolation toggle. The key is NEVER
 * bundled or committed; it lives only on the player's device. Default: live mode
 * OFF (the baked FD-11 content is the default infinite-enough pool).
 */

const KEY_GEMINI = "dynasty.settings.geminiKey.v1";
const KEY_LIVE = "dynasty.settings.liveExtrapolation.v1";

export interface Settings {
  /** The player's Gemini API key, or "" if unset. */
  geminiKey: string;
  /** Whether runtime live extrapolation is enabled (requires a key). */
  liveExtrapolation: boolean;
}

export const DEFAULT_SETTINGS: Settings = { geminiKey: "", liveExtrapolation: false };

/** Read settings from storage, applying defaults for anything unset. */
export async function loadSettings(storage: Storage): Promise<Settings> {
  const [key, live] = await Promise.all([storage.get(KEY_GEMINI), storage.get(KEY_LIVE)]);
  return {
    geminiKey: key ?? DEFAULT_SETTINGS.geminiKey,
    // Live mode requires a key — never report it on without one.
    liveExtrapolation: live === "true" && !!key,
  };
}

/** Persist the Gemini key (clears the stored value when empty). */
export async function setGeminiKey(storage: Storage, key: string): Promise<void> {
  const trimmed = key.trim();
  if (trimmed) await storage.set(KEY_GEMINI, trimmed);
  else await storage.remove(KEY_GEMINI);
}

/** Persist the live-extrapolation toggle. */
export async function setLiveExtrapolation(storage: Storage, on: boolean): Promise<void> {
  await storage.set(KEY_LIVE, on ? "true" : "false");
}

/** Clear all stored settings (key + toggle). */
export async function clearSettings(storage: Storage): Promise<void> {
  await Promise.all([storage.remove(KEY_GEMINI), storage.remove(KEY_LIVE)]);
}
