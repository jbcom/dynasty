import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { GameView } from "../../../engine/loop";
import { buildContent } from "../../../sim/content";
import { initMeters } from "../../../sim/meters";
import { validRaw } from "../../../sim/__tests__/fixtures";
import { initState } from "../../../sim/state";
import PlayScreen from "../PlayScreen.svelte";

const content = buildContent(validRaw());

function view(): GameView {
  const state = { ...initState(content, "seed"), meters: { ...initMeters(content.meters), money: 5_000_000, heat: 40 } };
  return { state, currentEvent: content.allEvents[0] ?? null, lastLedger: [] };
}

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  const s = document.documentElement.style;
  for (const [k, v] of Object.entries({
    "--mmm-gold": "#d4af37", "--mmm-gold-deep": "#a8841f", "--mmm-surface": "#16264f",
    "--mmm-navy": "#0a1633", "--mmm-navy-light": "#16264f", "--mmm-navy-deep": "#050b1c",
    "--mmm-text": "#f5f0e1", "--mmm-text-dim": "#b9c2da", "--mmm-pad": "12px", "--mmm-gap": "10px",
    "--mmm-radius": "8px", "--mmm-radius-lg": "12px", "--mmm-font-display": "Georgia, serif",
    "--mmm-meter-money": "#d4af37", "--mmm-meter-power": "#7a1f2b", "--mmm-meter-reputation": "#c08a2e",
    "--mmm-meter-loyalty": "#274690", "--mmm-meter-health": "#b03030", "--mmm-meter-heat": "#e2562a",
  })) {
    s.setProperty(k, v);
  }
  document.body.style.background = "#0a1633";
  host = document.createElement("div");
  host.style.width = "412px";
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("PlayScreen (composed game screen)", () => {
  it("renders the HUD, tab nav, portrait, and event card together", () => {
    component = mount(PlayScreen, { target: host, props: { content, view: view(), busy: false, onchoose: () => {} } });
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
    component = mount(PlayScreen, { target: host, props: { content, view: view(), busy: false, onchoose: () => {} } });
    const buttons = [...host.querySelectorAll("nav.tabs button")] as HTMLButtonElement[];
    const dossierBtn = buttons.find((b) => b.textContent?.includes("Dossier"));
    if (!dossierBtn) throw new Error("no dossier tab");
    await page.elementLocator(dossierBtn).click();
    expect(host.textContent).toContain("Dossier —");
  });

  it("captures a screenshot of the full play screen", async () => {
    component = mount(PlayScreen, { target: host, props: { content, view: view(), busy: false, onchoose: () => {} } });
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
