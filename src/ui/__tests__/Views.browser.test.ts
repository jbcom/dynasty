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
    expect(host.textContent).toContain("loud_baby"); // flag set by cry_loud
  });
});

describe("TimelineView", () => {
  it("renders an era band with the current era highlighted", () => {
    component = mount(TimelineView, { target: host, props: { content, gameState: playedState() } });
    expect(host.textContent).toContain("Birth & Boyhood");
    expect(host.textContent).toContain("Apprentice Mogul");
    expect(host.querySelector(".era.current")).not.toBeNull();
  });
});

describe("StatsView", () => {
  it("mounts a uPlot chart canvas", async () => {
    component = mount(StatsView, { target: host, props: { content, gameState: playedState() } });
    // uPlot renders a <canvas> inside the chart container.
    await new Promise((r) => setTimeout(r, 50));
    expect(host.querySelector("canvas")).not.toBeNull();
  });
});
