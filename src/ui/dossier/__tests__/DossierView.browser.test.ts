import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { buildDossier, type DossierInput } from "../../../sim/dossier/dossier";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import DossierView from "../DossierView.svelte";

/**
 * VD-3 — the DossierView composes the typed panels into a briefing spread. The real data panels (chart/graph/
 * map) render from the pure spec; the figure + brief hold their place. Driven by a real buildDossier output.
 */

const input: DossierInput = {
  archetype: "crime",
  year: 1960,
  seed: "run1",
  series: { years: [1930, 1945, 1960], byMeter: { reputation: [10, 25, 40], heat: [5, 30, 55] } },
  rivals: [
    { id: "r1", label: "italian", rung: 4, fallen: false },
    { id: "r2", label: "irish", rung: 2, fallen: false },
    { id: "r3", label: "bavaria", rung: 0, fallen: true },
  ],
  rung: 3,
};

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  applyBrandTokens();
  host = makeHost();
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("DossierView (VD-3)", () => {
  it("renders the path-keyed masthead (crime → Intelligence Dossier, era-framed)", () => {
    component = mount(DossierView, { target: host, props: { dossier: buildDossier(input) } });
    const view = host.querySelector("[data-testid='dossier-view']");
    expect(view?.getAttribute("data-kind")).toBe("intelligence");
    expect(host.textContent).toMatch(/Intelligence Dossier/);
    expect(host.textContent).toMatch(/Mid-Century/);
  });

  it("renders the real data-viz panels — the rival GRAPH (a node per line) and the reach MAP", () => {
    component = mount(DossierView, { target: host, props: { dossier: buildDossier(input) } });
    // The graph is an SVG with the player + 3 rival nodes (4 circles).
    const graphCircles = host.querySelectorAll("svg circle");
    expect(graphCircles.length).toBeGreaterThanOrEqual(4);
    // The player node is labelled.
    expect(host.textContent).toMatch(/You/);
    // The reach map lights the eras up to mid-century (founding → midcentury = 5 lit stops).
    const lit = host.querySelectorAll(".reach .stop.lit");
    expect(lit.length).toBe(5);
    expect(host.querySelector(".reach .stop.current")).not.toBeNull();
  });

  it("shows the brief prose when resolved, and a pending line when not", () => {
    component = mount(DossierView, {
      target: host,
      props: {
        dossier: buildDossier(input),
        brief: ["The territory holds. The Italians press the docks."],
      },
    });
    expect(host.textContent).toMatch(/press the docks/);
    unmount(component);
    component = mount(DossierView, { target: host, props: { dossier: buildDossier(input) } });
    expect(host.textContent).toMatch(/Compiling the assessment/);
  });

  it("captures a mobile screenshot of the composed dossier", async () => {
    component = mount(DossierView, {
      target: host,
      props: {
        dossier: buildDossier(input),
        brief: ["A composed assessment for the visual review."],
      },
    });
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
