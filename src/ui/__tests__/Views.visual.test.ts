import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, it } from "vitest";
import { page } from "vitest/browser";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { applyChoice } from "../../sim/effects";
import { createRng } from "../../sim/rng";
import { initState } from "../../sim/state";
import Dossier from "../Dossier.svelte";
import TimelineView from "../TimelineView.svelte";
import { applyBrandTokens, makeHost } from "./visualHarness";

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
  applyBrandTokens();
  host = makeHost(360);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("D5 views visual", () => {
  it("Dossier", async () => {
    component = mount(Dossier, {
      target: host,
      props: { defs: content.meters, gameState: playedState() },
    });
    await page.screenshot({ element: host.firstElementChild as Element });
  });

  it("Timeline", async () => {
    component = mount(TimelineView, { target: host, props: { content, gameState: playedState() } });
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
