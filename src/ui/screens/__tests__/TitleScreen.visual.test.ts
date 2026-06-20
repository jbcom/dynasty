import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import TitleScreen from "../TitleScreen.svelte";

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  applyBrandTokens();
  host = makeHost();
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("TitleScreen — luxury Dynasty masthead (DE-UI)", () => {
  it("renders the gilded wordmark + ornamental rule and captures a screenshot for review", async () => {
    component = mount(TitleScreen, {
      target: host,
      props: { hasSave: true, onNewGame: () => {}, onContinue: () => {} },
    });
    // Give the self-hosted fonts a beat to load so the capture shows real type.
    await new Promise((r) => setTimeout(r, 250));
    expect(host.querySelector("h1")?.textContent).toBe("Dynasty");
    expect(host.querySelector(".masthead .rule")).not.toBeNull();
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
