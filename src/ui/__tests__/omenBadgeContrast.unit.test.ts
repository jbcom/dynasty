import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * OMEN-BADGE-CONTRAST-AUDIT — the omen a11y badges carry the tone in TEXT (OMEN-TONE-A11Y), but a label only
 * helps if it's LEGIBLE: the text-on-fill must meet WCAG AA contrast (≥4.5:1 for normal text). This computes the
 * ratio from the BRAND TOKENS (the source of truth in src/ui/tokens.css), so a future token change that quietly
 * drops a badge below legible contrast fails here — the a11y win can't silently rot.
 *
 * Badge palettes (see PlayScreen.svelte .omen-badge):
 *   hope  → text --mmm-ink   on fill --mmm-gold
 *   dread → text --mmm-text (=--mmm-cream) on fill --mmm-red
 */

// Resolve the brand token hexes from tokens.css so the audit tracks the real values, not a hard-coded copy.
const tokensCss = readFileSync(fileURLToPath(new URL("../tokens.css", import.meta.url)), "utf8");
function token(name: string): string {
  // Match `--name: #rrggbb;` (the cream alias is resolved manually below).
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(tokensCss);
  if (!m?.[1]) throw new Error(`token --${name} not found as a hex in tokens.css`);
  return m[1];
}

// --mmm-text is `var(--mmm-cream)` — resolve the alias to its hex.
const INK = token("mmm-ink");
const GOLD = token("mmm-gold");
const RED = token("mmm-red");
const CREAM = token("mmm-cream");

// WCAG relative luminance + contrast ratio (https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio).
function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

describe("omen badge contrast (OMEN-BADGE-CONTRAST-AUDIT)", () => {
  it("each omen badge's text-on-fill meets WCAG AA (>= 4.5:1)", () => {
    const hope = contrast(INK, GOLD); // ink text on gold pill
    const dread = contrast(CREAM, RED); // cream text on red pill
    // Report the measured ratios — the audit's product.
    // (Read with --disable-console-intercept if tuning the palette.)
    console.log(
      `[omen-badge-contrast] hope(ink/gold)=${hope.toFixed(2)}:1 dread(cream/red)=${dread.toFixed(2)}:1`,
    );
    expect(hope, "hope badge (ink on gold) meets AA").toBeGreaterThanOrEqual(4.5);
    expect(dread, "dread badge (cream on red) meets AA").toBeGreaterThanOrEqual(4.5);
  });

  it("the contrast helper is sane (black/white = 21, identical = 1)", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrast("#777777", "#777777")).toBeCloseTo(1, 5);
  });
});
