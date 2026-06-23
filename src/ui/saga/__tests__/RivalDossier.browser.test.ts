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
      { id: "rival:east_coast", label: "rival:east_coast", rung: 4, faltering: false },
      { id: "rival:italian", label: "rival:italian", rung: 1, faltering: true },
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
  });

  it("a non-faltering rival at or below the player's rung reads as holding", () => {
    const standings = [{ id: "rival:bavaria", label: "rival:bavaria", rung: 1, faltering: false }];
    component = mount(RivalDossier, { target: host, props: { standings, playerRung: 3 } });
    const bav = [...host.querySelectorAll(".row")].find((r) => r.textContent?.includes("Bavaria"));
    expect(bav?.getAttribute("data-state")).toBe("steady");
    expect(bav?.textContent).toContain("Holding");
  });

  it("renders nothing when there are no rivals", () => {
    component = mount(RivalDossier, { target: host, props: { standings: [], playerRung: 0 } });
    expect(host.querySelector('[data-testid="rival-dossier"]')).toBeNull();
  });
});
