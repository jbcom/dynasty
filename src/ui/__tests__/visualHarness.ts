/**
 * Shared harness for browser-mode component/visual tests. Centralizes the
 * canonical `--mmm-*` brand token set (previously copied — and drifting — across
 * seven test files) and the mount/teardown lifecycle, so every screenshot
 * renders against the identical palette.
 */

/** The full brand token map mirrored from tokens.css (the values components read at render time). */
const BRAND_TOKENS: Record<string, string> = {
  "--mmm-gold": "#d4af37",
  "--mmm-gold-bright": "#f2cf52",
  "--mmm-gold-deep": "#a8841f",
  "--mmm-red": "#b22234",
  "--mmm-red-deep": "#7a1f2b",
  "--mmm-navy": "#0a1633",
  "--mmm-navy-light": "#16264f",
  "--mmm-navy-deep": "#050b1c",
  "--mmm-cream": "#f5f0e1",
  "--mmm-ink": "#11151f",
  "--mmm-surface": "#16264f",
  "--mmm-surface-raised": "#1d3060",
  "--mmm-text": "#f5f0e1",
  "--mmm-text-dim": "#b9c2da",
  "--mmm-accent": "#d4af37",
  "--mmm-extrapolated": "#9b6dff",
  "--mmm-startrek": "#2fb6c9",
  "--mmm-crit": "#ff5247",
  "--mmm-meter-money": "#d4af37",
  "--mmm-meter-power": "#7a1f2b",
  "--mmm-meter-reputation": "#c08a2e",
  "--mmm-meter-loyalty": "#274690",
  "--mmm-meter-health": "#b03030",
  "--mmm-meter-heat": "#e2562a",
  "--mmm-radius": "8px",
  "--mmm-radius-lg": "12px",
  "--mmm-gap": "10px",
  "--mmm-pad": "12px",
  "--mmm-font-display": "Georgia, serif",
  "--mmm-shadow": "0 4px 16px rgba(0,0,0,0.4)",
  "--mmm-shadow-gold": "0 0 12px rgba(212,175,55,0.35)",
  "--mmm-dur": "280ms",
  "--mmm-dur-fast": "160ms",
  "--mmm-ease": "cubic-bezier(0.22,1,0.36,1)",
};

/** Apply the full canonical brand palette + page background to the document. */
export function applyBrandTokens(): void {
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(BRAND_TOKENS)) root.setProperty(k, v);
  document.body.style.background = BRAND_TOKENS["--mmm-navy"] ?? "#0a1633";
}

/** Create a mount host with a fixed mobile width; returns it for mount targets. */
export function makeHost(width = 412): HTMLElement {
  const host = document.createElement("div");
  host.style.width = `${width}px`;
  document.body.appendChild(host);
  return host;
}
