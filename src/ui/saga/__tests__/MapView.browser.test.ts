import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { GameState } from "../../../sim/state";
import MapView from "../MapView.svelte";

/**
 * The MapView (VL-3) renders the dynasty's founding→stars journey over a GenAI cartographic base:
 * a lit path to the current macro-act, the current waypoint marked `here`, the unreached future dimmed,
 * and a caption counting stages remaining. It reads only `gameState.year`, so the tests drive it with a
 * minimal year-bearing state across the four macro-act bands (founding ≤1859 → ascension ≥2041).
 */

// MapView reads a single field; cast a minimal stand-in rather than build a full sim state.
const atYear = (year: number) => ({ year }) as unknown as GameState;

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

const stageLabel = (el: Element, label: string) =>
  Array.from(el.querySelectorAll(".stage")).find((s) => s.textContent?.trim() === label);

describe("MapView (journey)", () => {
  it("renders the cartographic base and the four journey waypoints", () => {
    component = mount(MapView, { target: host, props: { gameState: atYear(1776) } });
    const base = host.querySelector("img.base") as HTMLImageElement;
    expect(base.getAttribute("src")).toContain("/assets/generated/map/");
    // founding · convergence · emergence · the stars
    expect(host.querySelectorAll(".stage").length).toBe(4);
    expect(host.querySelectorAll("svg.route circle").length).toBe(4);
  });

  it("at the founding (1776) lights ONLY the first waypoint and counts 3 stages to the stars", () => {
    component = mount(MapView, { target: host, props: { gameState: atYear(1776) } });
    expect(stageLabel(host, "Founding")?.classList.contains("here")).toBe(true);
    expect(stageLabel(host, "Convergence")?.classList.contains("reached")).toBe(false);
    // Only the founding circle is `here`; future circles are not yet reached.
    expect(host.querySelectorAll("svg.route circle.here").length).toBe(1);
    expect(host.querySelector(".caption")?.textContent).toContain("3 stages from the stars");
  });

  it("advances the lit path as the line crosses macro-acts (emergence: 1950)", () => {
    component = mount(MapView, { target: host, props: { gameState: atYear(1950) } });
    expect(stageLabel(host, "Emergence")?.classList.contains("here")).toBe(true);
    expect(stageLabel(host, "Founding")?.classList.contains("reached")).toBe(true);
    expect(stageLabel(host, "Convergence")?.classList.contains("reached")).toBe(true);
    expect(stageLabel(host, "The Stars")?.classList.contains("reached")).toBe(false);
    // singular "stage" at one remaining
    expect(host.querySelector(".caption")?.textContent).toContain("1 stage from the stars");
  });

  it("at the stars (2200) marks the journey complete", () => {
    component = mount(MapView, { target: host, props: { gameState: atYear(2200) } });
    expect(stageLabel(host, "The Stars")?.classList.contains("here")).toBe(true);
    expect(host.querySelector(".caption")?.textContent).toContain("reached the stars");
  });
});
