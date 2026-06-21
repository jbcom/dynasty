import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi, vitest } from "vitest";
import { page } from "vitest/browser";
import { validRaw } from "../../../sim/__tests__/fixtures";
import { buildContent } from "../../../sim/content";
import { applyChoice } from "../../../sim/effects";
import { createRng } from "../../../sim/rng";
import { initState } from "../../../sim/state";
import LegacyReport from "../LegacyReport.svelte";
import TitleScreen from "../TitleScreen.svelte";

const content = buildContent(validRaw());

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
    scene: "The potato is black in the ground.",
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
const CALLINGS = [
  {
    id: "scholar",
    label: "The Scholar",
    summary: "Learning is power.",
    traitDrift: {},
    tropeWeights: {},
  },
];
const AXES = [
  {
    axis: "faith" as const,
    label: "Faith",
    prompt: "What of the faith?",
    options: [
      {
        id: "devout",
        label: "Embrace",
        blurb: "Kneel with the age.",
        setFlags: [],
        effects: {},
        personality: {},
      },
      {
        id: "reject",
        label: "Reject",
        blurb: "Turn away.",
        setFlags: [],
        effects: {},
        personality: {},
      },
    ],
  },
];
const STACKS = [
  {
    place: "ireland",
    label: "Ireland",
    placeLabel: "Ireland",
    geography: "g",
    politics: "p",
    religion: "r",
    ideology: "i",
    perils: ["x"],
    axisIntensity: { faith: 0.9 },
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
};

function fullProps(over: Record<string, unknown> = {}) {
  return {
    moments: MOMENTS,
    callings: CALLINGS,
    axes: AXES,
    worldStacks: STACKS,
    onomastics: ONOMASTICS,
    hasSave: false,
    onFound: () => {},
    onContinue: () => {},
    onSettings: () => {},
    ...over,
  };
}

describe("TitleScreen (CP-7 control panel)", () => {
  it("shows New Game + Settings, hides Continue without a save", () => {
    component = mount(TitleScreen, { target: host, props: fullProps() });
    expect(host.textContent).toContain("Found a Dynasty");
    expect(host.textContent).not.toContain("Continue");
    expect(host.textContent).toContain("Settings");
  });

  it("shows Continue when a save exists", () => {
    component = mount(TitleScreen, { target: host, props: fullProps({ hasSave: true }) });
    expect(host.textContent).toContain("Continue");
  });

  it("founds a line through the full panel: moment → name/gender → calling → axes → begin", async () => {
    const onFound = vi.fn();
    component = mount(TitleScreen, { target: host, props: fullProps({ onFound }) });
    const seedInput = host.querySelector("#seed") as HTMLInputElement;
    seedInput.value = "my-seed";
    seedInput.dispatchEvent(new Event("input", { bubbles: true }));

    await page.getByRole("button", { name: /Found a Dynasty/ }).click();
    await vitest.waitFor(() => expect(host.textContent).toContain("CHOOSE YOUR HINGE"));
    await page.getByRole("button", { name: /Found here/ }).click();

    await vitest.waitFor(() => expect(host.textContent).toContain("NAME YOUR LINE"));
    const surname = host.querySelector("#surname") as HTMLInputElement;
    surname.value = "Vane";
    surname.dispatchEvent(new Event("input", { bubbles: true }));
    // Choose the matriarch path.
    await page.getByRole("button", { name: "Matriarch" }).click();
    await page.getByRole("button", { name: /Next: the Calling/ }).click();

    await vitest.waitFor(() => expect(host.textContent).toContain("CHOOSE A CALLING"));
    await page.getByRole("button", { name: /Take this calling/ }).click();

    await vitest.waitFor(() => expect(host.textContent).toContain("EPOCH ZERO"));
    await page.getByRole("button", { name: /Embrace/ }).click();
    await page.getByRole("button", { name: "Begin the Line" }).click();

    await vitest.waitFor(() => expect(host.textContent).toContain("THE FOUNDING"));
    await page.getByRole("button", { name: "Begin the Line" }).click();

    await vitest.waitFor(() => expect(onFound).toHaveBeenCalledTimes(1));
    const arg = onFound.mock.calls[0]?.[0];
    expect(arg.momentId).toBe("test_famine");
    expect(arg.surname).toBe("Vane");
    expect(arg.seed).toBe("my-seed");
    expect(arg.gender).toBe("female");
    expect(arg.calling).toBe("scholar");
    expect(arg.axisChoices).toEqual({ faith: "devout" });
  });

  it("the moment picker shows the start-moments; back returns to title", async () => {
    component = mount(TitleScreen, { target: host, props: fullProps() });
    await page.getByRole("button", { name: /Found a Dynasty/ }).click();
    await vitest.waitFor(() => expect(host.textContent).toContain("The Great Hunger"));
    await page.getByRole("button", { name: "← Back" }).click();
    await vitest.waitFor(() => expect(host.textContent).toContain("Found a Dynasty"));
  });
});

describe("LegacyReport", () => {
  it("renders the end headline, stats, and a restart button", () => {
    const state = {
      ...initState(content, "seed"),
      end: { kind: "victory" as const, year: 2080, reason: "Immortal patriarch." },
    };
    component = mount(LegacyReport, {
      target: host,
      props: { content, state, end: state.end, onRestart: () => {} },
    });
    expect(host.textContent).toContain("Total Victory");
    expect(host.textContent).toContain("Immortal patriarch.");
    expect(host.textContent).toContain("Play Again");
  });

  it("shows the butterfly chain that led to the end", () => {
    let s = initState(content, "seed");
    const born = content.allEvents.find((e) => e.id === "ev_born");
    const school = content.allEvents.find((e) => e.id === "ev_military_school");
    if (!born || !school) throw new Error("fixtures missing");
    s = applyChoice(content, s, born, "cry_loud", createRng("seed")).state;
    s = applyChoice(content, s, school, "excel", createRng("seed")).state;
    const state = { ...s, end: { kind: "death" as const, year: 1990, reason: "x" } };
    component = mount(LegacyReport, {
      target: host,
      props: { content, state, end: state.end, onRestart: () => {} },
    });
    // The butterfly graph renders nodes for the recorded ledger.
    expect(host.querySelectorAll("circle").length).toBeGreaterThan(0);
  });
});
