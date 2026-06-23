import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { loadContent } from "../../../data/loadContent";
import type { GameView } from "../../../engine/loop";
import { initMeters } from "../../../sim/meters";
import { initState } from "../../../sim/state";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import PlayScreen from "../PlayScreen.svelte";

/**
 * MARKETS-NEWS-TAB-SCREENSHOT — the last two un-shot live surfaces (the chronicle + STATS-CHOICES covered the
 * rest). Real content (loadContent) carries world timelines + markets so both tabs surface. Captured for a
 * legibility / luxury-register read, completing the per-tab visual coverage.
 */

const content = loadContent();

function view(): GameView {
  return {
    state: {
      ...initState(content, "seed"),
      meters: { ...initMeters(content.meters), money: 5_000_000 },
    },
    currentEvent: content.allEvents[0] ?? null,
    saga: { actTitle: null, scene: null, threads: [], ended: false },
    glimpses: [],
    rivalStandings: [],
    // A rival dispatch guarantees the News tab surfaces even if timelines are quiet at the start year.
    rivalNews: [
      { id: "rival:bavaria", kind: "surged", headline: "The Bavaria line has edged ahead of you." },
    ],
    foreshadow: null,
    canInvestRecovery: false,
    rung: 0,
    convergence: null,
    lastLedger: [],
    shock: null,
  };
}

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

describe("Markets + News tab shots (MARKETS-NEWS-TAB-SCREENSHOT)", () => {
  it("captures the Markets and News tabs for visual review", async () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });

    // NEWS — rival dispatches + world timeline.
    await page.getByRole("tab", { name: /News/ }).click();
    flushSync();
    expect(host.querySelector(".content")?.textContent, "the News tab has content").toBeTruthy();
    await page.screenshot({ element: host.firstElementChild as Element });

    // MARKETS — the era markets / ranks readout.
    await page.getByRole("tab", { name: /Markets/ }).click();
    flushSync();
    expect(host.querySelector(".content")?.textContent, "the Markets tab has content").toBeTruthy();
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
