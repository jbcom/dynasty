import type { MeterDelta } from "../sim/schema";

/**
 * Thin haptics bridge. Imports the Capacitor plugin lazily so web/test bundles
 * don't pull native code; silently no-ops where haptics are unavailable.
 */

/**
 * Magnitude of a choice's effect on the 0–100 meters, used to decide haptic
 * strength. Money is excluded because it's unbounded — a $1M swing shouldn't
 * read as a "heavy" hit.
 */
export function effectMagnitude(effects: MeterDelta): number {
  let total = 0;
  for (const [id, v] of Object.entries(effects)) {
    if (id === "money") continue;
    if (typeof v === "number") total += Math.abs(v);
  }
  return total;
}

type Style = "light" | "medium" | "heavy";

/** Pick a haptic style from an effect magnitude (linear meters are 0–100). */
export function styleForMagnitude(mag: number): Style {
  if (mag >= 25) return "heavy";
  if (mag >= 10) return "medium";
  return "light";
}

/** Fire a haptic impact appropriate to a choice's swing. No-op off-device. */
export async function impact(effects: MeterDelta): Promise<void> {
  const mag = effectMagnitude(effects);
  // Money is unbounded; ignore it for magnitude so a $1M swing isn't "heavy".
  const style = styleForMagnitude(mag);
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    } as const;
    await Haptics.impact({ style: map[style] });
  } catch {
    // Not on a device / plugin unavailable — fall back to the Vibration API.
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      const ms = style === "heavy" ? 40 : style === "medium" ? 20 : 10;
      navigator.vibrate(ms);
    }
  }
}
