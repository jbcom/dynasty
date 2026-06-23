import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { applyChoice } from "../../sim/effects";
import { createRng } from "../../sim/rng";
import { initState } from "../../sim/state";
import Dossier from "../Dossier.svelte";
import StatsView from "../StatsView.svelte";
import TimelineView from "../TimelineView.svelte";

const content = buildContent(validRaw());

function playedState() {
  const born = content.allEvents.find((e) => e.id === "ev_born");
  if (!born) throw new Error("no born");
  let s = initState(content, "seed");
  s = applyChoice(content, s, born, "cry_loud", createRng("seed")).state;
  return s;
}

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  host = document.createElement("div");
  host.style.width = "360px"; // uPlot needs a measurable width
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("Dossier", () => {
  it("shows all meters and current flags", () => {
    component = mount(Dossier, {
      target: host,
      props: { defs: content.meters, gameState: playedState() },
    });
    expect(host.textContent).toContain("Dossier");
    expect(host.textContent).toContain("Money");
    // The cry_loud flag (loud_baby) renders HUMANIZED, not as the raw flag id (PL-10).
    expect(host.textContent).toContain("Loud baby");
    expect(host.textContent).not.toContain("loud_baby");
  });
});

describe("TimelineView", () => {
  it("reveals only reached eras (no future spoilers) with the current one highlighted", () => {
    component = mount(TimelineView, { target: host, props: { content, gameState: playedState() } });
    // Still in era 0 (boyhood) → it shows; the future era must NOT be revealed.
    expect(host.textContent).toContain("Birth & Boyhood");
    expect(host.textContent).not.toContain("Apprentice Mogul");
    expect(host.querySelector(".era.current")).not.toBeNull();
    // A teaser stands in for the unwritten road ahead.
    expect(host.querySelector(".era.unwritten")).not.toBeNull();
    // UQ-UI: the era year-range is DATA — rendered with tabular figures (type-role split).
    const years = host.querySelector<HTMLElement>(".era-years");
    expect(years).not.toBeNull();
    expect(getComputedStyle(years as HTMLElement).fontVariantNumeric).toContain("tabular-nums");
  });

  it("reveals a later era once it has been reached", () => {
    const s = { ...playedState(), eraIndex: 1 };
    component = mount(TimelineView, { target: host, props: { content, gameState: s } });
    expect(host.textContent).toContain("Apprentice Mogul");
  });

  it("starts the timeline at the line's FOUNDING era — no pre-founding eras (PL-7)", () => {
    // A line founded in a later era ("mogul") must not show the earlier "boyhood" era it
    // never lived (the real-world bug: a 1885 line showing the 762 Caliphate era).
    const s = {
      ...playedState(),
      eraIndex: 1,
      founding: { momentId: "m", surname: "Vane", culture: "c", place: "p", era: "mogul" },
    };
    component = mount(TimelineView, { target: host, props: { content, gameState: s } });
    expect(host.textContent).toContain("Apprentice Mogul");
    expect(host.textContent).not.toContain("Birth & Boyhood");
  });

  it("DOSSIER-SHOCK-LEDGER: renders the line's disasters from shock:* flags, chronologically", () => {
    const s = {
      ...playedState(),
      flags: [
        ...playedState().flags,
        "shock:meter_blow:1955",
        "shock:family_death:1948",
        "base:press",
      ],
    };
    component = mount(TimelineView, { target: host, props: { content, gameState: s } });
    const ledger = host.querySelector("[data-testid='shock-ledger']");
    expect(ledger, "the shock ledger renders when shocks exist").not.toBeNull();
    expect(ledger?.textContent).toContain("What Befell the Family");
    const items = [...host.querySelectorAll("[data-testid='shock-ledger'] li")];
    expect(items.length).toBe(2);
    // Chronological: 1948 (death) before 1955 (reversal).
    expect(items[0]?.textContent).toContain("1948");
    expect(items[0]?.getAttribute("data-shock-kind")).toBe("family_death");
    expect(items[1]?.textContent).toContain("1955");
    // No shocks → no ledger.
    unmount(component);
    component = mount(TimelineView, { target: host, props: { content, gameState: playedState() } });
    expect(host.querySelector("[data-testid='shock-ledger']")).toBeNull();
  });

  it("SHOCK-LEDGER-RECOVERIES: a recovery renders as a GOLD comeback line, distinct from red disasters", () => {
    const s = {
      ...playedState(),
      flags: [
        ...playedState().flags,
        "shock:meter_blow:1920",
        "recovered:money:1935",
        "base:press",
      ],
    };
    component = mount(TimelineView, { target: host, props: { content, gameState: s } });
    const items = [...host.querySelectorAll("[data-testid='shock-ledger'] li")];
    expect(items.length).toBe(2);
    // The comeback entry carries kind=recovery, names the fortune, and is gold-accented (not the red disaster).
    // .find returns undefined (not null) when absent, and .not.toBeNull() passes vacuously on undefined —
    // use toBeDefined() so a missing element fails HERE, not later inside getComputedStyle (Gemini #124).
    const recovery = items.find((li) => li.getAttribute("data-shock-kind") === "recovery");
    expect(recovery, "a recovery line renders").toBeDefined();
    expect(recovery?.textContent).toMatch(/fortune/i);
    const blow = items.find((li) => li.getAttribute("data-shock-kind") === "meter_blow");
    expect(blow, "a blow line renders").toBeDefined();
    expect(getComputedStyle(recovery as HTMLElement).borderLeftColor).not.toBe(
      getComputedStyle(blow as HTMLElement).borderLeftColor,
    );
  });

  it("CONVERGENCE-FIELD-IN-TIMELINE: renders the rival field with the player's line slotted in by rung", () => {
    component = mount(TimelineView, {
      target: host,
      props: {
        content,
        gameState: playedState(),
        playerRung: 2,
        rivalStandings: [
          { id: "rival:bavaria", label: "rival:bavaria", rung: 4, faltering: false },
          { id: "rival:italian", label: "rival:italian", rung: 1, faltering: true },
        ],
      },
    });
    const fieldEl = host.querySelector("[data-testid='convergence-field']");
    expect(fieldEl, "the field strip renders when there are rivals").not.toBeNull();
    expect(fieldEl?.textContent).toContain("The Field");
    const rows = [...host.querySelectorAll("[data-testid='convergence-field'] li")];
    // The player + both rivals, sorted high→low by rung: Bavaria(4), Your line(2), Italian(1).
    expect(rows.length).toBe(3);
    expect(rows[0]?.textContent).toContain("Bavaria");
    expect(rows[1]?.getAttribute("data-player")).toBe("true");
    expect(rows[2]?.textContent).toContain("Italian");
    expect(rows[2]?.getAttribute("data-faltering")).toBe("true");
    // No rivals → no field strip.
    unmount(component);
    component = mount(TimelineView, { target: host, props: { content, gameState: playedState() } });
    expect(host.querySelector("[data-testid='convergence-field']")).toBeNull();
  });
});

describe("StatsView", () => {
  it("mounts a uPlot chart canvas", async () => {
    component = mount(StatsView, { target: host, props: { content, gameState: playedState() } });
    // uPlot renders a <canvas> inside the chart container.
    await new Promise((r) => setTimeout(r, 50));
    expect(host.querySelector("canvas")).not.toBeNull();
  });

  it("labels the legend with meter DISPLAY names, not machine ids (PL-12)", async () => {
    component = mount(StatsView, { target: host, props: { content, gameState: playedState() } });
    await new Promise((r) => setTimeout(r, 50));
    const labels = [...host.querySelectorAll(".u-legend .u-label")].map((l) =>
      l.textContent?.trim(),
    );
    // The fixture's first linear meter is "power" → must render Title-Case "Power".
    const powerDef = content.meters.find((m) => m.id === "power");
    expect(powerDef).toBeDefined();
    expect(labels).toContain(powerDef?.label);
    expect(labels).not.toContain("power"); // not the lowercase machine id
  });
});
