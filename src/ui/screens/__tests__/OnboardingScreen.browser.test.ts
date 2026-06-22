import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadContent } from "../../../data/loadContent";
import OnboardingScreen from "../OnboardingScreen.svelte";

/**
 * ONB-1: the onboarding funnel now collects naming STYLE, surname, GENDER, and GIVEN name as player
 * choices (not auto-defaults). These tests walk the real-content funnel by clicking through each phase
 * and assert onComplete receives the full chosen identity in the right shape + order.
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

describe("OnboardingScreen (ONB-1 funnel: style + surname + gender + given)", () => {
  it("walks period→class→wave→style→surname→gender→given and onComplete gets the full identity", async () => {
    const onComplete = vi.fn();
    component = mount(OnboardingScreen, {
      target: host,
      props: { content, onComplete, onCancel: () => {} },
    });

    // The funnel advances one phase per first-choice click. The (period,class) cell may auto-skip the
    // wave step when it has a single wave, so drive by the data-phase the screen is actually showing.
    const order: string[] = [];
    for (let i = 0; i < 8 && !onComplete.mock.calls.length; i++) {
      const p = phase();
      if (p) order.push(p);
      clickFirstChoice();
      await Promise.resolve();
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    // Every founding choice must be present: (seed, place, surname, cls, gender, given, culture).
    const [seed, place, surname, cls, gender, given, culture] = onComplete.mock.calls[0] ?? [];
    expect(typeof seed).toBe("string");
    expect(typeof place).toBe("string");
    expect(surname).toBeTruthy();
    expect(["poor", "middle"]).toContain(cls);
    expect(["male", "female"]).toContain(gender);
    expect(given).toBeTruthy();
    expect(typeof culture).toBe("string");
    // The funnel surfaced the gender + given steps the gap was missing.
    expect(order).toContain("gender");
    expect(order).toContain("given");
    expect(order).toContain("style");
  });

  it("offers the wave's own naming style first on the style step", async () => {
    const onComplete = vi.fn();
    component = mount(OnboardingScreen, {
      target: host,
      props: { content, onComplete, onCancel: () => {} },
    });
    // Advance until the style card shows.
    for (let i = 0; i < 6 && phase() !== "style"; i++) {
      clickFirstChoice();
      await Promise.resolve();
    }
    expect(phase()).toBe("style");
    // The first style option is the wave's own (marked "— its own").
    const first = host.querySelector<HTMLButtonElement>("article.card .choices button");
    expect(first?.textContent).toContain("its own");
  });
});
