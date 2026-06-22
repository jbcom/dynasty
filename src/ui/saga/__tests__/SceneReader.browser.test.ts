import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FIXTURE_ACT } from "../../../sim/saga/__tests__/fixture";
import { buildCorpus } from "../../../sim/saga/player";
import SceneReader from "../SceneReader.svelte";

/**
 * The SceneReader renders one scene as a page of a novel: multi-paragraph prose, a weave of
 * alternative beats, the terminal tiered decision — resolving identity tokens and emitting the
 * player's choice. Driven by the self-contained FIXTURE act (not the live GenAI corpus).
 */

const corpus = buildCorpus(FIXTURE_ACT.acts, FIXTURE_ACT.scenes);
const hold = corpus.scenes.get("sc:fix:open"); // no-decision scene with 2 alternative beats
const landing = corpus.scenes.get("sc:fix:close"); // major-decision scene
if (!hold || !landing) throw new Error("fixture scenes missing");

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

describe("SceneReader", () => {
  it("renders MULTI-PARAGRAPH novel prose, not a fragment", () => {
    component = mount(SceneReader, { target: host, props: { scene: hold } });
    const paras = host.querySelectorAll(".prose .para");
    expect(paras.length).toBeGreaterThanOrEqual(2);
    expect((paras[0]?.textContent ?? "").length).toBeGreaterThan(80);
  });

  it("resolves identity tokens through the term fn", () => {
    const term = (t: string) => t.replaceAll("{family_name}", "Gallagher");
    component = mount(SceneReader, { target: host, props: { scene: hold, term } });
    expect(host.textContent).toContain("Gallagher");
    expect(host.textContent).not.toContain("{family_name}");
  });

  it("offers the weave beats as alternatives and emits the chosen one", () => {
    let picked = -1;
    component = mount(SceneReader, {
      target: host,
      props: { scene: hold, onbeat: (i: number) => (picked = i) },
    });
    // hold's two beats are alternatives — both offered at once.
    const choices = host.querySelectorAll(".weave-choice");
    expect(choices.length).toBe(2);
    (choices[1] as HTMLButtonElement).click();
    expect(picked).toBe(1);
  });

  it("shows a tiered decision and emits the chosen option", () => {
    let opt = -1;
    component = mount(SceneReader, {
      target: host,
      props: { scene: landing, ondecision: (i: number) => (opt = i) },
    });
    const decision = host.querySelector('[data-testid="decision"]');
    expect(decision?.getAttribute("data-tier")).toBe("major");
    const options = host.querySelectorAll(".option");
    expect(options.length).toBe(3);
    (options[0] as HTMLButtonElement).click();
    expect(opt).toBe(0);
  });

  it("tints the page by the scene's sense", () => {
    component = mount(SceneReader, { target: host, props: { scene: hold } });
    expect(host.querySelector('[data-sense="smell"]')).toBeTruthy();
  });
});
