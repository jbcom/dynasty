import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi, vitest } from "vitest";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { initState } from "../../sim/state";
import NewsTicker from "../NewsTicker.svelte";
import { applyBrandTokens, makeHost } from "./visualHarness";

// Content with two world timelines so the ticker has news to surface.
const content = buildContent({
  ...validRaw(),
  worldTimelines: [
    {
      scope: "manhattan",
      label: "Manhattan",
      events: [
        { id: "wm_1", year: 1975, headline: "City Nearly Broke", body: "Fiscal crisis." },
        { id: "wm_2", year: 2001, headline: "Towers Fall", body: "A grim morning." },
      ],
    },
    {
      scope: "science",
      label: "Science & Technology",
      events: [{ id: "wt_1", year: 1969, headline: "Men Walk On The Moon", body: "Apollo lands." }],
    },
  ],
});

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: Svelte mount returns an opaque component instance
let component: any;

beforeEach(() => {
  applyBrandTokens();
  host = makeHost();
});

afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("NewsTicker", () => {
  it("renders the latest headline per scope at or before the current year", () => {
    component = mount(NewsTicker, {
      target: host,
      props: { content, gameState: { ...initState(content, "seed"), year: 2001 } },
    });
    // Most-recent Manhattan headline at/<= 2001 is the towers, plus the moon.
    expect(host.textContent).toContain("Towers Fall");
    expect(host.textContent).toContain("Men Walk On The Moon");
    // Scope chips render with their friendly labels.
    expect(host.querySelector('[data-scope="manhattan"]')?.textContent).toBe("NYC");
    expect(host.querySelector('[data-scope="science"]')?.textContent).toBe("Science");
  });

  it("RIVAL-RACE-PRESENCE: surfaces rival dispatches (a stumble window + a surge pressure), accented apart", () => {
    component = mount(NewsTicker, {
      target: host,
      props: {
        content,
        gameState: { ...initState(content, "seed"), year: 2001 },
        rivalNews: [
          {
            id: "rival:italian",
            kind: "faltered" as const,
            headline: "Word reaches you: the Italian line has stumbled.",
          },
          {
            id: "rival:bavaria",
            kind: "surged" as const,
            headline: "The Bavaria line has outpaced you — its star rises.",
          },
        ],
      },
    });
    const block = host.querySelector("[data-testid='rival-news']");
    expect(block, "the rival dispatch block renders").not.toBeNull();
    expect(block?.textContent).toContain("Italian line has stumbled");
    expect(block?.textContent).toContain("Bavaria line has outpaced you");
    const items = [...host.querySelectorAll("[data-testid='rival-news'] li")];
    expect(items.length).toBe(2);
    const faltered = items.find((li) => li.getAttribute("data-kind") === "faltered");
    const surged = items.find((li) => li.getAttribute("data-kind") === "surged");
    expect(faltered, "a stumble window line renders").toBeDefined();
    expect(surged, "a surge pressure line renders").toBeDefined();
    // The window (gold) and the pressure (red) read apart.
    expect(getComputedStyle(faltered as HTMLElement).borderLeftColor).not.toBe(
      getComputedStyle(surged as HTMLElement).borderLeftColor,
    );
  });

  it("RIVAL-CROSSING-EXPLOIT: a faltered dispatch offers a Press button that fires onPress with the rival id", async () => {
    const onPress = vi.fn();
    component = mount(NewsTicker, {
      target: host,
      props: {
        content,
        gameState: { ...initState(content, "seed"), year: 2001 },
        rivalNews: [
          {
            id: "rival:italian",
            kind: "faltered" as const,
            headline: "The Italian line has stumbled.",
          },
          {
            id: "rival:bavaria",
            kind: "surged" as const,
            headline: "The Bavaria line has outpaced you.",
          },
        ],
        onPress,
      },
    });
    const buttons = [...host.querySelectorAll<HTMLButtonElement>(".rn-press")];
    // Only the FALTERED dispatch (a window) gets a press button — a surge doesn't.
    expect(buttons.length).toBe(1);
    buttons[0]?.click();
    await vitest.waitFor(() => expect(onPress).toHaveBeenCalledWith("rival:italian"));
  });

  it("RIVAL-CROSSING-EXPLOIT: no Press button when onPress is not provided (e.g. read-only contexts)", () => {
    component = mount(NewsTicker, {
      target: host,
      props: {
        content,
        gameState: { ...initState(content, "seed"), year: 2001 },
        rivalNews: [
          {
            id: "rival:italian",
            kind: "faltered" as const,
            headline: "The Italian line has stumbled.",
          },
        ],
      },
    });
    expect(host.querySelector(".rn-press")).toBeNull();
  });

  it("RIVAL-CROSSING-EXPLOIT: the Press button hides once the rival has been pressed THIS step (exploit guard)", () => {
    const onPress = vi.fn();
    const gs = { ...initState(content, "seed"), year: 2001 };
    // A press already recorded for this rival at the current history step (history.length === 0 here).
    gs.presses = [{ at: gs.history.length, rivalId: "rival:italian", year: 2001 }];
    component = mount(NewsTicker, {
      target: host,
      props: {
        content,
        gameState: gs,
        rivalNews: [
          {
            id: "rival:italian",
            kind: "faltered" as const,
            headline: "The Italian line has stumbled.",
          },
        ],
        onPress,
      },
    });
    // Already pressed this step → no button (the action is spent until the next step).
    expect(host.querySelector(".rn-press")).toBeNull();
  });

  it("shows a quiet-world empty state when there are no headlines (PL-11)", () => {
    component = mount(NewsTicker, {
      target: host,
      props: { content, gameState: { ...initState(content, "seed"), year: 1900 } },
    });
    // The section renders with its header + an empty-state line (not a blank panel).
    expect(host.querySelector(".news")).not.toBeNull();
    expect(host.querySelector(".empty")).not.toBeNull();
    expect(host.textContent).toMatch(/quiet for now/);
    expect(host.querySelector("li")).toBeNull(); // no headline rows
  });
});
