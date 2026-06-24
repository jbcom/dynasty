import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { FIXTURE_ACT } from "../../../sim/saga/__tests__/fixture";
import type { BraidedThread } from "../../../sim/saga/player";
import { buildCorpus } from "../../../sim/saga/player";
import SceneReader from "../SceneReader.svelte";

/**
 * The SceneReader renders a scene as a PAGED novel: ONE paragraph at a time, tap to advance; when the
 * prose is spent the choice folds in as glowing inline options; tapping away while options are up urges
 * (pulses) without advancing. Driven by the self-contained FIXTURE act (not the live GenAI corpus).
 */

const corpus = buildCorpus(FIXTURE_ACT.acts, FIXTURE_ACT.scenes);
const open = corpus.scenes.get("sc:fix:open"); // 2 prose paras + 2 alternative beats
const close = corpus.scenes.get("sc:fix:close"); // 2 prose paras + 3-option major decision
if (!open || !close) throw new Error("fixture scenes missing");

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

/** Tap the page body (the full-bleed tap layer) — turns the page, or urges when options are up. */
function tapPage() {
  (host.querySelector(".tap-layer") as HTMLButtonElement).click();
  flushSync(); // apply the reactive state update before asserting
}

beforeEach(() => {
  host = document.createElement("div");
  host.style.width = "412px";
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("SceneReader (paged)", () => {
  it("shows ONE paragraph at a time and turns the page on tap", () => {
    component = mount(SceneReader, { target: host, props: { scene: open } });
    // Only one paragraph visible at a time.
    expect(host.querySelectorAll('[data-testid="para"]').length).toBe(1);
    const first = host.querySelector('[data-testid="para"]')?.textContent ?? "";
    expect(first.length).toBeGreaterThan(80); // real prose, not a fragment
    // No options yet (still on the first of two paragraphs).
    expect(host.querySelector('[data-testid="weave"]')).toBeNull();
    // Tap the page → next paragraph.
    tapPage();
    const second = host.querySelector('[data-testid="para"]')?.textContent ?? "";
    expect(second).not.toBe(first);
  });

  it("folds the weave options in as inline glowing text once the prose is spent", () => {
    let picked = -1;
    component = mount(SceneReader, {
      target: host,
      props: { scene: open, onbeat: (i: number) => (picked = i) },
    });
    tapPage(); // page to the last paragraph → options reveal
    const para = host.querySelector('[data-testid="para"]');
    expect(para?.querySelector('[data-testid="weave"]')).not.toBeNull();
    const options = host.querySelectorAll('[data-testid="weave"] .inline-option');
    expect(options.length).toBe(2);
    (options[1] as HTMLButtonElement).click();
    expect(picked).toBe(1);
  });

  it("resolves identity tokens through the term fn", () => {
    const term = (t: string) => t.replaceAll("{family_name}", "Gallagher");
    component = mount(SceneReader, { target: host, props: { scene: open, term } });
    expect(host.textContent).toContain("Gallagher");
    expect(host.textContent).not.toContain("{family_name}");
  });

  it("EI-9d: a portrait whose asset fails to load HIDES itself (graceful prose-only fallback)", async () => {
    // A non-adult life-stage / era key may not be generated yet (the matrix is on-demand) — a 404 must
    // degrade to prose-only, not a broken-image icon. Point at a guaranteed-missing asset and await its error.
    component = mount(SceneReader, {
      target: host,
      props: {
        scene: open,
        portraitSrc: "/assets/generated/portraits/__nonexistent_ei9d_test__.png",
      },
    });
    const img = host.querySelector("img.portrait") as HTMLImageElement;
    expect(img, "the portrait img mounts").not.toBeNull();
    await new Promise<void>((resolve) => {
      if (img.style.display === "none") return resolve();
      img.addEventListener("error", () => resolve(), { once: true });
      // Fallback timeout so the test can't hang if the browser doesn't fire error.
      setTimeout(resolve, 2000);
    });
    flushSync();
    expect(img.style.display, "the broken portrait is hidden").toBe("none");
  });

  it("shows a tiered decision as inline options and emits the chosen one", () => {
    let opt = -1;
    component = mount(SceneReader, {
      target: host,
      props: { scene: close, ondecision: (i: number) => (opt = i) },
    });
    tapPage(); // page to the last paragraph → decision reveals
    const decision = host.querySelector('[data-testid="decision"]');
    expect(decision?.getAttribute("data-tier")).toBe("major");
    const options = host.querySelectorAll('[data-testid="decision"] .inline-option');
    expect(options.length).toBe(3);
    // KP-1: the choice run is physically inside the prose paragraph, not a detached ruled-off block.
    const choices = host.querySelector<HTMLElement>('[data-testid="decision"]');
    expect(choices?.parentElement?.getAttribute("data-testid")).toBe("para");
    expect(getComputedStyle(choices as HTMLElement).borderTopWidth).toBe("0px");
    (options[0] as HTMLButtonElement).click();
    expect(opt).toBe(0);
  });

  it("tapping away while options are up URGES (pulses) instead of advancing", () => {
    component = mount(SceneReader, { target: host, props: { scene: open } });
    tapPage(); // reveal options
    expect(host.querySelector('[data-testid="weave"]')).not.toBeNull();
    // Tap the page body (not an option) → the choices container gets the `urging` class, no advance.
    tapPage();
    expect(host.querySelector('[data-testid="weave"]')?.classList.contains("urging")).toBe(true);
    // Options are still present (did not advance past them).
    expect(host.querySelectorAll('[data-testid="weave"] .inline-option').length).toBe(2);
  });

  it("tints the page by the scene's sense", () => {
    component = mount(SceneReader, { target: host, props: { scene: open } });
    expect(host.querySelector('[data-sense="smell"]')).toBeTruthy();
  });

  it("KEY-PILLARS-1e: renders a non-text reader progress rail that advances with page turns", () => {
    component = mount(SceneReader, { target: host, props: { scene: open } });
    const rail = host.querySelector<HTMLElement>('[data-testid="reader-progress"]');
    expect(rail).not.toBeNull();
    expect(rail?.textContent?.trim()).toBe("");
    expect(rail?.getAttribute("aria-hidden")).toBe("true");
    expect(rail?.querySelectorAll(".progress-step").length).toBe(2);
    expect(rail?.getAttribute("data-current-page")).toBe("1");
    expect(rail?.querySelector(".progress-step.active")).toBe(
      rail?.querySelectorAll(".progress-step")[0],
    );

    tapPage();
    expect(rail?.getAttribute("data-current-page")).toBe("2");
    expect(rail?.querySelector(".progress-step.active")).toBe(
      rail?.querySelectorAll(".progress-step")[1],
    );
    expect(rail?.querySelector(".progress-step.past")).toBe(
      rail?.querySelectorAll(".progress-step")[0],
    );
  });

  it("KEY-PILLARS-1e: marks woven thread pages in the same reader rail", () => {
    const thread: BraidedThread = {
      wave: "fixture-neighbor",
      crossing: "Another family crosses the landing, carrying its hunger in a different tongue.",
      relation: "neutral",
      scene: close,
    };
    component = mount(SceneReader, { target: host, props: { scene: open, threads: [thread] } });
    const rail = host.querySelector<HTMLElement>('[data-testid="reader-progress"]');
    expect(rail?.querySelectorAll(".progress-step").length).toBe(5);
    expect(rail?.querySelectorAll("[data-woven]").length).toBe(3);
  });

  it("KEY-PILLARS-1e: captures the reader rail as visual proof", async () => {
    component = mount(SceneReader, { target: host, props: { scene: open } });
    await page.screenshot({ element: host.firstElementChild as Element });
  });

  it("exposes the scene id + a scene-keyed body for between-scene transitions (RB-3)", () => {
    component = mount(SceneReader, { target: host, props: { scene: open } });
    // data-scene-id surfaces the runner's scene to harness/e2e walks; .scene-body is the fade-keyed wrapper.
    expect(host.querySelector(`[data-scene-id="${open.id}"]`)).toBeTruthy();
    expect(host.querySelector(".scene-body")).toBeTruthy();
  });
});
