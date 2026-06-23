import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { validRaw } from "../../../sim/__tests__/fixtures";
import { buildContent } from "../../../sim/content";
import { initState } from "../../../sim/state";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import LegacyReport from "../LegacyReport.svelte";

/**
 * FINALE-APEX-VS-RUIN-CONTRAST — the LegacyReport must read TONALLY different for a triumphant apex finale vs a
 * grim extinguished one, not merely swap the headline text. This captures both for visual review (the author
 * reads the two images to confirm gold ascendance vs stark loss) and asserts the structural markers that drive
 * that contrast (the apex kicker present only on the apex; data-end reflecting the outcome).
 */

const content = buildContent(validRaw());

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

describe("LegacyReport — apex vs ruin tone (FINALE-APEX-VS-RUIN-CONTRAST)", () => {
  it("captures a triumphant apex finale and a grim extinguished one for visual review", async () => {
    // The triumphant apex.
    // A triumphant ending → the "endgame-good" tier (gold ascendance). (The literal `apex` tier requires an
    // authored ending lookup; the tonal contrast under test is good-gold vs bad-stark, which `victory` drives.)
    const apexState = {
      ...initState(content, "seed"),
      end: { kind: "victory" as const, year: 2200, reason: "Carried the name to the stars." },
    };
    component = mount(LegacyReport, {
      target: host,
      props: {
        content,
        state: apexState,
        end: apexState.end,
        convergence: {
          id: "stars_allies",
          destination: "stars" as const,
          title: "The Covenant Among the Stars",
          prose: "The line ended as keeper of a covenant between worlds.",
          gate: {},
        },
        onRestart: () => {},
      },
    });
    const apexMain = host.querySelector("main.report");
    // The triumphant finale reads in the GOOD tier (gold) — distinct from the ruin's bad tier below.
    expect(apexMain?.getAttribute("data-tier")).toBe("endgame-good");
    const goodTitleColor = getComputedStyle(host.querySelector("h1") as HTMLElement).color;
    await page.screenshot({ element: host.firstElementChild as Element });

    // The grim ruin.
    unmount(component);
    const ruinState = {
      ...initState(content, "seed"),
      end: {
        kind: "ruin" as const,
        year: 1899,
        reason: "The line collapsed into debt and disgrace.",
      },
    };
    component = mount(LegacyReport, {
      target: host,
      props: {
        content,
        state: ruinState,
        end: ruinState.end,
        convergence: {
          id: "extinguished_ruin",
          destination: "extinguished" as const,
          title: "The Line Ends",
          prose: "Nothing of the house survived the reckoning.",
          gate: {},
        },
        onRestart: () => {},
      },
    });
    const ruinMain = host.querySelector("main.report");
    // The ruin finale reads in the BAD tier (stark) — not apex, no kicker, a distinct data-end.
    expect(ruinMain?.classList.contains("apex"), "the ruin finale is NOT apex").toBe(false);
    expect(host.querySelector(".apex-kicker"), "no apex kicker on a ruin").toBeNull();
    expect(ruinMain?.getAttribute("data-tier")).toBe("endgame-bad");
    expect(ruinMain?.getAttribute("data-end")).toBe("ruin");
    // The TITLE reads in a tonally different color than the triumphant finale's (gold ascendance vs stark loss).
    const badTitleColor = getComputedStyle(host.querySelector("h1") as HTMLElement).color;
    expect(badTitleColor, "ruin title reads in a different register than victory").not.toBe(
      goodTitleColor,
    );
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
