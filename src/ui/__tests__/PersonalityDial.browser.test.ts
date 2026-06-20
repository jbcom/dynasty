import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Personality } from "../../sim/personality";
import PersonalityDial from "../PersonalityDial.svelte";
import { applyBrandTokens, makeHost } from "./visualHarness";

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

const p = (over: Partial<Personality> = {}): Personality => ({
  ideology: 0,
  grandiosity: 10,
  outward: 0,
  inward: 0,
  ...over,
});

describe("PersonalityDial", () => {
  it("reads Tyrannical for a far-right megalomaniac and positions the needle right", () => {
    component = mount(PersonalityDial, {
      target: host,
      props: { personality: p({ ideology: 90, grandiosity: 90, outward: 90 }) },
    });
    expect(host.textContent).toContain("Tyrannical");
    expect(host.textContent).toContain("Megalomaniac King");
    const dial = host.querySelector(".dial") as HTMLElement;
    expect(Number(dial.dataset.axis)).toBeGreaterThan(50);
  });

  it("reads Utopian for a humble far-left visionary and positions the needle left", () => {
    component = mount(PersonalityDial, {
      target: host,
      props: { personality: p({ ideology: -80, grandiosity: 45, outward: -80 }) },
    });
    expect(host.textContent).toContain("Utopian");
    const dial = host.querySelector(".dial") as HTMLElement;
    expect(Number(dial.dataset.axis)).toBeLessThan(-40);
  });

  it("warns when outward and inward perception diverge sharply", () => {
    component = mount(PersonalityDial, {
      target: host,
      props: { personality: p({ outward: 80, inward: -20 }) },
    });
    expect(host.textContent).toContain("disagree");
  });

  it("renders the branch-relative moral-pole badge when a pole is supplied (DE-2b)", () => {
    component = mount(PersonalityDial, {
      target: host,
      props: {
        personality: p(),
        pole: "utopian",
        poleLabel: "the Covenant Commonwealth",
      },
    });
    const badge = host.querySelector(".pole-badge") as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.dataset.pole).toBe("utopian");
    expect(host.textContent).toContain("the Covenant Commonwealth");
  });

  it("omits the pole badge before the run resolves a pole (no pole prop)", () => {
    component = mount(PersonalityDial, {
      target: host,
      props: { personality: p() },
    });
    expect(host.querySelector(".pole-badge")).toBeNull();
  });
});
