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

  it("VD-6: captures the FOUNDING economic dossier with its real generated figure + brief", async () => {
    // The economic founding portfolio figure exists (generated in VD-6) — this shows the full composed
    // set piece (atmospheric plate + brief + real chart/graph/map) for the visual review.
    const founding = buildDossier({
      archetype: "economic",
      year: 1776,
      seed: "found1",
      series: {
        years: [1776, 1790, 1805],
        byMeter: { reputation: [5, 18, 35], money: [2, 10, 24] },
      },
      rivals: [
        { id: "r1", label: "italian", rung: 1, fallen: false },
        { id: "r2", label: "irish", rung: 0, fallen: false },
      ],
      rung: 1,
    });
    // No brief override — DossierView LOADS the real generated brief from dossierBriefs.json by its key.
    component = mount(DossierView, { target: host, props: { dossier: founding } });
    // The figure path resolves to the generated portfolio plate.
    const img = host.querySelector("img.figure") as HTMLImageElement | null;
    expect(img?.getAttribute("src")).toContain("dossier_fig_portfolio_founding_1700s_economic.png");
    // The generated path-voice brief loaded (the magnate assessment of {family_name}'s position) — NOT the
    // pending placeholder.
    expect(host.textContent).not.toMatch(/Compiling the assessment/);
    expect(host.textContent).toMatch(/\{family_name\}|interest|tier|position/i);
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
