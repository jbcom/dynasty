import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { loadContent } from "../../../data/loadContent";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import OnboardingScreen from "../OnboardingScreen.svelte";

/**
 * ONBOARDING-SCREEN-SHOT — the entry funnel (Region → Power base → Standing → naming → …) between Title and Play,
 * not yet visually verified. Capture the opening phase + one advanced step for a legibility / luxury-register read.
 */

const content = loadContent();

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

describe("OnboardingScreen — founding funnel (ONBOARDING-SCREEN-SHOT)", () => {
  it("captures the opening funnel phase and one advanced step for visual review", async () => {
    component = mount(OnboardingScreen, {
      target: host,
      props: { content, onComplete: () => {}, onCancel: () => {} },
    });
    // The funnel opens on a card with choices — capture the first phase.
    const firstCard = host.querySelector("article.card");
    expect(firstCard, "the funnel opens on a card").not.toBeNull();
    expect(firstCard?.querySelector(".choices button"), "the card offers choices").not.toBeNull();
    await page.screenshot({ element: host.firstElementChild as Element });

    // Advance one phase (click the first choice) and capture the next step.
    host.querySelector<HTMLButtonElement>("article.card .choices button")?.click();
    flushSync();
    expect(host.querySelector("article.card"), "a next phase renders").not.toBeNull();
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
