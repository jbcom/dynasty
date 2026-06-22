import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyMotivators, initMotivators } from "../../../sim/motivators";
import { projectSaga } from "../../../sim/readModel";
import SagaPanel from "../SagaPanel.svelte";

/** SS-14 — the SagaPanel renders the read-model: macro-act, character, motivators, glimpses. */

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

describe("SagaPanel", () => {
  it("renders the macro-act, year, and the dominant-pole character line", () => {
    const view = projectSaga({
      year: 1899,
      motivators: applyMotivators(initMotivators(), { worldview: -80 }),
      rung: 0,
    });
    component = mount(SagaPanel, { target: host, props: { view } });
    expect(host.textContent).toContain("Convergence");
    expect(host.textContent).toContain("1899");
    expect(host.textContent).toContain("faith"); // dominant pole
    expect(host.textContent).toContain("poor"); // rung
  });

  it("lists all eight motivators", () => {
    const view = projectSaga({ year: 1950, motivators: initMotivators() });
    component = mount(SagaPanel, { target: host, props: { view } });
    const panel = host.querySelector('[data-testid="motivators"]');
    expect(panel?.querySelectorAll(".axis")).toHaveLength(8);
  });

  it("shows glimpses of other lines with their relation", () => {
    const view = {
      ...projectSaga({ year: 1950, motivators: initMotivators() }),
      glimpses: [
        {
          rivalId: "rival:italian",
          label: "italian",
          relation: "opposing" as const,
          note: "rising",
          rung: 2,
          archetype: "economic" as const,
        },
      ],
    };
    component = mount(SagaPanel, { target: host, props: { view } });
    const glimpses = host.querySelector('[data-testid="glimpses"]');
    expect(glimpses?.textContent).toContain("italian");
    expect(glimpses?.querySelector('[data-relation="opposing"]')).toBeTruthy();
    // RB-4: the rival's rung is shown (★ per rung+1) so the player sees their crossings move it.
    expect(glimpses?.querySelector(".glimpse-rung")?.textContent).toBe("★★★"); // rung 2 → 3 stars
    // RB-8: each glimpse carries a small archetype silhouette vignette (a single silhouette layer).
    const vignette = glimpses?.querySelector(".glimpse-vignette [data-testid='scene-stage']");
    expect(vignette).toBeTruthy();
    expect(vignette?.classList.contains("silhouette")).toBe(true);
  });
});
