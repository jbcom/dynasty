import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import type { GameView } from "../../../engine/loop";
import { validRaw } from "../../../sim/__tests__/fixtures";
import { buildContent } from "../../../sim/content";
import { initMeters } from "../../../sim/meters";
import { SceneSchema } from "../../../sim/saga/schema";
import { initState } from "../../../sim/state";
import { applyBrandTokens, makeHost } from "../../__tests__/visualHarness";
import PlayScreen from "../PlayScreen.svelte";

const content = buildContent(validRaw());

function view(): GameView {
  const state = {
    ...initState(content, "seed"),
    meters: { ...initMeters(content.meters), money: 5_000_000, heat: 40 },
  };
  return {
    state,
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
  host = makeHost(412);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("PlayScreen (composed game screen)", () => {
  it("renders the slim header, hamburger, tab nav, and event card together (PF-3)", () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    // Slim always-visible header (PF-3): year + macro span context, no big HUD band.
    expect(host.querySelector('[data-testid="saga-head"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="saga-head"]')?.textContent).toContain(
      String(view().state.year),
    );
    // The non-essential HUD is behind the hamburger — meters are NOT in the always-visible surface.
    expect(host.querySelector('[data-testid="hud-hamburger"]')).not.toBeNull();
    expect(host.querySelectorAll("[data-meter]").length).toBe(0);
    // Tab nav present.
    expect(host.textContent).toContain("Now");
    expect(host.textContent).toContain("Timeline");
    expect(host.textContent).toContain("Dossier");
    // Tabs render REAL 2D line-icon assets, not Unicode glyphs (de-ui-c).
    const tabIcons = [...host.querySelectorAll("nav.tabs img.tab-icon")] as HTMLImageElement[];
    expect(tabIcons.length).toBeGreaterThanOrEqual(5);
    expect(tabIcons.every((i) => i.getAttribute("src")?.startsWith("/assets/icons/ui/"))).toBe(
      true,
    );
    // Event card on the Now tab (portraits removed — they distracted, reclaimed the space).
    expect(host.querySelector("[data-event]")).not.toBeNull();
    expect(host.querySelector("[data-portrait]")).toBeNull();
  });

  it("RECOVERY-CHOICE: offers invest buttons when canInvestRecovery, firing oninvest with the meter", () => {
    const calls: Array<"money" | "heat"> = [];
    // The invest prompt lives in the saga event-pane, so a scene must be present (it's a saga mechanic).
    const scene = SceneSchema.parse({
      id: "sc:demo:blow",
      sense: "sight",
      prose: [
        "The house has taken a hard loss this season, and the question is what you spend to mend it.",
      ],
    });
    const v: GameView = {
      ...view(),
      saga: { actTitle: "Act II", scene, threads: [], ended: false },
      canInvestRecovery: true,
    };
    component = mount(PlayScreen, {
      target: host,
      props: {
        content,
        view: v,
        busy: false,
        onchoose: () => {},
        oninvest: (m: "money" | "heat") => calls.push(m),
      },
    });
    const block = host.querySelector('[data-testid="recovery-invest"]');
    expect(block, "the invest prompt renders when canInvestRecovery").not.toBeNull();
    const btns = [
      ...host.querySelectorAll<HTMLButtonElement>('[data-testid="recovery-invest"] .invest-btn'),
    ];
    expect(btns.length).toBe(2); // spend funds (money) + call in favours (heat)
    btns[0]?.click();
    btns[1]?.click();
    expect(calls).toEqual(["money", "heat"]);
  });

  it("RECOVERY-CHOICE: no invest prompt when canInvestRecovery is false", () => {
    const scene = SceneSchema.parse({
      id: "sc:demo:calm",
      sense: "sight",
      prose: ["A quiet season; the ledgers balance and the house holds steady."],
    });
    const v: GameView = {
      ...view(),
      saga: { actTitle: "Act II", scene, threads: [], ended: false },
      canInvestRecovery: false,
    };
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: v, busy: false, onchoose: () => {}, oninvest: () => {} },
    });
    expect(host.querySelector('[data-testid="recovery-invest"]')).toBeNull();
  });

  it("the hamburger opens the slide-out menu with the meters + motivators inside (PF-3)", async () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    // Closed: the menu + meters are not present.
    expect(host.querySelector('[data-testid="hud-menu"]')).toBeNull();
    (host.querySelector('[data-testid="hud-hamburger"]') as HTMLButtonElement).click();
    flushSync();
    // Open: the slide-out holds the non-essential HUD (the 6 meters now live here).
    expect(host.querySelector('[data-testid="hud-menu"]')).not.toBeNull();
    expect(host.querySelectorAll('[data-testid="hud-menu"] [data-meter]').length).toBe(6);
    // The scrim closes it again (direct dispatch — the fixed overlay stack confuses pointer hit-testing).
    (host.querySelector('[data-testid="hud-scrim"]') as HTMLButtonElement).click();
    flushSync();
    expect(host.querySelector('[data-testid="hud-menu"]')).toBeNull();
  });

  it("switches tabs to show the dossier", async () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    const buttons = [...host.querySelectorAll("nav.tabs button")] as HTMLButtonElement[];
    const dossierBtn = buttons.find((b) => b.textContent?.includes("Dossier"));
    if (!dossierBtn) throw new Error("no dossier tab");
    await page.elementLocator(dossierBtn).click();
    expect(host.textContent).toContain("Dossier —");
  });

  it("captures a screenshot of the full play screen", async () => {
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {} },
    });
    await page.screenshot({ element: host.firstElementChild as Element });
  });

  it("wide (tablet/foldable) renders the event + info side-by-side", async () => {
    host.style.width = "1024px";
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: view(), busy: false, onchoose: () => {}, wide: true },
    });
    // The split layout puts the event column next to an info column.
    expect(host.querySelector(".split")).not.toBeNull();
    expect(host.querySelector(".event-col [data-event]")).not.toBeNull();
    expect(host.querySelector(".info-col")).not.toBeNull();
    await page.screenshot({ element: host.firstElementChild as Element });
  });

  it("WEAVES a cross-family crossing INTO the scene prose (no detached aside) — WV-1", () => {
    const scene = SceneSchema.parse({
      id: "sc:demo:midpoint",
      sense: "sound",
      prose: [
        "The crowd at the dock is a din of a hundred tongues, and one of them is about to matter to your line.",
        "A family from another wave moves through the press, and for a moment the two paths touch.",
      ],
    });
    const braidScene = SceneSchema.parse({
      id: "sc:rival:open",
      sense: "sight",
      prose: [
        "Across the same grey harbour another line steps ashore, its own hungers written on its faces.",
        "You will not learn their name for years, but the century is already binding you together.",
      ],
    });
    const v: GameView = {
      ...view(),
      saga: {
        actTitle: "Act III — The Climb",
        scene,
        threads: [
          { wave: "italian", crossing: "An Italian line cuts across yours.", scene: braidScene },
        ],
        ended: false,
      },
    };
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: v, busy: false, onchoose: () => {} },
    });
    // The novel page renders (not the event card).
    expect(host.querySelector("[data-testid='scene-reader']")).not.toBeNull();
    expect(host.textContent).toContain("Act III — The Climb");
    // WV-1: there is NO detached "Where paths cross" aside — the crossing is woven into the prose flow.
    expect(host.querySelector("[data-testid='thread']")).toBeNull();
    // Page through the scene's own prose (2 paras) to reach the woven crossing page (await each re-render).
    const tap = host.querySelector("[data-testid='scene-reader'] .tap-layer") as HTMLButtonElement;
    flushSync(() => tap.click()); // → para 2
    flushSync(() => tap.click()); // → woven crossing lead page
    const para = host.querySelector("[data-testid='para']");
    expect(para?.getAttribute("data-woven")).toBe(""); // it's a woven narration page, inline
    expect(para?.textContent).toContain("An Italian line cuts across yours."); // the crossing, in-flow
  });

  it("WV-3-SHOCK-SCENES: a shock surfaces a one-line aftermath above the scene", () => {
    const scene = SceneSchema.parse({
      id: "spine:g4:open",
      sense: "sound",
      prose: ["The mill floor roars on, indifferent to the family's private grief."],
    });
    const v: GameView = {
      ...view(),
      saga: { actTitle: "Act V", scene, threads: [], ended: false },
      shock: {
        kind: "family_death",
        text: "A death in the family — the plague took one of your own this season.",
        note: "plague",
      },
    };
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: v, busy: false, onchoose: () => {} },
    });
    const aftermath = host.querySelector(".shock-aftermath");
    expect(aftermath, "the shock aftermath line renders").not.toBeNull();
    expect(aftermath?.textContent).toContain("A death in the family");
    expect(aftermath?.getAttribute("data-shock")).toBe("family_death");
    // No shock → no aftermath line.
    unmount(component);
    component = mount(PlayScreen, {
      target: host,
      props: {
        content,
        view: { ...v, shock: null },
        busy: false,
        onchoose: () => {},
      },
    });
    expect(host.querySelector(".shock-aftermath")).toBeNull();
  });

  it("WV-3-SHOCK-RECOVERY: a recovery note is tagged data-shock=recovery (styled positive, not loss-red)", () => {
    const scene = SceneSchema.parse({
      id: "spine:g3:open",
      sense: "sight",
      prose: [
        "The rebuilt warehouses stand again along the wharf, ledgers slowly filling back in.",
      ],
    });
    const v: GameView = {
      ...view(),
      saga: { actTitle: "Act IV", scene, threads: [], ended: false },
      shock: {
        kind: "recovery",
        text: "Brick by brick the house was rebuilt — the fortune clawed back from the ash.",
        note: "rebuilt",
      },
    };
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: v, busy: false, onchoose: () => {} },
    });
    const aftermath = host.querySelector(".shock-aftermath");
    expect(aftermath?.getAttribute("data-shock")).toBe("recovery");
    expect(aftermath?.textContent).toContain("rebuilt");
  });
});
