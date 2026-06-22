import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { initState } from "../../sim/state";
import Dossier from "../Dossier.svelte";

/**
 * The Dossier is the meter HUD reference pattern (UQ-UI): each meter is icon + label + value + a
 * magnitude BAR. These tests pin that structure + the type-role contract (data rows use the UI face,
 * not the prose serif).
 */

const content = loadContent();

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

describe("Dossier (UQ-UI meter HUD pattern)", () => {
  it("renders one meter row per def, each with a magnitude bar + value", () => {
    component = mount(Dossier, {
      target: host,
      props: { defs: content.meters, gameState: initState(content, "seed") },
    });
    const rows = host.querySelectorAll(".meters li");
    expect(rows.length).toBe(content.meters.length);
    // Every row carries a fill bar with a width (the magnitude cue).
    const fills = host.querySelectorAll<HTMLElement>(".meters .bar i");
    expect(fills.length).toBe(content.meters.length);
    for (const f of fills) expect(f.style.width).toMatch(/%$/);
  });

  it("meter values use tabular numerals so the value column aligns (UQ-UI)", () => {
    component = mount(Dossier, {
      target: host,
      props: { defs: content.meters, gameState: initState(content, "seed") },
    });
    const val = host.querySelector<HTMLElement>(".meters .val");
    expect(val).toBeTruthy();
    // tabular-nums keeps a column of values aligned — part of the data type-role treatment.
    expect(getComputedStyle(val as HTMLElement).fontVariantNumeric).toContain("tabular-nums");
  });
});
