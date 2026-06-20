import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { initMeters } from "../../sim/meters";
import MeterHud from "../MeterHud.svelte";

const content = buildContent(validRaw());

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: Svelte mount returns an opaque component instance
let component: any;

beforeEach(() => {
  // Provide the brand tokens the gauges read at render time.
  const root = document.documentElement.style;
  root.setProperty("--mmm-meter-money", "#d4af37");
  root.setProperty("--mmm-meter-power", "#7a1f2b");
  root.setProperty("--mmm-meter-reputation", "#c08a2e");
  root.setProperty("--mmm-meter-loyalty", "#274690");
  root.setProperty("--mmm-meter-health", "#b03030");
  root.setProperty("--mmm-meter-heat", "#e2562a");
  root.setProperty("--mmm-surface", "#16264f");
  root.setProperty("--mmm-gold-deep", "#a8841f");
  root.setProperty("--mmm-text", "#f5f0e1");
  root.setProperty("--mmm-text-dim", "#b9c2da");
  document.body.style.background = "#0a1633";
  host = document.createElement("div");
  document.body.appendChild(host);
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
