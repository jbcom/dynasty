import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import TitleScreen from "../TitleScreen.svelte";

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

function props(over: Record<string, unknown> = {}) {
  return {
    hasSave: true,
    onNewGame: () => {},
    onContinue: () => {},
    onSettings: () => {},
    ...over,
  };
}

beforeEach(() => {
  applyBrandTokens();
  host = makeHost();
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("TitleScreen — luxury Dynasty masthead + diegetic entry (CP-R5)", () => {
  it("renders the gilded wordmark + ornamental rule and captures a screenshot", async () => {
    component = mount(TitleScreen, { target: host, props: props() });
    await new Promise((r) => setTimeout(r, 250));
    expect(host.querySelector("h1")?.textContent).toBe("Dynasty");
    expect(host.querySelector(".masthead .rule")).not.toBeNull();
    // TITLE-CONTINUE-STATE-SHOT: props() defaults hasSave:true, so this captures the WITH-SAVE variant —
    // Continue + Begin a Line + Settings together (the previously un-shot state). Assert Continue is present.
    expect(host.textContent, "the with-save Title shows Continue").toContain("Continue");
    expect(host.textContent).toContain("Begin a Line");
    await page.screenshot({ element: host.firstElementChild as Element });
  });

  it("New Game has no upfront inputs and routes to onboarding (PL-3)", async () => {
    let started = 0;
    component = mount(TitleScreen, {
      target: host,
      props: props({ hasSave: false, onNewGame: () => started++ }),
    });
    await new Promise((r) => setTimeout(r, 100));
    // No surname/seed fields remain — the seed + name are authored in the onboarding flow.
    expect(host.querySelectorAll("input").length).toBe(0);
    const begin = host.querySelector<HTMLButtonElement>("button.primary");
    expect(begin?.textContent?.trim()).toContain("Begin a Line");
    expect(begin?.disabled).toBeFalsy();
    begin?.click();
    await new Promise((r) => setTimeout(r, 50));
    expect(started).toBe(1);
  });

  it("no founding control panel remains (no moment carousel)", async () => {
    component = mount(TitleScreen, { target: host, props: props({ hasSave: false }) });
    await new Promise((r) => setTimeout(r, 100));
    expect(host.querySelectorAll(".card.moment").length).toBe(0);
  });
});
