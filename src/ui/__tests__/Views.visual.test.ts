import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, it } from "vitest";
import { buildContent } from "../../sim/content";
import { applyChoice } from "../../sim/effects";
import { createRng } from "../../sim/rng";
import { validRaw } from "../../sim/__tests__/fixtures";
import { initState } from "../../sim/state";
import Dossier from "../Dossier.svelte";
import TimelineView from "../TimelineView.svelte";

const content = buildContent(validRaw());

function playedState() {
  const born = content.allEvents.find((e) => e.id === "ev_born");
  const school = content.allEvents.find((e) => e.id === "ev_military_school");
  if (!born || !school) throw new Error("fixtures missing");
  let s = initState(content, "seed");
  s = applyChoice(content, s, born, "cry_loud", createRng("seed")).state;
  s = applyChoice(content, s, school, "excel", createRng("seed")).state;
  return s;
}

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  const r = document.documentElement.style;
  for (const [k, v] of Object.entries({
    "--mmm-gold": "#d4af37",
    "--mmm-gold-deep": "#a8841f",
    "--mmm-surface": "#16264f",
    "--mmm-text": "#f5f0e1",
    "--mmm-text-dim": "#b9c2da",
    "--mmm-extrapolated": "#9b6dff",
    "--mmm-pad": "16px",
    "--mmm-radius": "8px",
    "--mmm-font-display": "Georgia, serif",
    "--mmm-meter-money": "#d4af37",
    "--mmm-meter-power": "#7a1f2b",
    "--mmm-meter-reputation": "#c08a2e",
    "--mmm-meter-loyalty": "#274690",
    "--mmm-meter-health": "#b03030",
    "--mmm-meter-heat": "#e2562a",
  })) {
    r.setProperty(k, v);
  }
  document.body.style.background = "#0a1633";
  host = document.createElement("div");
  host.style.width = "360px";
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("D5 views visual", () => {
  it("Dossier", async () => {
    component = mount(Dossier, { target: host, props: { defs: content.meters, gameState: playedState() } });
    await page.screenshot({ element: host.firstElementChild as Element });
  });

  it("Timeline", async () => {
    component = mount(TimelineView, { target: host, props: { content, gameState: playedState() } });
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
