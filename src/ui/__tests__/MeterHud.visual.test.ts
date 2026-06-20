import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { initMeters } from "../../sim/meters";
import MeterHud from "../MeterHud.svelte";
import { applyBrandTokens, makeHost } from "./visualHarness";

const content = buildContent(validRaw());

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

describe("MeterHud visual", () => {
  it("renders the full HUD without layout errors", async () => {
    component = mount(MeterHud, {
      target: host,
      props: {
        defs: content.meters,
        meters: { ...initMeters(content.meters), money: 9_000_000, reputation: -30, heat: 85 },
      },
    });
    // Every gauge must have a visible fill arc.
    const fills = host.querySelectorAll("path.fill");
    expect(fills).toHaveLength(6);
    // Sanity: the HUD occupies real space (catches CSS collapse regressions).
    const rect = (host.firstElementChild as HTMLElement).getBoundingClientRect();
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);

    // Capture a screenshot artifact so the rendering can be eyeballed/reviewed.
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
