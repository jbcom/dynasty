import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadContent } from "../../../data/loadContent";
import OnboardingScreen from "../OnboardingScreen.svelte";

/**
 * FS-ONB-DRIFT: the founding funnel now opens on REGION → POWER BASE → STANDING (the 1776 founding-era
 * origin), then NAMING STYLE → SURNAME → GENDER → GIVEN → the FS-7b life-seeds. These tests walk the
 * real-content funnel by clicking through each phase and assert onComplete receives the full chosen
 * founding identity in the right shape + order.
 */

const content = loadContent();

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  host = document.createElement("div");
  host.style.width = "412px";
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

/** The card currently shown is identified by data-phase; click the first choice button on it. */
function phase(): string | null {
  return host.querySelector("article.card")?.getAttribute("data-phase") ?? null;
}
function clickFirstChoice(): void {
  const btn = host.querySelector<HTMLButtonElement>("article.card .choices button");
  btn?.click();
}

describe("OnboardingScreen (FS-ONB-DRIFT: region/base/standing + ONB-1 naming + FS-7b life-seeds)", () => {
  it("walks the full founding funnel and onComplete gets (seed, region, base, standing, surname, gender, given, culture, lifeSeeds)", async () => {
    const onComplete = vi.fn();
    component = mount(OnboardingScreen, {
      target: host,
      props: { content, onComplete, onCancel: () => {} },
    });

    // One phase per first-choice click; drive by the data-phase the screen is actually showing.
    const order: string[] = [];
    for (let i = 0; i < 14 && !onComplete.mock.calls.length; i++) {
      const p = phase();
      if (p) order.push(p);
      clickFirstChoice();
      await Promise.resolve();
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    const [seed, region, base, standing, surname, gender, given, culture, lifeSeeds] =
      onComplete.mock.calls[0] ?? [];
    expect(typeof seed).toBe("string");
    expect(["new_england", "mid_atlantic", "south"]).toContain(region);
    expect(["land", "commerce", "pulpit", "law", "press", "military"]).toContain(base);
    expect(["established", "rising"]).toContain(standing);
    expect(surname).toBeTruthy();
    expect(["male", "female"]).toContain(gender);
    expect(given).toBeTruthy();
    // ONO-DEDUP: the first-offered given name picked by the funnel is never equal to the chosen surname.
    expect(given).not.toBe(surname);
    expect(typeof culture).toBe("string");
    // FS-7b: the diegetic Epoch-0 life-seeds are composed (first job / best friend / life partner).
    expect(lifeSeeds.firstJob).toBeTruthy();
    expect(lifeSeeds.bestFriend).toBeTruthy();
    expect(lifeSeeds.lifePartner).toBeTruthy();
    // The funnel opened on the founding-era origin steps and surfaced the diegetic-birth tail.
    expect(order).toContain("region");
    expect(order).toContain("base");
    expect(order).toContain("standing");
    expect(order).toContain("gender");
    expect(order).toContain("given");
    expect(order).toContain("job");
    expect(order).toContain("friend");
    expect(order).toContain("partner");
    // No pre-pivot immigrant-arrival framing remains.
    expect(host.textContent ?? "").not.toContain("off the boat");
  });

  it("opens on the region step with all three founding regions, not an immigration crossing", async () => {
    component = mount(OnboardingScreen, {
      target: host,
      props: { content, onComplete: vi.fn(), onCancel: () => {} },
    });
    expect(phase()).toBe("region");
    const labels = [...host.querySelectorAll("article.card .choices .opt-title")].map(
      (el) => el.textContent ?? "",
    );
    expect(labels.join(" | ")).toContain("New England");
    expect(labels.join(" | ")).toContain("The South");
    // The prompt is the founding, not a crossing.
    expect(host.querySelector(".prompt")?.textContent ?? "").not.toContain("crossing");
  });

  it("ONBOARDING-A11Y-FUNNEL: the funnel is a live region and the choice cards are keyboard-navigable buttons", () => {
    component = mount(OnboardingScreen, {
      target: host,
      props: { content, onComplete: vi.fn(), onCancel: () => {} },
    });
    // A polite live region so a screen reader announces each new phase prompt as the card swaps.
    const main = host.querySelector("main.onboarding");
    expect(main?.getAttribute("aria-live"), "the funnel is a polite live region").toBe("polite");
    // The choices are native <button>s — inherently tab-focusable / keyboard-activatable.
    const choices = [...host.querySelectorAll("article.card .choices button")];
    expect(choices.length, "the phase offers button choices").toBeGreaterThan(0);
    expect(
      choices.every((b) => b.tagName === "BUTTON" && !b.hasAttribute("disabled")),
      "every choice is an enabled, keyboard-navigable button",
    ).toBe(true);
  });
});
