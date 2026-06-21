import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
