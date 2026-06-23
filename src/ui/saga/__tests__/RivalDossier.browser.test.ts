import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import RivalDossier from "../RivalDossier.svelte";

/**
 * RIVAL-DOSSIER-TAB — the fuller "The Field" panel: every rival's humanized place + rung + a state badge
 * (faltering window / surging pressure / holding), the player's own line slotted in by rung.
 */

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("RivalDossier (RIVAL-DOSSIER-TAB)", () => {
  it("renders each rival with a humanized place + a state badge relative to the player", () => {
    const standings = [
      {
        id: "rival:east_coast",
        label: "rival:east_coast",
        rung: 4,
        faltering: false,
        trend: "rising" as const,
        fallen: false,
      },
      {
        id: "rival:italian",
        label: "rival:italian",
        rung: 1,
        faltering: true,
        trend: "falling" as const,
        fallen: false,
      },
    ];
    component = mount(RivalDossier, { target: host, props: { standings, playerRung: 2 } });
    const panel = host.querySelector('[data-testid="rival-dossier"]');
    expect(panel).toBeTruthy();
    // Place ids humanized, not raw.
    expect(panel?.textContent).toContain("East Coast");
    expect(panel?.textContent).not.toContain("rival:");
    const rows = [...host.querySelectorAll('[data-testid="rival-dossier"] .row')];
    // Player slotted in by rung: East Coast(4) > You(2) > Italian(1).
    expect(rows.map((r) => r.getAttribute("data-state"))).toEqual(["surging", "you", "faltering"]);
    // The rung-4 rival reads SURGING (above the player), the rung-1 one FALTERING.
    const surging = rows.find((r) => r.getAttribute("data-state") === "surging");
    const faltering = rows.find((r) => r.getAttribute("data-state") === "faltering");
    expect(surging?.textContent).toContain("Surging");
    expect(faltering?.textContent).toContain("Faltering");
    // RIVAL-RUNG-TREND: each rival shows a momentum arrow (the player row has none).
    expect(surging?.querySelector(".trend")?.getAttribute("data-trend")).toBe("rising");
    expect(faltering?.querySelector(".trend")?.getAttribute("data-trend")).toBe("falling");
    expect(
      rows.find((r) => r.getAttribute("data-state") === "you")?.querySelector(".trend"),
    ).toBeNull();
  });

  it("a non-faltering rival at or below the player's rung reads as holding", () => {
    const standings = [
      {
        id: "rival:bavaria",
        label: "rival:bavaria",
        rung: 1,
        faltering: false,
        trend: "steady" as const,
        fallen: false,
      },
    ];
    component = mount(RivalDossier, { target: host, props: { standings, playerRung: 3 } });
    const bav = [...host.querySelectorAll(".row")].find((r) => r.textContent?.includes("Bavaria"));
    expect(bav?.getAttribute("data-state")).toBe("steady");
    expect(bav?.textContent).toContain("Holding");
  });

  it("DEAD-LINE-IN-FIELD: a fallen rival reads 'Fallen' — out of the race — over faltering/low", () => {
    const standings = [
      // Fallen takes precedence even though rung 0 would also read low/faltering.
      {
        id: "rival:italian",
        label: "rival:italian",
        rung: 0,
        faltering: true,
        trend: "falling" as const,
        fallen: true,
      },
    ];
    component = mount(RivalDossier, { target: host, props: { standings, playerRung: 2 } });
    const row = host.querySelector('[data-testid="rival-dossier"] .row[data-state="fallen"]');
    expect(row, "the fallen rival reads as fallen").not.toBeNull();
    expect(row?.textContent).toContain("Fallen");
  });

  it("CONVERGENCE-FIELD-SUMMARY-LINE: the header summarizes the race (lead / ahead / fallen)", () => {
    // Player ahead of all: "You lead the field."
    const leadStandings = [
      {
        id: "rival:a",
        label: "rival:a",
        rung: 1,
        faltering: false,
        trend: "steady" as const,
        fallen: false,
      },
    ];
    component = mount(RivalDossier, {
      target: host,
      props: { standings: leadStandings, playerRung: 3 },
    });
    expect(host.querySelector('[data-testid="field-summary"]')?.textContent).toContain(
      "You lead the field",
    );
    unmount(component);
    // Two ahead + one fallen: "2 lines lead you. 1 line has fallen out."
    const mixed = [
      {
        id: "rival:b",
        label: "rival:b",
        rung: 4,
        faltering: false,
        trend: "rising" as const,
        fallen: false,
      },
      {
        id: "rival:c",
        label: "rival:c",
        rung: 3,
        faltering: false,
        trend: "steady" as const,
        fallen: false,
      },
      {
        id: "rival:d",
        label: "rival:d",
        rung: 0,
        faltering: false,
        trend: "falling" as const,
        fallen: true,
      },
    ];
    component = mount(RivalDossier, { target: host, props: { standings: mixed, playerRung: 2 } });
    const sum = host.querySelector('[data-testid="field-summary"]')?.textContent ?? "";
    expect(sum).toMatch(/2 lines lead you/);
    expect(sum).toMatch(/1 line has fallen out/);
  });

  it("DOSSIER-EMPTY-VOICE: with no rivals yet (early game), shows a grace note, not a blank panel", () => {
    component = mount(RivalDossier, { target: host, props: { standings: [], playerRung: 0 } });
    // No per-line dossier renders, but the early-game grace note does (mirrors SHOCK-LEDGER-EMPTY-VOICE).
    expect(host.querySelector('[data-testid="rival-dossier"]')).toBeNull();
    const empty = host.querySelector('[data-testid="rival-dossier-empty"]');
    expect(empty, "the early-game grace note renders").not.toBeNull();
    expect(empty?.textContent).toMatch(/still finding their feet/i);
    // It keeps the field title so the panel still reads as "The Field", just unpopulated.
    expect(empty?.textContent).toContain("The Field");
  });
});
