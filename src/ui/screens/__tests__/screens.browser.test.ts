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

describe("TitleScreen", () => {
  it("shows Begin a Dynasty and hides Continue without a save", () => {
    component = mount(TitleScreen, {
      target: host,
      props: { hasSave: false, onNewGame: () => {}, onContinue: () => {} },
    });
    expect(host.textContent).toContain("Begin a Dynasty");
    expect(host.textContent).not.toContain("Continue");
  });

  it("shows Continue the Saga when a save exists", () => {
    component = mount(TitleScreen, {
      target: host,
      props: { hasSave: true, onNewGame: () => {}, onContinue: () => {} },
    });
    expect(host.textContent).toContain("Continue the Saga");
  });

  it("starts a new game with the entered seed after dynasty selection", async () => {
    // The flow is now: title → Begin a Dynasty → carousel → pick dynasty → onNewGame(seed, dynasty)
    const onNewGame = vi.fn();
    component = mount(TitleScreen, {
      target: host,
      props: { hasSave: false, onNewGame, onContinue: () => {} },
    });
    const input = host.querySelector("input") as HTMLInputElement;
    input.value = "my-seed";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    // Step 1: click "Begin a Dynasty" → carousel appears.
    await page.getByRole("button", { name: "Begin a Dynasty" }).click();
    // Step 2: carousel is now visible — pick the Trump card using its visible CTA text.
    await vitest.waitFor(() => expect(host.textContent).toContain("CHOOSE YOUR BLOODLINE"));
    await page.getByRole("button", { name: "Play as Trump →" }).click();
    await vitest.waitFor(() => expect(onNewGame).toHaveBeenCalledWith("my-seed", "trump"));
  });

  it("carousel shows all three dynasties (de-5d)", async () => {
    component = mount(TitleScreen, {
      target: host,
      props: { hasSave: false, onNewGame: () => {}, onContinue: () => {} },
    });
    await page.getByRole("button", { name: "Begin a Dynasty" }).click();
    await vitest.waitFor(() => expect(host.textContent).toContain("CHOOSE YOUR BLOODLINE"));
    // Verify by visible button text — decoupled from CSS class names.
    await vitest.waitFor(() => {
      expect(host.textContent).toContain("Play as Trump");
      expect(host.textContent).toContain("Play as Musk");
      expect(host.textContent).toContain("Play as Kennedy");
    });
  });

  it("carousel back button returns to the title screen (de-5d)", async () => {
    component = mount(TitleScreen, {
      target: host,
      props: { hasSave: false, onNewGame: () => {}, onContinue: () => {} },
    });
    await page.getByRole("button", { name: "Begin a Dynasty" }).click();
    await vitest.waitFor(() => expect(host.textContent).toContain("CHOOSE YOUR BLOODLINE"));
    await page.getByRole("button", { name: "← Back" }).click();
    await vitest.waitFor(() => expect(host.textContent).toContain("Begin a Dynasty"));
  });

  it("Musk dynasty card fires onNewGame with 'musk' key (de-5d)", async () => {
    const onNewGame = vi.fn();
    component = mount(TitleScreen, {
      target: host,
      props: { hasSave: false, onNewGame, onContinue: () => {} },
    });
    await page.getByRole("button", { name: "Begin a Dynasty" }).click();
    await vitest.waitFor(() => expect(host.textContent).toContain("Play as Musk"));
    await page.getByRole("button", { name: "Play as Musk →" }).click();
    await vitest.waitFor(() => {
      const [, dynasty] = onNewGame.mock.calls[0] ?? [];
      expect(dynasty).toBe("musk");
    });
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
