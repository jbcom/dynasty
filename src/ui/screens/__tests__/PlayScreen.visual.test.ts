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

  it("FORESHADOW-IN-TONE: a grave omen reads in a heavier register than a marginal one", () => {
    const scene = SceneSchema.parse({
      id: "sc:demo:omen",
      sense: "sight",
      prose: ["The air over the house has changed; something is coming."],
    });
    const mountWith = (weight: "marginal" | "grave") => {
      const v: GameView = {
        ...view(),
        saga: { actTitle: "Act II", scene, threads: [], ended: false },
        foreshadow: { text: "An omen looms.", weight, tone: "dread" as const },
      };
      if (component) unmount(component);
      component = mount(PlayScreen, {
        target: host,
        props: { content, view: v, busy: false, onchoose: () => {} },
      });
      return host.querySelector('[data-testid="foreshadow"]') as HTMLElement;
    };
    const marginal = mountWith("marginal");
    expect(marginal.getAttribute("data-weight")).toBe("marginal");
    const marginalBorder = getComputedStyle(marginal).borderLeftColor;
    const grave = mountWith("grave");
    expect(grave.getAttribute("data-weight")).toBe("grave");
    // The grave omen's border reads in a different (heavier) register than the marginal one.
    expect(getComputedStyle(grave).borderLeftColor).not.toBe(marginalBorder);
  });

  it("RECOVERY-FORESHADOW-TONE: a hopeful rebound omen reads in a WARM register, apart from the grave dread omen", () => {
    const scene = SceneSchema.parse({
      id: "sc:demo:rebound",
      sense: "sight",
      prose: ["The worst of the blow has passed; the house steadies itself."],
    });
    const mountTone = (tone: "dread" | "hope") => {
      const v: GameView = {
        ...view(),
        saga: { actTitle: "Act II", scene, threads: [], ended: false },
        // Both at GRAVE weight — so the only difference under test is the TONE (valence), not the gravity.
        foreshadow: { text: "An omen.", weight: "grave" as const, tone },
      };
      if (component) unmount(component);
      component = mount(PlayScreen, {
        target: host,
        props: { content, view: v, busy: false, onchoose: () => {} },
      });
      return host.querySelector('[data-testid="foreshadow"]') as HTMLElement;
    };
    const dread = mountTone("dread");
    expect(dread.getAttribute("data-tone")).toBe("dread");
    const dreadBorder = getComputedStyle(dread).borderLeftColor;
    const hope = mountTone("hope");
    expect(hope.getAttribute("data-tone")).toBe("hope");
    // Same weight, different tone → the hope omen reads in a different (warm) register than the dread one.
    expect(getComputedStyle(hope).borderLeftColor).not.toBe(dreadBorder);
  });

  it("OMEN-TONE-A11Y: the tone is conveyed by a TEXT badge, not color alone (WCAG 1.4.1)", () => {
    const scene = SceneSchema.parse({
      id: "sc:demo:a11y",
      sense: "sight",
      prose: ["The season turns; what it brings depends on where the line stands."],
    });
    const badgeFor = (tone: "dread" | "hope") => {
      const v: GameView = {
        ...view(),
        saga: { actTitle: "Act II", scene, threads: [], ended: false },
        foreshadow: { text: "An omen.", weight: "grave" as const, tone },
      };
      if (component) unmount(component);
      component = mount(PlayScreen, {
        target: host,
        props: { content, view: v, busy: false, onchoose: () => {} },
      });
      return host.querySelector('[data-testid="foreshadow"] .omen-badge') as HTMLElement;
    };
    const hopeBadge = badgeFor("hope");
    expect(hopeBadge, "the hope omen carries a text badge").not.toBeNull();
    expect(hopeBadge.textContent).toMatch(/recovering/i);
    const dreadBadge = badgeFor("dread");
    expect(dreadBadge.textContent).toMatch(/warning/i);
    // The two tones are distinguishable by TEXT — a colorblind player doesn't need the hue.
    expect(hopeBadge.textContent?.trim()).not.toBe(dreadBadge.textContent?.trim());
  });

  it("MAP-FIELD-LINK-WIRING-CHECK: PlayScreen passes the full standings (with fallen) through to MapView", async () => {
    // A founded line (state.family present → the Map tab shows) + a fallen rival in the standings. Switching to
    // the Map tab must render the rival marker carrying data-fallen — proving the live wiring (PlayScreen →
    // MapView prop) carries the state end-to-end, not just that MapView CAN render it.
    const base = view();
    const v: GameView = {
      ...base,
      state: {
        ...base.state,
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
      rivalStandings: [
        {
          id: "rival:chinese",
          label: "rival:chinese",
          rung: 0,
          faltering: false,
          trend: "falling" as const,
          fallen: true,
        },
      ],
    };
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: v, busy: false, onchoose: () => {} },
    });
    // Switch to the Map tab (shown because the line is founded).
    await page.getByRole("button", { name: /Map/ }).click();
    flushSync();
    const marker = host.querySelector('circle.rival[data-rival="rival:chinese"]');
    expect(marker, "the rival marker renders on the map").not.toBeNull();
    // The fallen state flowed PlayScreen → MapView → the marker, not lost in the wiring.
    expect(marker?.getAttribute("data-fallen")).toBe("true");
  });

  it("DOSSIER-EMPTY-VOICE-IN-PLAYSCREEN: the empty-field grace note surfaces in the live Field tab", async () => {
    // A founded line (Field tab shows) but EMPTY standings (early game, no rivals surfaced yet). Opening the
    // Field tab must show the dossier's empty-voice grace note end-to-end, not a blank panel — proving the tab
    // gate (hasLineage, not standings>0) keeps the surface reachable.
    const base = view();
    const v: GameView = {
      ...base,
      state: {
        ...base.state,
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
      rivalStandings: [], // no rivals surfaced yet
    };
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: v, busy: false, onchoose: () => {} },
    });
    // The Field tab is present despite empty standings (gated on the founded line).
    await page.getByRole("button", { name: /Field/ }).click();
    flushSync();
    const empty = host.querySelector('[data-testid="rival-dossier-empty"]');
    expect(empty, "the empty-field grace note surfaces in the live Field tab").not.toBeNull();
    expect(empty?.textContent).toMatch(/still finding their feet/i);
  });

  it("OMEN-BADGE-SCREENSHOT: captures the hope + dread omen badges for visual review", async () => {
    const scene = SceneSchema.parse({
      id: "sc:demo:badgeshot",
      sense: "sight",
      prose: ["The season's turn hangs in the balance — read the omen and brace, or hope."],
    });
    for (const tone of ["hope", "dread"] as const) {
      const v: GameView = {
        ...view(),
        saga: { actTitle: "Act II", scene, threads: [], ended: false },
        foreshadow: {
          text:
            tone === "hope"
              ? "The worst of the blow is behind you — the line gathers itself for a turn upward."
              : "A shadow lies over the season — fever and hard winters stalk the young line.",
          weight: "grave" as const,
          tone,
        },
      };
      if (component) unmount(component);
      component = mount(PlayScreen, {
        target: host,
        props: { content, view: v, busy: false, onchoose: () => {} },
      });
      // The badge renders with its icon + label; capture for the author to read (legibility, no prose-crowding).
      expect(
        host.querySelector('[data-testid="foreshadow"] .omen-badge')?.textContent?.trim(),
      ).toMatch(tone === "hope" ? /recovering/i : /warning/i);
      await page.screenshot({ element: host.firstElementChild as Element });
    }
  });

  it("INVEST-WHILE-HOPE-OMEN: the hope omen renders ABOVE the invest prompt as one coherent beat", () => {
    const scene = SceneSchema.parse({
      id: "sc:demo:rebound-invest",
      sense: "sight",
      prose: ["The house steadies after the blow; a hand might yet tip the scales."],
    });
    const v: GameView = {
      ...view(),
      saga: { actTitle: "Act II", scene, threads: [], ended: false },
      // Both fire on the SAME outstanding strain: a hope omen + an available recovery invest.
      foreshadow: {
        text: "The worst is behind you.",
        weight: "grave" as const,
        tone: "hope" as const,
      },
      canInvestRecovery: true,
    };
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: v, busy: false, onchoose: () => {}, oninvest: () => {} },
    });
    const omen = host.querySelector('[data-testid="foreshadow"]') as HTMLElement;
    const invest = host.querySelector('[data-testid="recovery-invest"]') as HTMLElement;
    expect(omen, "the hope omen renders").not.toBeNull();
    expect(invest, "the invest prompt renders").not.toBeNull();
    // DOM order: the omen comes BEFORE the invest prompt (one "a rebound is near — press for it" beat).
    expect(omen.compareDocumentPosition(invest) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The invest prompt is marked as following a hope omen + its copy connects to the rebound.
    expect(invest.getAttribute("data-after-hope")).toBe("true");
    expect(invest.textContent).toMatch(/press the rebound/i);
  });

  it("RECOVERY-CHOICE: the 'Spend funds' button is disabled when the player can't afford it", () => {
    const scene = SceneSchema.parse({
      id: "sc:demo:broke",
      sense: "sight",
      prose: ["The coffers are all but empty, yet the house still reels from its loss."],
    });
    const v: GameView = {
      ...view(),
      state: { ...view().state, meters: { ...view().state.meters, money: 5 } },
      saga: { actTitle: "Act II", scene, threads: [], ended: false },
      canInvestRecovery: true,
    };
    component = mount(PlayScreen, {
      target: host,
      props: { content, view: v, busy: false, onchoose: () => {}, oninvest: () => {} },
    });
    const btns = [
      ...host.querySelectorAll<HTMLButtonElement>('[data-testid="recovery-invest"] .invest-btn'),
    ];
    // "Spend funds" (money) is disabled (can't afford 18); "Call in favours" (heat) stays enabled.
    const money = btns.find((b) => b.textContent?.includes("Spend funds"));
    const heat = btns.find((b) => b.textContent?.includes("Call in favours"));
    expect(money?.disabled).toBe(true);
    expect(heat?.disabled).toBeFalsy();
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
