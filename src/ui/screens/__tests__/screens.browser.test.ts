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

function fullProps(over: Record<string, unknown> = {}) {
  return {
    hasSave: false,
    onNewGame: () => {},
    onContinue: () => {},
    onSettings: () => {},
    ...over,
  };
}

describe("TitleScreen (PL-3 diegetic entry — no upfront inputs)", () => {
  it("shows New Game + Settings, hides Continue without a save", () => {
    component = mount(TitleScreen, { target: host, props: fullProps() });
    expect(host.textContent).toContain("Begin a Line");
    expect(host.textContent).not.toContain("Continue");
    expect(host.textContent).toContain("Settings");
  });

  it("shows Continue when a save exists", () => {
    component = mount(TitleScreen, { target: host, props: fullProps({ hasSave: true }) });
    expect(host.textContent).toContain("Continue");
  });

  it("has NO upfront surname or seed inputs — onboarding authors both diegetically", () => {
    component = mount(TitleScreen, { target: host, props: fullProps() });
    expect(host.querySelector("#surname")).toBeNull();
    expect(host.querySelector("#seed")).toBeNull();
    expect(host.querySelectorAll("input").length).toBe(0);
  });

  it("New Game fires onNewGame (which routes to the onboarding flow)", async () => {
    const onNewGame = vi.fn();
    component = mount(TitleScreen, { target: host, props: fullProps({ onNewGame }) });
    await page.getByRole("button", { name: /Begin a Line/ }).click();
    await vitest.waitFor(() => expect(onNewGame).toHaveBeenCalledTimes(1));
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
