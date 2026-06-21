import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { applyChoice } from "../../sim/effects";
import { createRng } from "../../sim/rng";
import { initState } from "../../sim/state";
import Dossier from "../Dossier.svelte";
import StatsView from "../StatsView.svelte";
import TimelineView from "../TimelineView.svelte";

const content = buildContent(validRaw());

function playedState() {
  const born = content.allEvents.find((e) => e.id === "ev_born");
  if (!born) throw new Error("no born");
  let s = initState(content, "seed");
  s = applyChoice(content, s, born, "cry_loud", createRng("seed")).state;
  return s;
}

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  host = document.createElement("div");
  host.style.width = "360px"; // uPlot needs a measurable width
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("Dossier", () => {
  it("shows all meters and current flags", () => {
    component = mount(Dossier, {
      target: host,
      props: { defs: content.meters, gameState: playedState() },
    });
    expect(host.textContent).toContain("Dossier");
    expect(host.textContent).toContain("Money");
    // The cry_loud flag (loud_baby) renders HUMANIZED, not as the raw flag id (PL-10).
    expect(host.textContent).toContain("Loud baby");
    expect(host.textContent).not.toContain("loud_baby");
  });
});

describe("TimelineView", () => {
  it("reveals only reached eras (no future spoilers) with the current one highlighted", () => {
    component = mount(TimelineView, { target: host, props: { content, gameState: playedState() } });
    // Still in era 0 (boyhood) → it shows; the future era must NOT be revealed.
    expect(host.textContent).toContain("Birth & Boyhood");
    expect(host.textContent).not.toContain("Apprentice Mogul");
    expect(host.querySelector(".era.current")).not.toBeNull();
    // A teaser stands in for the unwritten road ahead.
    expect(host.querySelector(".era.unwritten")).not.toBeNull();
  });

  it("reveals a later era once it has been reached", () => {
    const s = { ...playedState(), eraIndex: 1 };
    component = mount(TimelineView, { target: host, props: { content, gameState: s } });
    expect(host.textContent).toContain("Apprentice Mogul");
  });

  it("starts the timeline at the line's FOUNDING era — no pre-founding eras (PL-7)", () => {
    // A line founded in a later era ("mogul") must not show the earlier "boyhood" era it
    // never lived (the real-world bug: a 1885 line showing the 762 Caliphate era).
    const s = {
      ...playedState(),
      eraIndex: 1,
      founding: { momentId: "m", surname: "Vane", culture: "c", place: "p", era: "mogul" },
    };
    component = mount(TimelineView, { target: host, props: { content, gameState: s } });
    expect(host.textContent).toContain("Apprentice Mogul");
    expect(host.textContent).not.toContain("Birth & Boyhood");
  });
});

describe("StatsView", () => {
  it("mounts a uPlot chart canvas", async () => {
    component = mount(StatsView, { target: host, props: { content, gameState: playedState() } });
    // uPlot renders a <canvas> inside the chart container.
    await new Promise((r) => setTimeout(r, 50));
    expect(host.querySelector("canvas")).not.toBeNull();
  });

  it("labels the legend with meter DISPLAY names, not machine ids (PL-12)", async () => {
    component = mount(StatsView, { target: host, props: { content, gameState: playedState() } });
    await new Promise((r) => setTimeout(r, 50));
    const labels = [...host.querySelectorAll(".u-legend .u-label")].map((l) =>
      l.textContent?.trim(),
    );
    // The fixture's first linear meter is "power" → must render Title-Case "Power".
    const powerDef = content.meters.find((m) => m.id === "power");
    expect(powerDef).toBeDefined();
    expect(labels).toContain(powerDef?.label);
    expect(labels).not.toContain("power"); // not the lowercase machine id
  });
});
