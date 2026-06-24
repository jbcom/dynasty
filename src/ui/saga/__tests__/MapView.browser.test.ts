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
    expect(host.querySelectorAll("svg.route circle.waypoint").length).toBe(4);
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

  it("MAP-ERA-PROGRESS-RICHER: plots the exact generation marker + the caption's generation count", () => {
    // A founded line at generation 3 (g3) — the marker slides between the coarse waypoints, and the
    // caption names the generation (1-based: gen index 3 → "Generation 4 of 10").
    const gs = {
      year: 1900,
      family: {
        protagonistId: "m3",
        members: [{ id: "m3", generation: 3 }],
      },
    } as unknown as GameState;
    component = mount(MapView, { target: host, props: { gameState: gs } });
    expect(host.querySelector("svg.route circle.gen-marker")).not.toBeNull();
    expect(host.querySelector(".gen-note")?.textContent).toContain("Generation 4 of 10");
  });

  it("MAP-ERA-PROGRESS-RICHER: overlays a dot per rival line and names the convergence leader", () => {
    const gs = {
      year: 1900,
      family: { protagonistId: "m0", members: [{ id: "m0", generation: 1 }] },
    } as unknown as GameState;
    component = mount(MapView, {
      target: host,
      props: {
        gameState: gs,
        playerRung: 1,
        rivalStandings: [
          { id: "rival:italian", label: "The Ferraro line", rung: 4 },
          { id: "rival:ireland", label: "The Donnelly line", rung: 2 },
        ],
      },
    });
    // One faint dot per rival on the founding→stars axis.
    expect(host.querySelectorAll("svg.route circle.rival").length).toBe(2);
    // The highest-rung rival (rung 4 > player rung 1) is named as the leader.
    expect(host.querySelector(".rival-note")?.textContent).toContain("The Ferraro line");
  });

  it("MAP-ERA-PROGRESS-RICHER: still renders with no family + no rivals (graceful default)", () => {
    component = mount(MapView, { target: host, props: { gameState: atYear(1776) } });
    // The generation marker defaults to gen 0 (Generation 1); no rival dots, no leader note.
    expect(host.querySelector(".gen-note")?.textContent).toContain("Generation 1 of 10");
    expect(host.querySelectorAll("svg.route circle.rival").length).toBe(0);
    expect(host.querySelector(".rival-note")).toBeNull();
  });

  it("GA-MAP-ART: the cartographic base tracks the ERA — a 1700s year vs. a stellar year load different bases", () => {
    component = mount(MapView, { target: host, props: { gameState: atYear(1776) } });
    const founding = (
      host.querySelector("[data-testid='map-base']") as HTMLImageElement
    ).getAttribute("src");
    expect(founding).toBe("/assets/generated/map/map_founding_1700s.png");
    unmount(component);
    component = mount(MapView, { target: host, props: { gameState: atYear(2300) } });
    const stellar = (
      host.querySelector("[data-testid='map-base']") as HTMLImageElement
    ).getAttribute("src");
    expect(stellar).toBe("/assets/generated/map/map_stellar.png");
    expect(stellar).not.toBe(founding);
  });

  it("GA-MAP-ART: a missing era base falls back to the founding base, then hides (graceful degradation)", () => {
    // A near-future year whose era base may not be generated yet.
    component = mount(MapView, { target: host, props: { gameState: atYear(2100) } });
    const img = host.querySelector("[data-testid='map-base']") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/assets/generated/map/map_near_future.png");
    // First error → fall back to the founding base (which always exists).
    img.dispatchEvent(new Event("error"));
    expect(img.src).toContain("founding-map.png");
    // A second error (even the founding base missing) → hide so the CSS base shows through.
    img.dispatchEvent(new Event("error"));
    expect(img.style.display).toBe("none");
  });
});
