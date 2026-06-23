import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * REDUCED-MOTION-AUDIT — a player who sets `prefers-reduced-motion: reduce` must not get the animated WebGL
 * backdrop or motion-heavy transitions. The behaviour is already in place; this guards it from silent regression
 * by asserting each motion-bearing surface still references the media query (CSS) — and that the ShaderBackdrop
 * additionally GATES its requestAnimationFrame loop on the matchMedia check (a static frame for reduced-motion).
 *
 * Source-level (not runtime) because jsdom/the test browser can't emulate the OS-level reduced-motion setting;
 * a missing reference is the regression we care about, and that's visible in the source.
 */

function src(rel: string): string {
  return readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), "utf8");
}

// The surfaces that carry motion (CSS transitions/animations or a rAF loop).
const MOTION_SURFACES = [
  "saga/ShaderBackdrop.svelte",
  "saga/SceneReader.svelte",
  "saga/SlideOutMenu.svelte",
  "EventCard.svelte",
  "MeterGauge.svelte",
  "screens/OnboardingScreen.svelte",
];

describe("reduced-motion audit (REDUCED-MOTION-AUDIT)", () => {
  it("every motion surface references prefers-reduced-motion", () => {
    for (const f of MOTION_SURFACES) {
      expect(src(f), `${f} honours prefers-reduced-motion`).toMatch(/prefers-reduced-motion/);
    }
  });

  it("the ShaderBackdrop gates its rAF loop on the reduced-motion (matchMedia) check", () => {
    const s = src("saga/ShaderBackdrop.svelte");
    // It reads the media query AND only starts the continuous loop when motion is allowed (a single static frame
    // otherwise). Assert both the matchMedia read and the requestAnimationFrame loop are present + co-located logic.
    expect(s).toMatch(/matchMedia\?\.\("\(prefers-reduced-motion: reduce\)"\)/);
    expect(s).toMatch(/requestAnimationFrame/);
    // The guard short-circuits BEFORE the loop (the static-frame branch returns early).
    const guardIdx = s.indexOf("prefers-reduced-motion");
    const loopIdx = s.indexOf("requestAnimationFrame(loop)");
    expect(guardIdx, "the reduced-motion guard precedes the rAF loop").toBeGreaterThan(0);
    expect(loopIdx, "the rAF loop exists").toBeGreaterThan(guardIdx);
  });
});
