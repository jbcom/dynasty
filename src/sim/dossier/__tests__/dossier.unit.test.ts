import { describe, expect, it } from "vitest";
import {
  buildDossier,
  type DossierInput,
  dossierBriefKey,
  dossierFigureKey,
  dossierKindForArchetype,
} from "../dossier";

/**
 * VD-2 — the pure DOSSIER content model: path → kind, and a selector mapping live run state into the
 * chart/graph/map specs + figure/brief keys. Pure + deterministic (same input → same dossier + keys).
 */

const input = (over: Partial<DossierInput> = {}): DossierInput => ({
  archetype: "economic",
  year: 1880,
  seed: "run1",
  series: { years: [1850, 1865, 1880], byMeter: { reputation: [10, 30, 55], heat: [0, 5, 20] } },
  rivals: [
    { id: "r1", label: "italian", rung: 3, fallen: false },
    { id: "r2", label: "bavaria", rung: 1, fallen: true },
  ],
  rung: 2,
  ...over,
});

describe("VD-2 dossierKindForArchetype (path → dossier kind)", () => {
  it("maps every archetype path to its dossier kind (the user's named set)", () => {
    expect(dossierKindForArchetype("crime")).toBe("intelligence");
    expect(dossierKindForArchetype("technological")).toBe("rnd");
    expect(dossierKindForArchetype("economic")).toBe("portfolio");
    expect(dossierKindForArchetype("entertainment")).toBe("marketing");
    expect(dossierKindForArchetype("political")).toBe("warroom");
    expect(dossierKindForArchetype("religious")).toBe("doctrine");
    expect(dossierKindForArchetype("athletic")).toBe("scouting");
  });
});

describe("VD-2 buildDossier (live state → visual briefing)", () => {
  it("keys the dossier to the path + the year's era band", () => {
    const d = buildDossier(input({ archetype: "crime", year: 1880 }));
    expect(d.kind).toBe("intelligence");
    expect(d.archetype).toBe("crime");
    expect(d.eraBand).toBe("industrial_late1800s"); // 1880
    expect(d.title).toMatch(/Intelligence/);
  });

  it("emits a fixed coherent panel set: figure + brief + chart + graph + map", () => {
    const d = buildDossier(input());
    const types = d.panels.map((p) => p.type);
    expect(new Set(types)).toEqual(new Set(["figure", "brief", "chart", "graph", "map"]));
  });

  it("the CHART binds to the real meter series (one line per meter, aligned to years)", () => {
    const d = buildDossier(input());
    const chart = d.panels.find((p) => p.type === "chart");
    if (chart?.type !== "chart") throw new Error("no chart panel");
    expect(chart.data.years).toEqual([1850, 1865, 1880]);
    const rep = chart.data.lines.find((l) => l.label === "Reputation");
    expect(rep?.values).toEqual([10, 30, 55]);
  });

  it("the GRAPH seats the player + the rival field (fallen lines marked)", () => {
    const d = buildDossier(input());
    const graph = d.panels.find((p) => p.type === "graph");
    if (graph?.type !== "graph") throw new Error("no graph panel");
    expect(graph.data.nodes[0]).toMatchObject({ id: "you", you: true, weight: 2 });
    expect(graph.data.nodes.find((n) => n.id === "r2")).toMatchObject({ fallen: true });
  });

  it("the MAP lights every era band up to the current one (the line's reach)", () => {
    const d = buildDossier(input({ year: 1880 }));
    const map = d.panels.find((p) => p.type === "map");
    if (map?.type !== "map") throw new Error("no map panel");
    expect(map.data.current).toBe("industrial_late1800s");
    expect(map.data.reached).toEqual(["founding_1700s", "federal_1800s", "industrial_late1800s"]);
  });

  it("is DETERMINISTIC — the figure/brief keys are stable per (kind, era, archetype/seed)", () => {
    expect(dossierFigureKey("rnd", "stellar", "technological")).toBe(
      "dossier:fig:rnd:stellar:technological",
    );
    // The brief is keyed kind×era (run-independent — generated offline, cached as an asset).
    expect(dossierBriefKey("intelligence", "midcentury")).toBe(
      "dossier:brief:intelligence:midcentury",
    );
    // Same input → byte-identical dossier (pure).
    expect(buildDossier(input())).toEqual(buildDossier(input()));
  });
});
