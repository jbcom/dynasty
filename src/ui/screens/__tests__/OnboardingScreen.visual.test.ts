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

  it("ONBOARDING-FUNNEL-FULL-WALK-SHOT: captures EVERY funnel phase to confirm the register holds end-to-end", async () => {
    component = mount(OnboardingScreen, {
      target: host,
      props: { content, onComplete: () => {}, onCancel: () => {} },
    });
    const seen: string[] = [];
    // Walk the funnel: at each phase, screenshot it, then advance — click the first CHOICE if the phase offers
    // choices, else (a text-input phase like surname/given) click the first non-back action button to proceed.
    for (let step = 0; step < 12; step++) {
      const card = host.querySelector("article.card");
      if (!card) break;
      const phase = card.getAttribute("data-phase") ?? `step-${step}`;
      seen.push(phase);
      await page.screenshot({ element: host.firstElementChild as Element });
      const choice = card.querySelector<HTMLButtonElement>(".choices button");
      if (choice) {
        choice.click();
      } else {
        // A non-choice phase (text input + a confirm button) — click the first forward action that isn't Back.
        const forward = [...card.querySelectorAll<HTMLButtonElement>("button")].find(
          (b) => !/back/i.test(b.textContent ?? ""),
        );
        if (!forward) break;
        forward.click();
      }
      flushSync();
    }
    // The funnel has multiple distinct phases (region → base → standing → naming → …); confirm we walked several.
    expect(new Set(seen).size, `phases walked: ${seen.join(" → ")}`).toBeGreaterThanOrEqual(3);
  });
});
