import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi, vitest } from "vitest";
import { page } from "vitest/browser";
import { buildContent } from "../../../sim/content";
import { applyChoice } from "../../../sim/effects";
import { createRng } from "../../../sim/rng";
import { validRaw } from "../../../sim/__tests__/fixtures";
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

describe("TitleScreen", () => {
  it("shows New Game and hides Continue without a save", () => {
    component = mount(TitleScreen, {
      target: host,
      props: { hasSave: false, onNewGame: () => {}, onContinue: () => {} },
    });
    expect(host.textContent).toContain("New Game");
    expect(host.textContent).not.toContain("Continue");
  });

  it("shows Continue when a save exists", () => {
    component = mount(TitleScreen, {
      target: host,
      props: { hasSave: true, onNewGame: () => {}, onContinue: () => {} },
    });
    expect(host.textContent).toContain("Continue");
  });

  it("starts a new game with the entered seed", async () => {
    const onNewGame = vi.fn();
    component = mount(TitleScreen, {
      target: host,
      props: { hasSave: false, onNewGame, onContinue: () => {} },
    });
    const input = host.querySelector("input") as HTMLInputElement;
    input.value = "my-seed";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const btn = host.querySelector("button.primary") as HTMLButtonElement;
    await page.elementLocator(btn).click();
    await vitest.waitFor(() => expect(onNewGame).toHaveBeenCalledWith("my-seed"));
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
      props: { state, end: state.end, onRestart: () => {} },
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
      props: { state, end: state.end, onRestart: () => {} },
    });
    // The butterfly graph renders nodes for the recorded ledger.
    expect(host.querySelectorAll("circle").length).toBeGreaterThan(0);
  });
});
