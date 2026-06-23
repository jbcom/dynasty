import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadContent } from "../../../data/loadContent";
import type { GameView } from "../../../engine/loop";
import { validRaw } from "../../../sim/__tests__/fixtures";
import { buildContent } from "../../../sim/content";
import { initMeters } from "../../../sim/meters";
import { initState } from "../../../sim/state";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import LegacyReport from "../LegacyReport.svelte";
import OpeningScreen from "../OpeningScreen.svelte";
import PlayScreen from "../PlayScreen.svelte";
import TitleScreen from "../TitleScreen.svelte";

const realContent = loadContent();

/**
 * MOBILE-SAFE-AREA-AUDIT — on a notched device the PlayScreen must respect the system insets: the header pads the
 * TOP inset and the scroll region pads the BOTTOM inset, so content clears the notch / home indicator. jsdom/the
 * test browser resolves `env(safe-area-inset-*)` to 0 (no notch), so we can't read a pixel value; instead we audit
 * that the relevant rules REFERENCE the inset in their CSS — a regression that drops the env() call fails here.
 */

const content = buildContent(validRaw());

function view(): GameView {
  return {
    state: { ...initState(content, "seed"), meters: { ...initMeters(content.meters) } },
    currentEvent: content.allEvents[0] ?? null,
    saga: { actTitle: null, scene: null, threads: [], ended: false },
    glimpses: [],
    rivalStandings: [],
    rivalNews: [],
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

// Collect the full CSS text of all stylesheets attached for the mounted component (Svelte injects a <style>).
function allCssText(): string {
  let css = "";
  for (const sheet of [...document.styleSheets]) {
    try {
      for (const rule of [...sheet.cssRules]) css += rule.cssText;
    } catch {
      // cross-origin sheet — skip
    }
  }
  return css;
}

describe("safe-area audit (MOBILE-SAFE-AREA-AUDIT)", () => {
  it("the header pads the top inset and the scroll region pads the bottom inset", () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    // Both surfaces exist.
    expect(host.querySelector('[data-testid="saga-head"]'), "the header renders").not.toBeNull();
    expect(host.querySelector(".content"), "the scroll region renders").not.toBeNull();

    const css = allCssText();
    // The header rule references the TOP inset; the scroll region references the BOTTOM inset.
    expect(css, "the header pads safe-area-inset-top").toMatch(
      /\.saga-head[^}]*safe-area-inset-top/,
    );
    expect(css, "the scroll region pads safe-area-inset-bottom").toMatch(
      /\.content[^}]*safe-area-inset-bottom/,
    );
  });

  it("SAFE-AREA-LEGACYREPORT: the finale report pads the bottom inset so Play Again clears the home bar", () => {
    const state = {
      ...initState(content, "seed"),
      end: { kind: "victory" as const, year: 2080, reason: "Carried the name to the stars." },
    };
    component = mount(LegacyReport, {
      target: host,
      props: { content, state, end: state.end, onRestart: () => {} },
    });
    expect(host.querySelector("main.report"), "the finale report renders").not.toBeNull();
    // The report rule references the bottom inset (the test browser resolves it to 0, so we audit the reference).
    expect(allCssText(), "the report pads safe-area-inset-bottom").toMatch(
      /\.report[^}]*safe-area-inset-bottom/,
    );
  });

  it("SAFE-AREA-OPENING-TITLE: the Title and Opening screens pad BOTH the top and bottom insets", () => {
    // Title — the first screen; its container pads top (masthead) + bottom (action buttons).
    component = mount(TitleScreen, {
      target: host,
      props: { hasSave: false, onNewGame: () => {}, onContinue: () => {}, onSettings: () => {} },
    });
    let css = allCssText();
    expect(css, "title pads safe-area-inset-top").toMatch(/\.panel-screen[^}]*safe-area-inset-top/);
    expect(css, "title pads safe-area-inset-bottom").toMatch(
      /\.panel-screen[^}]*safe-area-inset-bottom/,
    );

    // Opening — the lived Epoch-0 emergence (EI-6b); its container pads top + bottom so the SceneReader's
    // prose + glowing choices clear the insets.
    unmount(component);
    component = mount(OpeningScreen, {
      target: host,
      props: { content: realContent, seed: "audit-seed", onComplete: () => {}, onCancel: () => {} },
    });
    css = allCssText();
    expect(css, "opening pads safe-area-inset-top").toMatch(/\.opening[^}]*safe-area-inset-top/);
    expect(css, "opening pads safe-area-inset-bottom").toMatch(
      /\.opening[^}]*safe-area-inset-bottom/,
    );
  });
});
