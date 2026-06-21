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
  return {
    state,
    currentEvent: content.allEvents[0] ?? null,
    saga: { actTitle: null, scene: null, ended: false },
    lastLedger: [],
  };
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
  it("renders the HUD, tab nav, and event card together", () => {
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
    // Tabs render REAL 2D line-icon assets, not Unicode glyphs (de-ui-c).
    const tabIcons = [...host.querySelectorAll("nav.tabs img.tab-icon")] as HTMLImageElement[];
    expect(tabIcons.length).toBeGreaterThanOrEqual(5);
    expect(tabIcons.every((i) => i.getAttribute("src")?.startsWith("/assets/icons/ui/"))).toBe(
      true,
    );
    // Event card on the Now tab (portraits removed — they distracted, reclaimed the space).
    expect(host.querySelector("[data-event]")).not.toBeNull();
    expect(host.querySelector("[data-portrait]")).toBeNull();
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

  it("wide (tablet/foldable) renders the event + info side-by-side", async () => {
    host.style.width = "1024px";
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {}, wide: true },
    });
    // The split layout puts the event column next to an info column.
    expect(host.querySelector(".split")).not.toBeNull();
    expect(host.querySelector(".event-col [data-event]")).not.toBeNull();
    expect(host.querySelector(".info-col")).not.toBeNull();
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
