/**
 * VD-2 — the DOSSIER content model (SHOW-DON'T-TELL visual dossiers). A pure selector that maps the run's
 * LIVE state into a path-keyed visual briefing — real data-viz panels (charts/graphs/maps from sim state)
 * plus the KEYS for the GenAI path-voice brief + atmospheric figure (resolved async by the runner/UI, like
 * scenes + portraits). Spec: docs/superpowers/specs/2026-06-23-visual-dossiers-design.md.
 *
 * Pure + deterministic: no DOM, no Date, no Math.random. The same (kind, view) → the same dossier, and the
 * brief/figure KEYS are stable so their cached text/art replay. The sim never renders or fetches — it only
 * describes; the UI layer draws the specs and resolves the keys (sim purity holds).
 */

import type { EraBand } from "../genai/portrait";
import { eraBandForYear } from "../genai/portrait";
import type { PortraitArchetype } from "../genai/portraitFacets";

/** The dossier flavor, keyed to the dynasty's archetype PATH (the "context of the dynasty path"). */
export type DossierKind =
  | "intelligence" // crime → surveillance / territory
  | "rnd" // technological → R&D brief
  | "portfolio" // economic → market / holdings dashboard
  | "marketing" // entertainment → marketing deck
  | "warroom" // political → campaign / war-room
  | "doctrine" // religious → doctrine / flock study
  | "scouting"; // athletic → scouting / performance report

/** The path → dossier-kind mapping. Total over the sim Archetype union (+ crime, the planned 7th path). */
const KIND_BY_ARCHETYPE: Record<PortraitArchetype, DossierKind> = {
  economic: "portfolio",
  political: "warroom",
  technological: "rnd",
  religious: "doctrine",
  entertainment: "marketing",
  athletic: "scouting",
  crime: "intelligence",
};

/** The dossier kind for a path. Pure. */
export function dossierKindForArchetype(archetype: PortraitArchetype): DossierKind {
  return KIND_BY_ARCHETYPE[archetype];
}

/** A human title per kind (the briefing's masthead) — path voice, era-framed by buildDossier. */
const KIND_TITLE: Record<DossierKind, string> = {
  intelligence: "Intelligence Dossier",
  rnd: "Research & Development Brief",
  portfolio: "Holdings & Market Dossier",
  marketing: "Marketing & Reach Deck",
  warroom: "Campaign War-Room",
  doctrine: "Doctrine & Flock Study",
  scouting: "Scouting & Performance Report",
};

/** A real data-viz series (a line per metric over the run's years) — bound to sim state, drawn by ChartPanel. */
export interface ChartSpec {
  title: string;
  years: number[];
  /** One named line of values aligned with `years`. */
  lines: Array<{ label: string; values: number[] }>;
}

/** A node/network spec (the rival field, etc.) — drawn by GraphPanel. */
export interface GraphSpec {
  title: string;
  nodes: Array<{ id: string; label: string; weight: number; you?: boolean; fallen?: boolean }>;
}

/** A territory/journey/reach spec — drawn by MapPanel (extends MapView). */
export interface MapSpec {
  title: string;
  /** Waypoints lit so far (era band ids the line has reached), for the journey/reach read. */
  reached: EraBand[];
  current: EraBand;
}

/** One panel of a dossier — a typed visual block. */
export type DossierPanel =
  | { type: "chart"; data: ChartSpec }
  | { type: "graph"; data: GraphSpec }
  | { type: "map"; data: MapSpec }
  | { type: "figure"; key: string } // GenAI atmospheric artifact (Imagen on-demand+cache)
  | { type: "brief"; key: string }; // GenAI path-voice analytical prose (resolved by the runner)

/** A composed dossier: a path-keyed visual briefing over the run's live state. */
export interface Dossier {
  kind: DossierKind;
  archetype: PortraitArchetype;
  eraBand: EraBand;
  title: string;
  panels: DossierPanel[];
}

/** The minimal live-state read-model the dossier selector consumes (a subset of GameView, to stay decoupled). */
export interface DossierInput {
  /** The run's path — the sim Archetype plus crime (the intelligence-dossier path), so all 7 kinds are reachable. */
  archetype: PortraitArchetype;
  year: number;
  seed: string;
  /** Per-meter time series (reuse buildMeterSeries): years + one value line per meter. */
  series: { years: number[]; byMeter: Record<string, number[]> };
  /** The rival field — each line's standing, for the network graph. */
  rivals: Array<{ id: string; label: string; rung: number; fallen: boolean }>;
  /** The player's own rung (0..5) — to seat the player node in the graph. */
  rung: number;
}

/** The deterministic key for a dossier's GenAI FIGURE (atmospheric art) — Imagen on-demand+cache. */
export function dossierFigureKey(
  kind: DossierKind,
  eraBand: EraBand,
  archetype: PortraitArchetype,
): string {
  return `dossier:fig:${kind}:${eraBand}:${archetype}`;
}

/**
 * The deterministic key for a dossier's GenAI BRIEF (path-voice prose). Keyed on kind × era (NOT the per-run
 * seed) because the brief — like the scene corpus + portraits — is GENERATED OFFLINE and cached as an asset
 * (no API at sim runtime, sim purity); it reads as a period-and-path assessment, and the run's exact numbers
 * are carried by the live chart/graph/map panels beside it. So one brief serves every run on that kind×era.
 */
export function dossierBriefKey(kind: DossierKind, eraBand: EraBand): string {
  return `dossier:brief:${kind}:${eraBand}`;
}

/** Title-case a meter id for a chart legend ("reputation" → "Reputation"). */
function legendLabel(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * Build the path-keyed dossier from the run's live state (VD-2). Pure: maps real meters/rivals into chart +
 * graph + map specs, and emits the figure/brief KEYS (text/art resolved later). The panel SET is fixed per
 * dossier (a chart of the run's trajectory, the rival network, the journey map, an atmospheric figure, and the
 * path-voice brief) so the layout reads as one coherent briefing.
 */
export function buildDossier(input: DossierInput): Dossier {
  const archetype = input.archetype;
  const kind = dossierKindForArchetype(archetype);
  const eraBand = eraBandForYear(input.year);

  // CHART: the run's meter trajectory over its years (real series; reuse buildMeterSeries upstream).
  const meterIds = Object.keys(input.series.byMeter);
  const chart: ChartSpec = {
    title: "Trajectory",
    years: input.series.years,
    lines: meterIds.map((id) => ({
      label: legendLabel(id),
      values: input.series.byMeter[id] ?? [],
    })),
  };

  // GRAPH: the rival field as a network — the player at center, rivals weighted by rung, fallen lines marked.
  const graph: GraphSpec = {
    title: "The Field",
    nodes: [
      { id: "you", label: "Your line", weight: input.rung, you: true },
      ...input.rivals.map((r) => ({ id: r.id, label: r.label, weight: r.rung, fallen: r.fallen })),
    ],
  };

  // MAP: the journey so far — every era band up to the current one is reached (the line's reach over centuries).
  const order: EraBand[] = [
    "founding_1700s",
    "federal_1800s",
    "industrial_late1800s",
    "early_1900s",
    "midcentury",
    "digital_modern",
    "near_future",
    "stellar",
  ];
  const reachedIdx = order.indexOf(eraBand);
  const map: MapSpec = {
    title: "Reach",
    reached: order.slice(0, reachedIdx + 1),
    current: eraBand,
  };

  return {
    kind,
    archetype,
    eraBand,
    title: KIND_TITLE[kind],
    panels: [
      { type: "figure", key: dossierFigureKey(kind, eraBand, archetype) },
      { type: "brief", key: dossierBriefKey(kind, eraBand) },
      { type: "chart", data: chart },
      { type: "graph", data: graph },
      { type: "map", data: map },
    ],
  };
}
