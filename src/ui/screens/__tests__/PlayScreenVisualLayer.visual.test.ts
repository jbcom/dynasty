import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import type { GameView } from "../../../engine/loop";
import { validRaw } from "../../../sim/__tests__/fixtures";
import { buildContent } from "../../../sim/content";
import { initMeters } from "../../../sim/meters";
import { SceneSchema } from "../../../sim/saga/schema";
import { initState } from "../../../sim/state";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import PlayScreen from "../PlayScreen.svelte";

/**
 * VL-4 — compose + verify the full VISUAL LAYER on the play screen, mobile-first (412px / Pixel-5a class).
 * The two GenAI signature-style pieces from VL-2b (the generation PORTRAIT beside the prose) and VL-3 (the
 * era-progressing journey MAP tab) must compose together over the SceneReader: the portrait keys off the
 * `spine:gN:` scene id + founder gender; the Map tab is reachable (gated on a founded `family`).
 */

const content = buildContent(validRaw());

// A spine scene (id `spine:g0:...`) is what triggers the generation portrait beside the prose.
const spineScene = SceneSchema.parse({
  id: "spine:g0:open",
  sense: "smell",
  prose: [
    "The sour tang of black powder and river-damp pine clung to the rafters of the printing house.",
    "Outside, the cobblestones rattled with the iron-shod wheels of wagons carrying nervous delegates.",
  ],
});

function view(): GameView {
  const base = initState(content, "seed");
  const state = {
    ...base,
    meters: { ...initMeters(content.meters), money: 5_000_000, heat: 40 },
    year: 1776,
    // A live family unlocks the Map tab. The portrait derives gender from founding?.gender, defaulting to
    // "male" when founding is unset — so the spine_g0_male variant loads without a full founding record.
    // biome-ignore lint/suspicious/noExplicitAny: MapView + the tab gate only need `family` to be defined.
    family: { members: [] } as any,
  };
  return {
    state,
    currentEvent: null,
    saga: {
      actTitle: "Act I — The Crucible of Flint and Ink",
      scene: spineScene,
      threads: [],
      ended: false,
    },
    glimpses: [],
    rivalStandings: [],
    rung: 0,
    convergence: null,
    lastLedger: [],
  };
}

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  applyBrandTokens();
  host = makeHost(412); // mobile-first viewport (Pixel-5a class)
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("PlayScreen visual layer (VL-4, mobile)", () => {
  it("composes the generation PORTRAIT beside the spine scene prose", () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    // The novel page (not the event card) is showing.
    expect(host.querySelector("[data-testid='scene-reader']")).not.toBeNull();
    // The portrait <img> for generation 0 / male loads beside the prose.
    const portrait = host.querySelector("img.portrait") as HTMLImageElement | null;
    expect(portrait).not.toBeNull();
    expect(portrait?.getAttribute("src")).toBe("/assets/generated/portraits/spine_g0_male.png");
  });

  it("the Map tab is reachable for a founded line and renders the journey overlay", async () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    const buttons = [...host.querySelectorAll("nav.tabs button")] as HTMLButtonElement[];
    const mapBtn = buttons.find((b) => b.textContent?.includes("Map"));
    expect(mapBtn).toBeTruthy();
    await page.elementLocator(mapBtn as HTMLButtonElement).click();
    flushSync();
    // The journey map renders its cartographic base + the founding waypoint lit.
    expect(host.querySelector("img.base")?.getAttribute("src")).toContain("/assets/generated/map/");
    expect(host.querySelector(".caption")?.textContent).toContain("from the stars");
  });

  it("captures a mobile screenshot of the composed portrait + prose surface", async () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
