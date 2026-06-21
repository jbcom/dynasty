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
    onBirth: () => {},
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
    await page.screenshot({ element: host.firstElementChild as Element });
  });

  it("New Game is disabled until a surname is entered, then begins a line", async () => {
    let begun: { seed: string; surname: string } | null = null;
    component = mount(TitleScreen, {
      target: host,
      props: props({ hasSave: false, onBirth: (seed: string, surname: string) => { begun = { seed, surname }; } }),
    });
    await new Promise((r) => setTimeout(r, 100));
    const begin = host.querySelector<HTMLButtonElement>("button.primary");
    expect(begin?.textContent?.trim()).toContain("Begin a Line");
    expect(begin?.disabled).toBe(true);
    // Enter a surname, then New Game fires onBirth with that surname.
    const surname = host.querySelector<HTMLInputElement>("#surname");
    if (!surname) throw new Error("no surname field");
    surname.value = "Donnelly";
    surname.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 50));
    expect(begin?.disabled).toBe(false);
    begin?.click();
    await new Promise((r) => setTimeout(r, 50));
    expect(begun).not.toBeNull();
    expect((begun as unknown as { surname: string }).surname).toBe("Donnelly");
  });

  it("no founding control panel remains (no moment carousel)", async () => {
    component = mount(TitleScreen, { target: host, props: props({ hasSave: false }) });
    await new Promise((r) => setTimeout(r, 100));
    expect(host.querySelectorAll(".card.moment").length).toBe(0);
  });
});
