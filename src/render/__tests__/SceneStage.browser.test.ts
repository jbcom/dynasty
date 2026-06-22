import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { composeScene } from "../composeScene";
import SceneStage from "../SceneStage.svelte";

/**
 * RB-8 SceneStage — renders a composeScene descriptor as the procedural era wash + stacked portrait
 * layers behind the prose. Atmosphere-first: the wash ships now and is asserted here; portrait layer
 * <img>s resolve real art as it lands (and hide on error), so these assert structure + the wash, not
 * pixel art. The visual screenshot pass against the caricature reference happens at build time.
 */

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

describe("SceneStage (RB-8)", () => {
  it("renders the procedural era wash + the stacked portrait layers for a scene frame", () => {
    const frame = composeScene({
      variant: "scene",
      archetype: "economic",
      cls: "poor",
      eraId: "origins",
      sense: "sight",
      pole: "ruthless",
    });
    component = mount(SceneStage, { target: host, props: { frame } });
    const stage = host.querySelector('[data-testid="scene-stage"]');
    expect(stage).toBeTruthy();
    // The procedural wash is present with both gradient stops from the era ramp.
    const wash = host.querySelector('[data-testid="scene-wash"]');
    expect(wash).toBeTruthy();
    expect(wash?.innerHTML).toContain(frame.wash?.top ?? "###");
    expect(wash?.innerHTML).toContain(frame.wash?.bottom ?? "###");
    // One <img> per portrait layer (base + tier + mood).
    const layers = host.querySelectorAll(".layer");
    expect(layers).toHaveLength(3);
    expect([...layers].map((l) => l.getAttribute("data-role"))).toEqual(["base", "tier", "mood"]);
  });

  it("renders a reduced silhouette vignette with no wash for a rival frame", () => {
    const frame = composeScene({
      variant: "rival",
      archetype: "athletic",
      cls: "middle",
      eraId: "mogul",
    });
    component = mount(SceneStage, { target: host, props: { frame } });
    expect(
      host.querySelector('[data-testid="scene-stage"]')?.classList.contains("silhouette"),
    ).toBe(true);
    // No wash for a silhouette; a single layer.
    expect(host.querySelector('[data-testid="scene-wash"]')).toBeNull();
    expect(host.querySelectorAll(".layer")).toHaveLength(1);
  });

  it("exposes the descriptor key so a generation/era change cross-fades the stage", () => {
    const frame = composeScene({
      variant: "scene",
      archetype: "political",
      cls: "poor",
      eraId: "stars",
      sense: "sound",
    });
    component = mount(SceneStage, { target: host, props: { frame } });
    expect(host.querySelector("[data-stage-key]")?.getAttribute("data-stage-key")).toBe(frame.key);
  });

  it("builds DOM-safe gradient ids even when the era id has spaces/colons (the key carries both)", () => {
    // A macro-act title flows in as eraId — frame.key then has ":" and spaces, invalid in an SVG id and
    // would break the url(#…) reference. The id must be slugified; the rect fill must match the def id.
    const frame = composeScene({
      variant: "scene",
      archetype: "economic",
      cls: "poor",
      eraId: "Mars Interregnum",
      sense: "sight",
    });
    component = mount(SceneStage, { target: host, props: { frame } });
    const grad = host.querySelector("linearGradient");
    const id = grad?.getAttribute("id") ?? "";
    expect(id).not.toBe("");
    expect(id).not.toMatch(/[\s:]/); // no spaces or colons
    expect(id).toMatch(/^grad-[A-Za-z0-9_-]+$/);
    // The rect references the SAME id (the gradient actually applies).
    const fill = host.querySelector("rect")?.getAttribute("fill") ?? "";
    expect(fill).toBe(`url(#${id})`);
  });
});
