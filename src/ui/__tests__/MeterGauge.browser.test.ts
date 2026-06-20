import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { MeterDef } from "../../sim/schema";
import MeterGauge from "../MeterGauge.svelte";

const moneyDef: MeterDef = {
  id: "money",
  label: "Money",
  icon: "💰",
  scale: "log",
  min: 0,
  max: 1e12,
  start: 1000,
  color: "#d4af37",
  signed: false,
};
const healthDef: MeterDef = {
  id: "health",
  label: "Health",
  icon: "❤️",
  scale: "linear",
  min: 0,
  max: 100,
  start: 100,
  critLow: 15,
  color: "#b03030",
  signed: false,
};

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("MeterGauge", () => {
  it("formats a log money meter as net worth", () => {
    component = mount(MeterGauge, { target: host, props: { def: moneyDef, value: 1_200_000_000 } });
    expect(host.textContent).toContain("$1.2B");
    expect(host.querySelector("path.fill")).not.toBeNull();
  });

  it("shows a linear meter as an integer", () => {
    component = mount(MeterGauge, { target: host, props: { def: healthDef, value: 73 } });
    expect(host.textContent).toContain("73");
  });

  it("adds the crit class when in the critical band", () => {
    component = mount(MeterGauge, { target: host, props: { def: healthDef, value: 8 } });
    expect(host.querySelector(".gauge")?.classList.contains("crit")).toBe(true);
  });

  it("renders the fill arc proportional to value (dasharray changes)", () => {
    component = mount(MeterGauge, { target: host, props: { def: healthDef, value: 100 } });
    const fill = host.querySelector("path.fill") as SVGPathElement;
    const full = fill.getAttribute("stroke-dasharray");
    unmount(component);
    host.innerHTML = "";
    component = mount(MeterGauge, { target: host, props: { def: healthDef, value: 20 } });
    const partial = (host.querySelector("path.fill") as SVGPathElement).getAttribute(
      "stroke-dasharray",
    );
    expect(full).not.toBe(partial);
  });
});
