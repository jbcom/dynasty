import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import TitleScreen from "../TitleScreen.svelte";

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

const MOMENTS = [
  {
    id: "test_famine",
    label: "The Great Hunger",
    year: 1847,
    place: "ireland",
    culture: "irish_catholic",
    archetype: "political" as const,
    progenitorSex: "male" as const,
    startEra: "origins",
    deepHistory: false,
    scene: "The potato is black in the ground for the third year running.",
    researchNote: "x",
    choices: [
      {
        id: "go",
        text: "Go",
        effects: {},
        personality: {},
        setFlags: [],
        clearFlags: [],
        ripples: [],
        outcome: "o",
      },
    ],
  },
  {
    id: "test_baghdad",
    label: "The Round City",
    year: 762,
    place: "baghdad",
    culture: "scots_irish",
    archetype: "religious" as const,
    progenitorSex: "male" as const,
    startEra: "origins",
    deepHistory: true,
    scene: "The caliph is raising a new capital on the Tigris.",
    researchNote: "x",
    choices: [
      {
        id: "go",
        text: "Go",
        effects: {},
        personality: {},
        setFlags: [],
        clearFlags: [],
        ripples: [],
        outcome: "o",
      },
    ],
  },
];

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
      props: { moments: MOMENTS, hasSave: true, onFound: () => {}, onContinue: () => {} },
    });
    // Give the self-hosted fonts a beat to load so the capture shows real type.
    await new Promise((r) => setTimeout(r, 250));
    expect(host.querySelector("h1")?.textContent).toBe("Dynasty");
    expect(host.querySelector(".masthead .rule")).not.toBeNull();
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});

describe("TitleScreen — found-your-own moment picker (FD-6)", () => {
  it("shows the moment cards after Found a Dynasty is clicked", async () => {
    let founded: { momentId: string } | null = null;
    component = mount(TitleScreen, {
      target: host,
      props: {
        moments: MOMENTS,
        hasSave: false,
        onFound: (momentId: string) => {
          founded = { momentId };
        },
        onContinue: () => {},
      },
    });
    await new Promise((r) => setTimeout(r, 100));

    const beginBtn = host.querySelector<HTMLButtonElement>("button.primary");
    expect(beginBtn?.textContent?.trim()).toContain("Found a Dynasty");

    beginBtn?.click();
    await new Promise((r) => setTimeout(r, 100));

    const cards = host.querySelectorAll(".moment-card");
    expect(cards.length).toBe(MOMENTS.length);
    const labels = Array.from(cards).map((c) => c.querySelector(".moment-label")?.textContent);
    expect(labels).toContain("The Great Hunger");
    expect(labels).toContain("The Round City");
    // The deep-history moment is flagged.
    expect(host.querySelector(".moment-deep")?.textContent).toContain("Deep history");

    await page.screenshot({ element: host.firstElementChild as Element });

    // Choosing a moment advances to the name-entry step (does not yet found).
    (cards[0] as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 100));
    expect(host.textContent).toContain("NAME YOUR LINE");
    expect(founded).toBeNull();
  });

  it("back button returns to the title step", async () => {
    component = mount(TitleScreen, {
      target: host,
      props: { moments: MOMENTS, hasSave: false, onFound: () => {}, onContinue: () => {} },
    });
    await new Promise((r) => setTimeout(r, 100));
    host.querySelector<HTMLButtonElement>("button.primary")?.click();
    await new Promise((r) => setTimeout(r, 100));
    expect(host.querySelectorAll(".moment-card").length).toBe(MOMENTS.length);
    host.querySelector<HTMLButtonElement>(".back-btn")?.click();
    await new Promise((r) => setTimeout(r, 100));
    expect(host.querySelector("h1")?.textContent).toBe("Dynasty");
    expect(host.querySelectorAll(".moment-card").length).toBe(0);
  });
});
