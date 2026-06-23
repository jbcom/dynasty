import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import RivalDossier from "../RivalDossier.svelte";

/**
 * MID-RUN-FIELD-GLANCE-SCREENSHOT — a visual capture of the in-run "The Field" dossier (the live convergence-race
 * surface) showing a MIX of states — surging, faltering, fallen, steady — with the player's line slotted in and
 * the per-line trend arrows. The finale field is already screenshotted (FIELD-EXTREMES-SCREENSHOT); this closes
 * the visual-coverage gap on the LIVE surface, per the "own quality, especially visuals" doctrine: capture, then
 * READ the image to confirm the in-run race reads as clearly at a glance as the finale does.
 */

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

describe("RivalDossier — mid-run field glance (MID-RUN-FIELD-GLANCE-SCREENSHOT)", () => {
  it("captures the live field with a mix of surging / faltering / fallen / steady states", async () => {
    // A field spanning every state, relative to a mid-rung (2) player, with varied trends.
    const standings = [
      {
        id: "rival:bavaria",
        label: "rival:bavaria",
        rung: 4,
        faltering: false,
        trend: "rising" as const,
        fallen: false,
      }, // surging
      {
        id: "rival:italian",
        label: "rival:italian",
        rung: 1,
        faltering: true,
        trend: "falling" as const,
        fallen: false,
      }, // faltering
      {
        id: "rival:chinese",
        label: "rival:chinese",
        rung: 0,
        faltering: false,
        trend: "falling" as const,
        fallen: true,
      }, // fallen
      {
        id: "rival:scandinavian",
        label: "rival:scandinavian",
        rung: 2,
        faltering: false,
        trend: "steady" as const,
        fallen: false,
      }, // holding
    ];
    component = mount(RivalDossier, { target: host, props: { standings, playerRung: 2 } });
    const rows = [...host.querySelectorAll('[data-testid="rival-dossier"] .row')];
    // Every state present + the player's line slotted in (so the screenshot shows the full spread).
    const states = rows.map((r) => r.getAttribute("data-state"));
    expect(states).toContain("surging");
    expect(states).toContain("faltering");
    expect(states).toContain("fallen");
    expect(states).toContain("you");
    // Capture the live field surface — the artifact the author reads to confirm the race reads at a glance.
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
