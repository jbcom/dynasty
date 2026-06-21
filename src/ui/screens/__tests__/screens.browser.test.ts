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

describe("TitleScreen (FD-6 founding flow)", () => {
  it("shows Found a Dynasty and hides Continue without a save", () => {
    component = mount(TitleScreen, {
      target: host,
      props: { moments: MOMENTS, hasSave: false, onFound: () => {}, onContinue: () => {} },
    });
    expect(host.textContent).toContain("Found a Dynasty");
    expect(host.textContent).not.toContain("Continue");
  });

  it("shows Continue the Saga when a save exists", () => {
    component = mount(TitleScreen, {
      target: host,
      props: { moments: MOMENTS, hasSave: true, onFound: () => {}, onContinue: () => {} },
    });
    expect(host.textContent).toContain("Continue the Saga");
  });

  it("founds a line: title → moment → surname → onFound(momentId, surname, seed)", async () => {
    const onFound = vi.fn();
    component = mount(TitleScreen, {
      target: host,
      props: { moments: MOMENTS, hasSave: false, onFound, onContinue: () => {} },
    });
    const input = host.querySelector("input") as HTMLInputElement;
    input.value = "my-seed";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await page.getByRole("button", { name: "Found a Dynasty" }).click();
    await vitest.waitFor(() => expect(host.textContent).toContain("CHOOSE YOUR HINGE"));
    await page.getByRole("button", { name: /Found here/ }).click();
    await vitest.waitFor(() => expect(host.textContent).toContain("NAME YOUR LINE"));
    const surname = host.querySelector("#surname") as HTMLInputElement;
    surname.value = "Vane";
    surname.dispatchEvent(new Event("input", { bubbles: true }));
    await page.getByRole("button", { name: "Begin the Line" }).click();
    await vitest.waitFor(() =>
      expect(onFound).toHaveBeenCalledWith("test_famine", "Vane", "my-seed"),
    );
  });

  it("the moment picker shows the start-moments", async () => {
    component = mount(TitleScreen, {
      target: host,
      props: { moments: MOMENTS, hasSave: false, onFound: () => {}, onContinue: () => {} },
    });
    await page.getByRole("button", { name: "Found a Dynasty" }).click();
    await vitest.waitFor(() => expect(host.textContent).toContain("The Great Hunger"));
  });

  it("back from the moment picker returns to the title", async () => {
    component = mount(TitleScreen, {
      target: host,
      props: { moments: MOMENTS, hasSave: false, onFound: () => {}, onContinue: () => {} },
    });
    await page.getByRole("button", { name: "Found a Dynasty" }).click();
    await vitest.waitFor(() => expect(host.textContent).toContain("CHOOSE YOUR HINGE"));
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
