import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
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
 * CHRONICLE-FULL-PLAYTHROUGH-SCREENSHOTS — the individual screens are each screenshotted elsewhere; this captures
 * a SEQUENCE across one founded run so the whole arc can be READ as a coherent visual story (consistent luxury
 * register, legible at each beat): title → an early scene → a dread omen → a recovery hope omen → the finale.
 * The author reads the five frames in order to confirm the run reads as one chronicle, not five disjoint screens.
 */

const content = buildContent(validRaw());

function foundedView(over: Partial<GameView> = {}): GameView {
  const base = {
    ...initState(content, "seed"),
    meters: { ...initMeters(content.meters), money: 5_000_000, heat: 40 },
    family: {
      members: [
        {
          id: "m0",
          given: "Aldous",
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
  };
  const scene = SceneSchema.parse({
    id: "sc:chronicle",
    sense: "sight",
    prose: ["The house keeps its watch as the season turns over the young line."],
  });
  return {
    state: base,
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
    ...over,
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

describe("Chronicle arc (CHRONICLE-FULL-PLAYTHROUGH-SCREENSHOTS)", () => {
  it("captures the run's arc: title → scene → dread omen → hope omen → finale", async () => {
    const shot = async () => {
      await page.screenshot({ element: host.firstElementChild as Element });
    };
    const remount = (Comp: unknown, props: Record<string, unknown>) => {
      if (component) unmount(component);
      // biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component constructor
      component = mount(Comp as any, { target: host, props });
    };

    // 1. TITLE — the masthead the run opens on.
    remount(TitleScreen, {
      hasSave: false,
      onNewGame: () => {},
      onContinue: () => {},
      onSettings: () => {},
    });
    expect(host.textContent).toContain("Begin a Line");
    await shot();

    // 2. AN EARLY SCENE — the paged prose surface, field still unformed.
    remount(PlayScreen, { content, view: foundedView(), busy: false, onchoose: () => {} });
    await shot();

    // 3. A DREAD OMEN — a loss looms.
    remount(PlayScreen, {
      content,
      view: foundedView({
        foreshadow: {
          text: "A shadow lies over the season — fever and hard winters stalk the young line.",
          weight: "marginal" as const,
          tone: "dread" as const,
        },
      }),
      busy: false,
      onchoose: () => {},
    });
    expect(host.querySelector('[data-testid="foreshadow"][data-tone="dread"]')).not.toBeNull();
    await shot();

    // 4. A HOPE OMEN — the rebound after the blow.
    remount(PlayScreen, {
      content,
      view: foundedView({
        foreshadow: {
          text: "The worst of the loss is behind you — the coffers are slowly being rebuilt.",
          weight: "grave" as const,
          tone: "hope" as const,
        },
        canInvestRecovery: true,
      }),
      busy: false,
      onchoose: () => {},
      oninvest: () => {},
    });
    expect(host.querySelector('[data-testid="foreshadow"][data-tone="hope"]')).not.toBeNull();
    await shot();

    // 5. THE FINALE — the legacy report closes the chronicle.
    const finaleState = {
      ...initState(content, "seed"),
      family: foundedView().state.family,
      end: { kind: "victory" as const, year: 2200, reason: "Carried the name to the stars." },
    };
    remount(LegacyReport, {
      content,
      state: finaleState,
      end: finaleState.end,
      convergence: {
        id: "stars_allies",
        destination: "stars" as const,
        title: "The Covenant Among the Stars",
        prose: "The line ended as keeper of a covenant between worlds.",
        gate: {},
      },
      onRestart: () => {},
    });
    expect(host.querySelector("main.report")).not.toBeNull();
    await shot();
  });
});
