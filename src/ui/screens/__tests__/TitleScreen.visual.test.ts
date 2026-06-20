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
      props: {
        hasSave: true,
        // Signature is now (seed, dynasty) — arrow ignores both; type-safe
        onNewGame: (_seed: string, _dynasty: string) => {},
        onContinue: () => {},
      },
    });
    // Give the self-hosted fonts a beat to load so the capture shows real type.
    await new Promise((r) => setTimeout(r, 250));
    expect(host.querySelector("h1")?.textContent).toBe("Dynasty");
    expect(host.querySelector(".masthead .rule")).not.toBeNull();
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});

describe("TitleScreen — dynasty-select carousel (de-5d)", () => {
  it("shows the carousel with all three house cards after Begin a Dynasty is clicked", async () => {
    let chosen: string | null = null;
    component = mount(TitleScreen, {
      target: host,
      props: {
        hasSave: false,
        onNewGame: (_seed: string, dynasty: string) => {
          chosen = dynasty;
        },
        onContinue: () => {},
      },
    });
    await new Promise((r) => setTimeout(r, 100));

    // Title step: Begin a Dynasty button is present.
    const beginBtn = host.querySelector<HTMLButtonElement>("button.primary");
    expect(beginBtn?.textContent?.trim()).toContain("Begin a Dynasty");

    // Click it — transitions to carousel.
    beginBtn?.click();
    await new Promise((r) => setTimeout(r, 100));

    // Carousel step: 3 dynasty cards visible.
    const cards = host.querySelectorAll(".dynasty-card");
    expect(cards.length).toBe(3);

    // Card texts include the three house names.
    const names = Array.from(cards).map((c) => c.querySelector(".dynasty-name")?.textContent);
    expect(names).toContain("Trump");
    expect(names).toContain("Kennedy");
    expect(names).toContain("Musk");

    // Take a screenshot of the carousel for visual review.
    await page.screenshot({ element: host.firstElementChild as Element });

    // Choosing Kennedy calls onNewGame with dynasty="kennedy".
    const kennedyCard = Array.from(cards).find(
      (c) => c.querySelector(".dynasty-name")?.textContent === "Kennedy",
    ) as HTMLButtonElement | undefined;
    kennedyCard?.click();
    expect(chosen).toBe("kennedy");
  });

  it("back button returns to the title step", async () => {
    component = mount(TitleScreen, {
      target: host,
      props: {
        hasSave: false,
        onNewGame: () => {},
        onContinue: () => {},
      },
    });
    await new Promise((r) => setTimeout(r, 100));
    host.querySelector<HTMLButtonElement>("button.primary")?.click();
    await new Promise((r) => setTimeout(r, 100));
    expect(host.querySelectorAll(".dynasty-card").length).toBe(3);
    host.querySelector<HTMLButtonElement>(".back-btn")?.click();
    await new Promise((r) => setTimeout(r, 100));
    // Back to title — h1 Dynasty heading visible again, no dynasty cards.
    expect(host.querySelector("h1")?.textContent).toBe("Dynasty");
    expect(host.querySelectorAll(".dynasty-card").length).toBe(0);
  });
});
