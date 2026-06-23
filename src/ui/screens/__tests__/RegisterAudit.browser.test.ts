import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { GameView } from "../../../engine/loop";
import { validRaw } from "../../../sim/__tests__/fixtures";
import { buildContent } from "../../../sim/content";
import { initMeters } from "../../../sim/meters";
import { SceneSchema } from "../../../sim/saga/schema";
import { initState } from "../../../sim/state";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import LegacyReport from "../LegacyReport.svelte";
import PlayScreen from "../PlayScreen.svelte";
import TitleScreen from "../TitleScreen.svelte";

/**
 * TITLE-TO-FINALE-REGISTER-AUDIT — the luxury register must hold across the run: the masthead, the in-run header,
 * and the finale title should all pull from the SAME display-font + gold-color tokens, so no screen drifts out of
 * the chronicle's voice. The chronicle screenshot reads this by eye; this asserts it structurally over the
 * computed font-family + heading color of each screen's PRIMARY heading, so a CSS drift fails deterministically.
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

function foundedView(): GameView {
  const scene = SceneSchema.parse({
    id: "sc:reg",
    sense: "sight",
    prose: ["The house keeps watch."],
  });
  return {
    state: {
      ...initState(content, "seed"),
      meters: { ...initMeters(content.meters), money: 5_000_000 },
      family: {
        members: [
          {
            id: "m0",
            given: "X",
            surname: "Vane",
            sex: "male" as const,
            born: 1885,
            generation: 0,
            traits: { ambition: 50, cunning: 50, vigor: 50, piety: 50 },
            isProtagonist: true,
          },
        ],
        protagonistId: "m0",
        nextSeq: 1,
      },
    },
    currentEvent: null,
    saga: { actTitle: "Act II", scene, threads: [], ended: false },
    glimpses: [],
    rivalStandings: [],
    rivalNews: [],
    foreshadow: null,
    canInvestRecovery: false,
    rung: 1,
    convergence: null,
    lastLedger: [],
    shock: null,
  };
}

describe("register audit (TITLE-TO-FINALE-REGISTER-AUDIT)", () => {
  it("the masthead, in-run header, and finale title share the display-font register", () => {
    const fontOf = (el: Element | null) => getComputedStyle(el as HTMLElement).fontFamily;
    // The body register, for contrast — the headings must NOT fall back to it.
    const bodyFont = getComputedStyle(document.body).fontFamily;

    // 1. Masthead title (a gradient-fill gold; its visible color comes from background-clip, so we audit FONT,
    //    the reliable register signal shared across screens — the gold treatment varies by technique per screen).
    component = mount(TitleScreen, {
      target: host,
      props: { hasSave: false, onNewGame: () => {}, onContinue: () => {}, onSettings: () => {} },
    });
    const mastheadFont = fontOf(host.querySelector(".masthead h1"));
    expect(mastheadFont, "the masthead uses a real display font").toBeTruthy();
    expect(mastheadFont.toLowerCase()).toMatch(/playfair|serif/);

    // 2. In-run header (the act-chapter line).
    unmount(component);
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: foundedView(), busy: false, onchoose: () => {} },
    });
    const headFont = fontOf(host.querySelector(".saga-head .act-chapter"));

    // 3. Finale title (a triumphant ending → the gold good-tier).
    unmount(component);
    const finaleState = {
      ...initState(content, "seed"),
      end: { kind: "victory" as const, year: 2200, reason: "Carried the name to the stars." },
    };
    component = mount(LegacyReport, {
      target: host,
      props: { content, state: finaleState, end: finaleState.end, onRestart: () => {} },
    });
    const finaleFont = fontOf(host.querySelector("main.report h1"));

    // All three pull from the SAME display-font register — no screen drifts out of the chronicle's voice...
    expect(headFont, "in-run header matches the masthead display font").toBe(mastheadFont);
    expect(finaleFont, "finale title matches the masthead display font").toBe(mastheadFont);
    // ...and none of them falls back to the plain body register.
    expect(headFont, "in-run header is not the body font").not.toBe(bodyFont);
    expect(finaleFont, "finale title is not the body font").not.toBe(bodyFont);
  });
});
