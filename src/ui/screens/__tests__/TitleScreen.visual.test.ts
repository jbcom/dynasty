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
const ONOMASTICS = {
  irish_catholic: {
    label: "Irish Catholic",
    givenMale: ["Patrick"],
    givenFemale: ["Bridget"],
    convention: "patronymic",
    namingRules: {},
  },
  scots_irish: {
    label: "Scots-Irish",
    givenMale: ["William"],
    givenFemale: ["Margaret"],
    convention: "patronymic",
    namingRules: {},
  },
};

function fullProps(over: Record<string, unknown> = {}) {
  return {
    moments: MOMENTS,
    callings: [],
    axes: [],
    worldStacks: [],
    onomastics: ONOMASTICS,
    hasSave: true,
    onFound: () => {},
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

describe("TitleScreen — luxury Dynasty masthead (DE-UI)", () => {
  it("renders the gilded wordmark + ornamental rule and captures a screenshot", async () => {
    component = mount(TitleScreen, { target: host, props: fullProps() });
    await new Promise((r) => setTimeout(r, 250));
    expect(host.querySelector("h1")?.textContent).toBe("Dynasty");
    expect(host.querySelector(".masthead .rule")).not.toBeNull();
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});

describe("TitleScreen — found-your-own moment picker (CP-7)", () => {
  it("shows the moment cards after Found a Dynasty is clicked", async () => {
    component = mount(TitleScreen, { target: host, props: fullProps({ hasSave: false }) });
    await new Promise((r) => setTimeout(r, 100));
    const beginBtn = host.querySelector<HTMLButtonElement>("button.primary");
    expect(beginBtn?.textContent?.trim()).toContain("Found a Dynasty");
    beginBtn?.click();
    await new Promise((r) => setTimeout(r, 100));
    const cards = host.querySelectorAll(".card.moment");
    expect(cards.length).toBe(MOMENTS.length);
    expect(host.querySelector(".deep-badge")?.textContent).toContain("Deep history");
    await page.screenshot({ element: host.firstElementChild as Element });
  });

  it("back from the moment picker returns to the title", async () => {
    component = mount(TitleScreen, { target: host, props: fullProps({ hasSave: false }) });
    await new Promise((r) => setTimeout(r, 100));
    host.querySelector<HTMLButtonElement>("button.primary")?.click();
    await new Promise((r) => setTimeout(r, 100));
    expect(host.querySelectorAll(".card.moment").length).toBe(MOMENTS.length);
    host.querySelector<HTMLButtonElement>(".back-btn")?.click();
    await new Promise((r) => setTimeout(r, 100));
    expect(host.querySelector("h1")?.textContent).toBe("Dynasty");
    expect(host.querySelectorAll(".card.moment").length).toBe(0);
  });
});
