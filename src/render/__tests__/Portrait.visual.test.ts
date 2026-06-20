import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { applyBrandTokens, makeHost } from "../../ui/__tests__/visualHarness";
import Portrait from "../Portrait.svelte";

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

describe("Portrait", () => {
  it("renders a cartoon derivative for every portrait (no procedural placeholders)", async () => {
    component = mount(Portrait, { target: host, props: { portraitId: "mogul", size: 140 } });
    const el = host.querySelector('[data-portrait="mogul"]');
    expect(el).not.toBeNull();
    const img = el?.querySelector("img.layer") as HTMLImageElement | null;
    expect(img?.getAttribute("src")).toContain(".cartoon.png");
    await page.screenshot({ element: el as Element });
  });

  it("renders a cartoonified photo layer for a photo-backed portrait", () => {
    component = mount(Portrait, { target: host, props: { portraitId: "president", size: 140 } });
    const img = host.querySelector(
      '[data-portrait="president"] img.layer',
    ) as HTMLImageElement | null;
    expect(img?.getAttribute("src")).toContain("portraits/president_2025.cartoon.png");
  });

  it("renders the fallback for an unknown portrait without throwing", () => {
    component = mount(Portrait, { target: host, props: { portraitId: "ghost" } });
    expect(host.querySelector('[data-portrait="unknown"]')).not.toBeNull();
  });
});
