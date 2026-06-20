import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { initMeters } from "../../sim/meters";
import MeterHud from "../MeterHud.svelte";

const content = buildContent(validRaw());

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: Svelte mount returns an opaque component instance
let component: any;

beforeEach(() => {
  // Tokens must be present so the gauges resolve their colors.
  document.documentElement.style.setProperty("--mmm-meter-money", "#d4af37");
  host = document.createElement("div");
  document.body.appendChild(host);
});

afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("MeterHud", () => {
  it("renders one gauge per meter with labels", () => {
    component = mount(MeterHud, {
      target: host,
      props: { defs: content.meters, meters: initMeters(content.meters) },
    });
    const gauges = host.querySelectorAll("[data-meter]");
    expect(gauges).toHaveLength(6);
    expect(host.textContent).toContain("Money");
    expect(host.textContent).toContain("Health");
  });

  it("formats money as net worth and shows linear meters as integers", () => {
    component = mount(MeterHud, {
      target: host,
      props: {
        defs: content.meters,
        meters: { ...initMeters(content.meters), money: 1_200_000_000, power: 42 },
      },
    });
    expect(host.textContent).toContain("$1.2B");
    expect(host.textContent).toContain("42");
  });

  it("flags a critical meter", () => {
    component = mount(MeterHud, {
      target: host,
      props: {
        defs: content.meters,
        meters: { ...initMeters(content.meters), health: 5 },
      },
    });
    const health = host.querySelector('[data-meter="health"]');
    expect(health?.classList.contains("crit")).toBe(true);
  });
});
