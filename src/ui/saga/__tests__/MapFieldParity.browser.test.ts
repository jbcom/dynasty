import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validRaw } from "../../../sim/__tests__/fixtures";
import { buildContent } from "../../../sim/content";
import { initState } from "../../../sim/state";
import MapView from "../MapView.svelte";
import RivalDossier from "../RivalDossier.svelte";

/**
 * MAP-FIELD-LINK — the in-run MapView and the Field dossier are two live surfaces onto the SAME rival standings;
 * this proves they AGREE on each line's state. A line that reads "fallen" in the dossier (struck + dim) must read
 * eliminated on the map (its marker barely-there), and a fallen line must never be the map's "leads the
 * convergence" line. Mounting both off the same standings and cross-checking catches a divergence either alone
 * would miss.
 */

const content = buildContent(validRaw());

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let mapC: any;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let dossierC: any;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});
afterEach(() => {
  if (mapC) unmount(mapC);
  if (dossierC) unmount(dossierC);
  host.remove();
});

describe("MapView ↔ RivalDossier parity (MAP-FIELD-LINK)", () => {
  it("a fallen line reads eliminated on BOTH surfaces, and never leads the map", () => {
    const standings = [
      // A surging leader, a faltering line, and a FALLEN line at rung 0.
      {
        id: "rival:bavaria",
        label: "rival:bavaria",
        rung: 4,
        faltering: false,
        trend: "rising" as const,
        fallen: false,
      },
      {
        id: "rival:italian",
        label: "rival:italian",
        rung: 2,
        faltering: true,
        trend: "falling" as const,
        fallen: false,
      },
      {
        id: "rival:chinese",
        label: "rival:chinese",
        rung: 0,
        faltering: false,
        trend: "falling" as const,
        fallen: true,
      },
    ];
    const mapHost = document.createElement("div");
    const dossierHost = document.createElement("div");
    host.append(mapHost, dossierHost);

    mapC = mount(MapView, {
      target: mapHost,
      props: { gameState: initState(content, "seed"), rivalStandings: standings, playerRung: 1 },
    });
    dossierC = mount(RivalDossier, {
      target: dossierHost,
      props: { standings, playerRung: 1 },
    });

    // DOSSIER: the chinese line reads "fallen".
    const dossierChinese = [...dossierHost.querySelectorAll(".row")].find((r) =>
      r.textContent?.includes("Chinese"),
    );
    expect(dossierChinese?.getAttribute("data-state")).toBe("fallen");

    // MAP: the same line's marker is flagged fallen (eliminated), and the faltering one flagged faltering.
    const mapChinese = mapHost.querySelector('circle.rival[data-rival="rival:chinese"]');
    const mapItalian = mapHost.querySelector('circle.rival[data-rival="rival:italian"]');
    expect(mapChinese?.getAttribute("data-fallen")).toBe("true");
    expect(mapItalian?.getAttribute("data-faltering")).toBe("true");

    // The map's "leads the convergence" line is the surging leader, NEVER the fallen one.
    const rivalNote = mapHost.querySelector(".rival-note")?.textContent ?? "";
    if (rivalNote) {
      expect(rivalNote).toMatch(/Bavaria/i);
      expect(rivalNote).not.toMatch(/Chinese/i);
    }
  });

  it("a field of ALL-fallen lines yields no map leader (no one leads a dead field)", () => {
    const standings = [
      {
        id: "rival:a",
        label: "rival:a",
        rung: 0,
        faltering: false,
        trend: "falling" as const,
        fallen: true,
      },
      {
        id: "rival:b",
        label: "rival:b",
        rung: 0,
        faltering: false,
        trend: "falling" as const,
        fallen: true,
      },
    ];
    mapC = mount(MapView, {
      target: host,
      props: { gameState: initState(content, "seed"), rivalStandings: standings, playerRung: 0 },
    });
    // No live line → no "leads the convergence" note (a fallen line can't lead).
    expect(host.querySelector(".rival-note")).toBeNull();
  });
});
