import type { MeterDef, MeterDelta, MeterId } from "./schema";

/** Current value of every meter. */
export type Meters = Record<MeterId, number>;

/** Clamp a value into a meter's [min, max] range. */
export function clampMeter(def: MeterDef, value: number): number {
  if (value < def.min) return def.min;
  if (value > def.max) return def.max;
  return value;
}

/** Build the starting Meters record from meter definitions. */
export function initMeters(defs: readonly MeterDef[]): Meters {
  const meters = {} as Meters;
  for (const def of defs) {
    meters[def.id] = clampMeter(def, def.start);
  }
  return meters;
}

/**
 * Apply a delta map to meters, clamped per definition. Returns a NEW Meters
 * object (pure — never mutates the input). Unknown meter keys are ignored.
 */
export function applyDelta(defs: readonly MeterDef[], meters: Meters, delta: MeterDelta): Meters {
  const byId = new Map(defs.map((d) => [d.id, d]));
  const next: Meters = { ...meters };
  for (const [id, amount] of Object.entries(delta) as [MeterId, number][]) {
    const def = byId.get(id);
    if (!def || amount === undefined) continue;
    next[id] = clampMeter(def, (next[id] ?? def.start) + amount);
  }
  return next;
}

/**
 * Display value for a meter. Log-scaled meters (Money) report their raw value
 * (callers format as net worth); linear meters report the clamped value. The
 * separate `meterFraction` gives a 0–1 fill ratio for gauges.
 */
export function meterFraction(def: MeterDef, value: number): number {
  const span = def.max - def.min;
  if (span <= 0) return 0;
  if (def.scale === "log") {
    // Map [min,max] onto a log curve so early money growth is visible.
    const safeMin = Math.max(def.min, 1);
    const v = Math.max(value, safeMin);
    const frac =
      (Math.log10(v) - Math.log10(safeMin)) / (Math.log10(def.max) - Math.log10(safeMin));
    return Math.min(1, Math.max(0, frac));
  }
  return Math.min(1, Math.max(0, (value - def.min) / span));
}

/** Whether a meter is in its critical-low band. */
export function isCritLow(def: MeterDef, value: number): boolean {
  return def.critLow !== undefined && value <= def.critLow;
}

/** Whether a meter is in its critical-high band. */
export function isCritHigh(def: MeterDef, value: number): boolean {
  return def.critHigh !== undefined && value >= def.critHigh;
}
