import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi, vitest } from "vitest";
import { page } from "vitest/browser";
import { validRaw } from "../../../sim/__tests__/fixtures";
import { buildContent } from "../../../sim/content";
import { applyChoice } from "../../../sim/effects";
import { createRng } from "../../../sim/rng";
import { initState } from "../../../sim/state";
import LegacyReport from "../LegacyReport.svelte";
import TitleScreen from "../TitleScreen.svelte";

const content = buildContent(validRaw());

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  host = document.createElement("div");
  host.style.width = "412px";
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

function fullProps(over: Record<string, unknown> = {}) {
  return {
    hasSave: false,
    onNewGame: () => {},
    onContinue: () => {},
    onSettings: () => {},
    ...over,
  };
}

describe("TitleScreen (PL-3 diegetic entry — no upfront inputs)", () => {
  it("shows New Game + Settings, hides Continue without a save", () => {
    component = mount(TitleScreen, { target: host, props: fullProps() });
    expect(host.textContent).toContain("Begin a Line");
    expect(host.textContent).not.toContain("Continue");
    expect(host.textContent).toContain("Settings");
  });

  it("shows Continue when a save exists", () => {
    component = mount(TitleScreen, { target: host, props: fullProps({ hasSave: true }) });
    expect(host.textContent).toContain("Continue");
  });

  it("has NO upfront surname or seed inputs — onboarding authors both diegetically", () => {
    component = mount(TitleScreen, { target: host, props: fullProps() });
    expect(host.querySelector("#surname")).toBeNull();
    expect(host.querySelector("#seed")).toBeNull();
    expect(host.querySelectorAll("input").length).toBe(0);
  });

  it("New Game fires onNewGame (which routes to the onboarding flow)", async () => {
    const onNewGame = vi.fn();
    component = mount(TitleScreen, { target: host, props: fullProps({ onNewGame }) });
    await page.getByRole("button", { name: /Begin a Line/ }).click();
    await vitest.waitFor(() => expect(onNewGame).toHaveBeenCalledTimes(1));
  });
});

describe("LegacyReport", () => {
  it("renders the end headline, stats, and a restart button", () => {
    const state = {
      ...initState(content, "seed"),
      end: { kind: "victory" as const, year: 2080, reason: "Immortal patriarch." },
    };
    component = mount(LegacyReport, {
      target: host,
      props: { content, state, end: state.end, onRestart: () => {} },
    });
    expect(host.textContent).toContain("Total Victory");
    expect(host.textContent).toContain("Immortal patriarch.");
    expect(host.textContent).toContain("Play Again");
  });

  it("shows the butterfly chain that led to the end", () => {
    let s = initState(content, "seed");
    const born = content.allEvents.find((e) => e.id === "ev_born");
    const school = content.allEvents.find((e) => e.id === "ev_military_school");
    if (!born || !school) throw new Error("fixtures missing");
    s = applyChoice(content, s, born, "cry_loud", createRng("seed")).state;
    s = applyChoice(content, s, school, "excel", createRng("seed")).state;
    const state = { ...s, end: { kind: "death" as const, year: 1990, reason: "x" } };
    component = mount(LegacyReport, {
      target: host,
      props: { content, state, end: state.end, onRestart: () => {} },
    });
    // The butterfly graph renders nodes for the recorded ledger.
    expect(host.querySelectorAll("circle").length).toBeGreaterThan(0);
  });

  it("celebrates the DYNASTY — house, generations, souls, span (PL-9)", () => {
    // A founded line with a progenitor + one heir (a second generation) so the epitaph
    // counts members, generations, and the founding→end span.
    const base = initState(content, "legacy");
    const mkMember = (
      id: string,
      given: string,
      born: number,
      generation: number,
      isProtagonist: boolean,
    ) => ({
      id,
      given,
      surname: "Vane",
      sex: "male" as const,
      born,
      generation,
      traits: { ambition: 50, cunning: 50, vigor: 50, piety: 50 },
      isProtagonist,
    });
    const state = {
      ...base,
      family: {
        members: [mkMember("m0", "Aldous", 1885, 0, false), mkMember("m1", "Bram", 1910, 1, true)],
        protagonistId: "m1",
        nextSeq: 2,
      },
      end: { kind: "death" as const, year: 1960, reason: "x" },
    };
    component = mount(LegacyReport, {
      target: host,
      props: { content, state, end: state.end, onRestart: () => {} },
    });
    expect(host.textContent).toContain("House of");
    expect(host.textContent).toContain("Vane");
    expect(host.textContent).toMatch(/2 generations/);
    expect(host.textContent).toMatch(/2 souls/);
    expect(host.textContent).toMatch(/75 years/); // 1960 − 1885
    expect(host.querySelector(".dynasty")).not.toBeNull();
  });

  it("CONVERGENCE-ENDING-DEPTH: narrates the convergence's earned-finale prose beneath the title", () => {
    const state = {
      ...initState(content, "seed"),
      end: { kind: "apex" as const, year: 2200, reason: "Carried the name to the stars." },
    };
    const convergence = {
      id: "stars_allies",
      destination: "stars" as const,
      title: "The Covenant Among the Stars",
      prose:
        "The line that began among immigrant strangers ended as the keeper of a covenant between worlds.",
      gate: {},
    };
    component = mount(LegacyReport, {
      target: host,
      props: { content, state, end: state.end, convergence, onRestart: () => {} },
    });
    const prose = host.querySelector("[data-testid='convergence-prose']");
    expect(prose, "the finale prose renders").not.toBeNull();
    expect(prose?.textContent).toContain("keeper of a covenant between worlds");
    // No prose → no prose line.
    unmount(component);
    component = mount(LegacyReport, {
      target: host,
      props: {
        content,
        state,
        end: state.end,
        convergence: { ...convergence, prose: undefined },
        onRestart: () => {},
      },
    });
    expect(host.querySelector("[data-testid='convergence-prose']")).toBeNull();
  });

  it("RIVAL-FATE-IN-CONVERGENCE-ENDING: narrates the field's coda beneath the finale prose", () => {
    const state = {
      ...initState(content, "seed"),
      end: { kind: "apex" as const, year: 2200, reason: "Carried the name to the stars." },
    };
    const convergence = {
      id: "stars_allies",
      destination: "stars" as const,
      title: "The Covenant Among the Stars",
      prose: "The line ended as keeper of a covenant between worlds.",
      rivalEpilogue:
        "Another line reached the stars before yours; you watched their fire cross the sky.",
      gate: {},
    };
    component = mount(LegacyReport, {
      target: host,
      props: { content, state, end: state.end, convergence, onRestart: () => {} },
    });
    const coda = host.querySelector("[data-testid='rival-epilogue']");
    expect(coda, "the field coda renders").not.toBeNull();
    expect(coda?.textContent).toContain("reached the stars before yours");
    // No epilogue → no coda line.
    unmount(component);
    component = mount(LegacyReport, {
      target: host,
      props: {
        content,
        state,
        end: state.end,
        convergence: { ...convergence, rivalEpilogue: undefined },
        onRestart: () => {},
      },
    });
    expect(host.querySelector("[data-testid='rival-epilogue']")).toBeNull();
  });

  it("LEDGER-IN-LEGACY-REPORT: surfaces the line's hard seasons + comebacks at the close", () => {
    const state = {
      ...initState(content, "seed"),
      flags: [
        "shock:family_death:1885",
        "shock:meter_blow:1920",
        "recovered:money:1935",
        "base:press",
      ],
      end: { kind: "death" as const, year: 1990, reason: "x" },
    };
    component = mount(LegacyReport, {
      target: host,
      props: { content, state, end: state.end, onRestart: () => {} },
    });
    const led = host.querySelector("[data-testid='legacy-ledger']");
    expect(led, "the legacy ledger renders when the run had shocks").not.toBeNull();
    expect(led?.textContent).toContain("The Family's Hard Seasons");
    const items = [...host.querySelectorAll("[data-testid='legacy-ledger'] li")];
    expect(items.length).toBe(3);
    // The comeback is gold-accented, distinct from the red disasters.
    // toBeDefined (not .not.toBeNull) — .find returns undefined, which passes vacuously vs null (Gemini #124).
    const recovery = items.find((li) => li.getAttribute("data-shock-kind") === "recovery");
    const death = items.find((li) => li.getAttribute("data-shock-kind") === "family_death");
    expect(recovery, "a comeback line renders").toBeDefined();
    expect(death, "a disaster line renders").toBeDefined();
    expect(getComputedStyle(recovery as HTMLElement).borderLeftColor).not.toBe(
      getComputedStyle(death as HTMLElement).borderLeftColor,
    );
    // A shock-free run shows no ledger section.
    unmount(component);
    component = mount(LegacyReport, {
      target: host,
      props: {
        content,
        state: { ...initState(content, "seed"), end: state.end },
        end: state.end,
        onRestart: () => {},
      },
    });
    expect(host.querySelector("[data-testid='legacy-ledger']")).toBeNull();
  });

  it("CONVERGENCE-RIVAL-FINALE: surfaces the other lines + their fates at the close", () => {
    const state = {
      ...initState(content, "seed"),
      end: { kind: "death" as const, year: 1990, reason: "x" },
    };
    component = mount(LegacyReport, {
      target: host,
      props: {
        content,
        state,
        end: state.end,
        rivalStandings: [
          { id: "rival:bavaria", label: "rival:bavaria", rung: 5, faltering: false },
          { id: "rival:italian", label: "rival:italian", rung: 1, faltering: true },
        ],
        onRestart: () => {},
      },
    });
    const finale = host.querySelector("[data-testid='rival-finale']");
    expect(finale, "the rival reckoning renders when there are rivals").not.toBeNull();
    expect(finale?.textContent).toContain("The Other Lines");
    // The place ids are humanized, not raw.
    expect(finale?.textContent).toContain("Bavaria");
    expect(finale?.textContent).toContain("Italian");
    expect(finale?.textContent).not.toContain("rival:");
    const items = [...host.querySelectorAll("[data-testid='rival-finale'] li")];
    expect(items.length).toBe(2);
    // The high-rung line reads as a star-reacher; the faltering one is marked + reads as broken.
    expect(items[0]?.textContent).toMatch(/stars/i);
    const faltered = items.find((li) => li.getAttribute("data-faltering") === "true");
    expect(faltered, "the faltering line is marked").toBeDefined();
    expect(faltered?.textContent).toMatch(/falter/i);
    // No rivals → no section.
    unmount(component);
    component = mount(LegacyReport, {
      target: host,
      props: { content, state, end: state.end, onRestart: () => {} },
    });
    expect(host.querySelector("[data-testid='rival-finale']")).toBeNull();
  });

  it("FALLEN-NEWS-IN-ENDING: a dropped-out line reads 'dropped out' + struck, set apart from a faltering one", () => {
    const state = {
      ...initState(content, "seed"),
      end: { kind: "death" as const, year: 1990, reason: "x" },
    };
    component = mount(LegacyReport, {
      target: host,
      props: {
        content,
        state,
        end: state.end,
        rivalStandings: [
          // A fallen (dropped-out) line — fallen takes precedence over its faltering/low rung.
          { id: "rival:italian", label: "rival:italian", rung: 0, faltering: true, fallen: true },
          // A merely-faltering line (not dropped out) reads in the faltering register, not dropped-out.
          { id: "rival:bavaria", label: "rival:bavaria", rung: 2, faltering: true, fallen: false },
        ],
        onRestart: () => {},
      },
    });
    const items = [...host.querySelectorAll("[data-testid='rival-finale'] li")];
    const dropped = items.find((li) => li.getAttribute("data-fallen") === "true");
    expect(dropped, "the dropped-out line is marked").toBeDefined();
    expect(dropped?.textContent).toMatch(/dropped out of the race/i);
    // The dropped-out name is struck through (out of contention), distinct from a faltering line.
    expect(
      getComputedStyle(dropped?.querySelector(".rf-name") as HTMLElement).textDecorationLine,
    ).toBe("line-through");
    const falterOnly = items.find(
      (li) =>
        li.getAttribute("data-faltering") === "true" && li.getAttribute("data-fallen") === "false",
    );
    expect(
      falterOnly,
      "a faltering-but-not-dropped line stays in the faltering register",
    ).toBeDefined();
    expect(falterOnly?.textContent).not.toMatch(/dropped out/i);
  });

  it("STELLAR-RIVAL-IN-ENDING: a star-reaching line reads in an ascendant register, the field's high extreme", () => {
    const state = {
      ...initState(content, "seed"),
      end: { kind: "death" as const, year: 1990, reason: "x" },
    };
    // Set the brand tokens this register depends on so the computed colors are real, not unset-black. Distinct
    // values for the star border (gold-bright) vs the default row border (gold-deep) make the comparison meaningful.
    host.style.setProperty("--mmm-gold-bright", "rgb(255, 220, 120)");
    host.style.setProperty("--mmm-gold-deep", "rgb(120, 90, 20)");
    host.style.setProperty("--mmm-gold", "rgb(212, 175, 55)");
    component = mount(LegacyReport, {
      target: host,
      props: {
        content,
        state,
        end: state.end,
        rivalStandings: [
          // A line at the ladder top, not faltering / fallen → reached the stars (the high extreme).
          { id: "rival:bavaria", label: "rival:bavaria", rung: 5, faltering: false, fallen: false },
          // A mid line for contrast (no star register).
          { id: "rival:italian", label: "rival:italian", rung: 2, faltering: false, fallen: false },
        ],
        onRestart: () => {},
      },
    });
    const items = [...host.querySelectorAll("[data-testid='rival-finale'] li")];
    const star = items.find((li) => li.getAttribute("data-stars") === "true");
    const mid = items.find((li) => li.getAttribute("data-stars") === "false");
    expect(star, "the star-reaching line is marked").toBeDefined();
    expect(mid, "the non-star line is not marked").toBeDefined();
    expect(star?.textContent).toMatch(/reached the stars/i);
    expect(mid?.textContent).not.toMatch(/reached the stars/i);
    // The ascendant register reads apart from a non-star line's border (gold-bright vs the default gold-deep).
    expect(getComputedStyle(star as HTMLElement).borderLeftColor).not.toBe(
      getComputedStyle(mid as HTMLElement).borderLeftColor,
    );
  });

  it("AGENCY-IN-LEGACY: tallies the player's WV-3 interventions in a 'By your own hand' line", () => {
    const state = {
      ...initState(content, "seed"),
      presses: [
        { at: 1, rivalId: "rival:italian", year: 1900 },
        { at: 3, rivalId: "rival:bavaria", year: 1925 },
      ],
      recoveryInvests: [{ at: 2, meter: "money" as const, year: 1910 }],
      end: { kind: "death" as const, year: 1990, reason: "x" },
    };
    component = mount(LegacyReport, {
      target: host,
      props: { content, state, end: state.end, onRestart: () => {} },
    });
    const line = host.querySelector("[data-testid='agency']");
    expect(line, "the agency line renders when the player intervened").not.toBeNull();
    expect(line?.textContent).toContain("By your own hand");
    expect(line?.textContent).toMatch(/pressed 2 faltering rivals/);
    expect(line?.textContent).toMatch(/forced 1 recovery/);
    // Two clauses join with a plain " and " — no awkward comma (Gemini #139 grammar).
    expect(line?.textContent).toMatch(/rivals and forced/);
    expect(line?.textContent).not.toMatch(/rivals, and forced/);
    // A passive run (no presses/invests) shows no agency line.
    unmount(component);
    component = mount(LegacyReport, {
      target: host,
      props: {
        content,
        state: { ...initState(content, "seed"), end: state.end },
        end: state.end,
        onRestart: () => {},
      },
    });
    expect(host.querySelector("[data-testid='agency']")).toBeNull();
  });
});
