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

const content = buildContent(validRaw());

function view(): GameView {
  const state = {
    ...initState(content, "seed"),
    meters: { ...initMeters(content.meters), money: 5_000_000, heat: 40 },
  };
  return {
    state,
    currentEvent: content.allEvents[0] ?? null,
    saga: { actTitle: null, scene: null, threads: [], ended: false },
    glimpses: [],
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
  host = makeHost(412);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("PlayScreen (composed game screen)", () => {
  it("renders the slim header, hamburger, tab nav, and event card together (PF-3)", () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    // Slim always-visible header (PF-3): year + macro span context, no big HUD band.
    expect(host.querySelector('[data-testid="saga-head"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="saga-head"]')?.textContent).toContain(
      String(view().state.year),
    );
    // The non-essential HUD is behind the hamburger — meters are NOT in the always-visible surface.
    expect(host.querySelector('[data-testid="hud-hamburger"]')).not.toBeNull();
    expect(host.querySelectorAll("[data-meter]").length).toBe(0);
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

  it("the hamburger opens the slide-out menu with the meters + motivators inside (PF-3)", async () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    // Closed: the menu + meters are not present.
    expect(host.querySelector('[data-testid="hud-menu"]')).toBeNull();
    (host.querySelector('[data-testid="hud-hamburger"]') as HTMLButtonElement).click();
    flushSync();
    // Open: the slide-out holds the non-essential HUD (the 6 meters now live here).
    expect(host.querySelector('[data-testid="hud-menu"]')).not.toBeNull();
    expect(host.querySelectorAll('[data-testid="hud-menu"] [data-meter]').length).toBe(6);
    // The scrim closes it again (direct dispatch — the fixed overlay stack confuses pointer hit-testing).
    (host.querySelector('[data-testid="hud-scrim"]') as HTMLButtonElement).click();
    flushSync();
    expect(host.querySelector('[data-testid="hud-menu"]')).toBeNull();
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

  it("renders the NOVEL scene reader + a cross-family thread aside when the saga frame has one", () => {
    const scene = SceneSchema.parse({
      id: "sc:demo:midpoint",
      sense: "sound",
      prose: [
        "The crowd at the dock is a din of a hundred tongues, and one of them is about to matter to your line.",
        "A family from another wave moves through the press, and for a moment the two paths touch.",
      ],
    });
    const braidScene = SceneSchema.parse({
      id: "sc:rival:open",
      sense: "sight",
      prose: [
        "Across the same grey harbour another line steps ashore, its own hungers written on its faces.",
        "You will not learn their name for years, but the century is already binding you together.",
      ],
    });
    const v: GameView = {
      ...view(),
      saga: {
        actTitle: "Act III — The Climb",
        scene,
        threads: [
          { wave: "italian", crossing: "An Italian line cuts across yours.", scene: braidScene },
        ],
        ended: false,
      },
    };
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: v, busy: false, onchoose: () => {} },
    });
    // The novel page renders (not the event card).
    expect(host.querySelector("[data-testid='scene-reader']")).not.toBeNull();
    expect(host.textContent).toContain("Act III — The Climb");
    // The cross-family intersection braids in beneath the scene.
    const thread = host.querySelector("[data-testid='thread']");
    expect(thread).not.toBeNull();
    expect(thread?.textContent).toContain("Where paths cross");
    expect(thread?.textContent).toContain("An Italian line cuts across yours."); // bespoke crossing
    expect(thread?.textContent).toContain("another line steps ashore"); // braided rival fragment
  });
});
