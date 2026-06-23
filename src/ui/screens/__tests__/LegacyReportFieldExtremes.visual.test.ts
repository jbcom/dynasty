import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { validRaw } from "../../../sim/__tests__/fixtures";
import { buildContent } from "../../../sim/content";
import { initState } from "../../../sim/state";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import LegacyReport from "../LegacyReport.svelte";

/**
 * FIELD-EXTREMES-SCREENSHOT — a visual capture of the legacy finale with BOTH field extremes present: a line
 * that reached the STARS (ascendant gold register), a line that DROPPED OUT (struck + dimmed), plus the
 * family's hard-seasons ledger. Per the "own quality, especially visuals" doctrine, the screenshot is captured
 * (and read by the author) to confirm the two registers actually read apart — the structural browser tests
 * assert markers + colors, but only the eye confirms the registers land as intended.
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

describe("LegacyReport — field extremes (FIELD-EXTREMES-SCREENSHOT)", () => {
  it("captures the finale with a star line, a dropped-out line, and the hard-seasons ledger", async () => {
    const state = {
      ...initState(content, "seed"),
      // A line that took a blow and clawed it back — so the ledger shows a loss-then-comeback rhythm.
      flags: ["shock:meter_blow:1920", "recovered:money:1920", "shock:family_death:1950"],
      end: { kind: "apex" as const, year: 2200, reason: "Carried the name to the stars." },
    };
    const convergence = {
      id: "stars_allies",
      destination: "stars" as const,
      title: "The Covenant Among the Stars",
      prose: "The line that began among strangers ended as keeper of a covenant between worlds.",
      rivalEpilogue: "Others climbed beside you into the dark; some fell away along the road.",
      gate: {},
    };
    component = mount(LegacyReport, {
      target: host,
      props: {
        content,
        state,
        end: state.end,
        convergence,
        rivalStandings: [
          // The high extreme: a line among the stars (ascendant gold).
          { id: "rival:bavaria", label: "rival:bavaria", rung: 5, faltering: false, fallen: false },
          // A mid line for contrast.
          { id: "rival:italian", label: "rival:italian", rung: 2, faltering: false, fallen: false },
          // The low extreme: a line that dropped out (struck + dimmed).
          { id: "rival:chinese", label: "rival:chinese", rung: 0, faltering: false, fallen: true },
        ],
        onRestart: () => {},
      },
    });
    // Both extremes present in the DOM before the capture (so the screenshot is meaningful).
    const items = [...host.querySelectorAll("[data-testid='rival-finale'] li")];
    expect(items.some((li) => li.getAttribute("data-stars") === "true")).toBe(true);
    expect(items.some((li) => li.getAttribute("data-fallen") === "true")).toBe(true);
    expect(host.querySelector("[data-testid='legacy-ledger']")).not.toBeNull();
    // Capture the finale surface — the artifact the author reads to confirm the registers read apart.
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
