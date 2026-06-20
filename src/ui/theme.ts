import type { MeterId } from "../sim/schema";

/**
 * TS-side handles for design tokens. Components should prefer CSS `var(--mmm-*)`;
 * this map exists for canvas/SVG code (gauges, the D3 graph) that needs literal
 * color strings at runtime. Keep in sync with tokens.css and data/meters.json.
 */
export const METER_CSS_VAR: Record<MeterId, string> = {
  money: "var(--mmm-meter-money)",
  power: "var(--mmm-meter-power)",
  reputation: "var(--mmm-meter-reputation)",
  loyalty: "var(--mmm-meter-loyalty)",
  health: "var(--mmm-meter-health)",
  heat: "var(--mmm-meter-heat)",
};

/** Read a resolved token value from the document (browser only). */
export function tokenValue(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Format a money value as a net-worth string ($1.2B, $340M, $12K, $900). */
export function formatMoney(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${Math.round(abs)}`;
}
