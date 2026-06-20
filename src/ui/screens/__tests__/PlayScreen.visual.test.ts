import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import type { GameView } from "../../../engine/loop";
import { validRaw } from "../../../sim/__tests__/fixtures";
import { buildContent } from "../../../sim/content";
import { initMeters } from "../../../sim/meters";
import { initState } from "../../../sim/state";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import PlayScreen from "../PlayScreen.svelte";

const content = buildContent(validRaw());

function view(): GameView {
  const state = {
    ...initState(content, "seed"),
    meters: { ...initMeters(content.meters), money: 5_000_000, heat: 40 },
  };
  return { state, currentEvent: content.allEvents[0] ?? null, lastLedger: [] };
}

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  applyBrandTokens();
  host = makeHost(412);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("PlayScreen (composed game screen)", () => {
  it("renders the HUD, tab nav, portrait, and event card together", () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    // HUD gauges present.
    expect(host.querySelectorAll("[data-meter]").length).toBe(6);
    // Tab nav present.
    expect(host.textContent).toContain("Now");
    expect(host.textContent).toContain("Timeline");
    expect(host.textContent).toContain("Dossier");
    // Portrait + event card on the Now tab.
    expect(host.querySelector("[data-portrait]")).not.toBeNull();
    expect(host.querySelector("[data-event]")).not.toBeNull();
  });

  it("switches tabs to show the dossier", async () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    const buttons = [...host.querySelectorAll("nav.tabs button")] as HTMLButtonElement[];
    const dossierBtn = buttons.find((b) => b.textContent?.includes("Dossier"));
    if (!dossierBtn) throw new Error("no dossier tab");
    await page.elementLocator(dossierBtn).click();
    expect(host.textContent).toContain("Dossier —");
  });

  it("captures a screenshot of the full play screen", async () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
