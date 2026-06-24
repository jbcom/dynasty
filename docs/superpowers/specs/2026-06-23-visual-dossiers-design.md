---
title: Visual Dossier System (SHOW-DON'T-TELL)
updated: 2026-06-23
status: current
domain: product
---

# Visual Dossier System — show, don't tell

**Governing user directive (2026-06-23).** "Right now we have a LOT of tell and very little show.
Exploring ideas like intelligence dossiers / research dossiers / marketing r&d based on the context of the
dynasty path, as distinct visual pieces with text but also charts graphs maps and other visual anchors and
set pieces would be AMAZING layered onto the existing directives." Memory: [[show-dont-tell-visual-dossiers]].

The game's story is carried by SceneReader prose — which reads flat / wall-of-text. This milestone adds
distinct VISUAL SET PIECES — **dossiers keyed to the dynasty's archetype PATH** — that mix real data viz,
GenAI path-voice analysis, and generated atmospheric art, so the experience SHOWS, not just tells.

## User decisions (this brainstorm)

1. **Placement:** ALL of them — the HEADLINE is **full-screen interstitial scene-transition set pieces** at
   generation/era boundaries; plus decision-aid panels and richer path-keyed tabs.
2. **Content:** HYBRID — real sim-state data viz **+** GenAI-authored path-voice prose **+** GenAI-generated
   atmospheric imagery (maps/diagrams/blueprints), all layered in one dossier.
3. **Process:** MILESTONE-deliverable, not slices — build the WHOLE system on ONE long-running local branch,
   comprehensive LOCAL review (full gate + reviewer trio per commit, folded forward), ONE remote PR when the
   milestone is solid. [[one-branch-local-review]].

## Existing surfaces to extend (not duplicate)

The codebase already has data-viz primitives + tabs: `StatsView` (a meters chart), `ButterflyGraph` (a real
SVG cause-effect node-graph), `MapView` (the journey map), `MarketsView`/`Dossier` (CSS meter/rung bars),
`RivalField`/`RivalDossier` (the rival roster), `TimelineView`, `PersonalityDial`, `MeterGauge`. These are
siloed in tabs the player must seek; the dossier system reuses these primitives but composes them into
designed, path-keyed set pieces that surface IN the flow.

The hand-drawn-SVG-FIGURE ban ([[visual-layer-revival]]) does NOT apply to data viz — charts/graphs/maps in
Svelte+CSS/SVG are fine; the ban is about hand-drawn PEOPLE. Generated atmospheric figures (maps/blueprints
as raster art) use the existing Imagen on-demand+cache pipeline (the portrait pattern, with the EI-9d fallback).

## Architecture

### 1. The Dossier content model (`src/sim/dossier/` — pure)

```ts
type DossierKind =
  | "intelligence"   // crime → surveillance/territory
  | "rnd"            // technological → R&D brief
  | "portfolio"      // economic → market/holdings dashboard
  | "marketing"      // entertainment → marketing deck
  | "warroom"        // political → campaign/war-room
  | "doctrine"       // religious → doctrine/flock study
  | "scouting";      // athletic → scouting/performance report

interface Dossier {
  kind: DossierKind;
  archetype: PortraitArchetype;   // the run's path (reuse the EI-8 union incl. crime)
  eraBand: EraBand;               // reuse EI-8a — period framing
  title: string;                  // path + era specific
  panels: DossierPanel[];
}

type DossierPanel =
  | { type: "chart";  data: ChartSpec }     // real sim-state series (meters/money/rung over the timeline)
  | { type: "graph";  data: GraphSpec }     // node/network — rival field, butterfly, tech tree
  | { type: "map";    data: MapSpec }       // territory/journey/reach
  | { type: "figure"; key: string }         // GenAI atmospheric artifact (Imagen, on-demand+cache key)
  | { type: "brief";  text: string };       // GenAI path-voice analytical prose
```

`buildDossier(kind, view): Dossier` is a PURE selector over the live `GameView`/`GameState` read-model — it
maps the run's real state into chart/graph/map specs and the figure/brief KEYS (the text/art are resolved
asynchronously by the runner, like scenes/portraits). `dossierKindForArchetype(archetype)` picks the kind.
Pure + deterministic; no DOM, no Date, no Math.random.

### 2. Rendering (`src/ui/dossier/`)

- `DossierView.svelte` — lays the panels out as a designed briefing/magazine spread (Suzerain scannability:
  measured columns, lifted set pieces, real data anchors — [[suzerain-ui-reference]], [[scannability-evidence-rules]]).
- One small component per panel type: `ChartPanel`, `GraphPanel`, `MapPanel`, `FigurePanel`, `BriefPanel` —
  reusing StatsView's chart / ButterflyGraph / MapView primitives where they fit. `FigurePanel` uses the
  Imagen-cached image with the EI-9d onerror→prose-only fallback.
- Path styling: each `DossierKind` carries a visual register (an intel dossier reads classified/redacted; an
  R&D brief reads schematic/blueprint; a marketing deck reads glossy) via CSS tokens, NOT separate layouts.

### 3. Placement

- **DossierInterstitial (headline):** a full-screen dossier fires at each generation/era boundary — a
  "showing" beat (intel briefing / R&D review / market report on where the line stands) between acts, then
  the next act begins. A new step in the act/opening flow (a sibling of the SceneReader page), dismissible.
- **Decision-aid:** a major decision may attach a compact single-panel dossier beside the glowing options
  (the brief/chart that makes the stakes concrete at the moment of choosing).
- **Tab:** the existing Stats/Markets/Dossier tabs upgrade into the richer path-keyed DossierView.

### 4. GenAI content (briefs + figures)

- **Briefs:** a `buildDossierBrief(kind, view)` prompt in the PATH VOICE (mob-boss intel assessment,
  visionary R&D memo, magnate market outlook, …) via the existing Gemini text client; QA'd like scenes;
  cached by a deterministic key (seed × kind × eraBand × a state digest). Pairs with the scarcity-stories
  guidance for far-future dossiers.
- **Figures:** `dossierFigureKey(kind, eraBand, archetype)` → the Imagen on-demand+cache pipeline (the
  portrait pattern): a surveillance map, a blueprint, key-art — period × path. Generate-on-demand, cached,
  EI-9d fallback. NEVER a hand-drawn SVG figure.
- Sim purity holds: the sim references only KEYS + pure specs; text/art resolve in the runner/UI layer.

## Build order (the VD milestone — ONE local branch, ONE PR)

- **VD-1** (this spec).
- **VD-2** the pure Dossier content model + read-model selectors (`buildDossier`, `dossierKindForArchetype`,
  ChartSpec/GraphSpec/MapSpec from real state) + unit tests.
- **VD-3** the panel components + `DossierView` (reusing existing viz primitives) + browser/visual tests +
  READ a screenshot.
- **VD-4** the `DossierInterstitial` placement (fires at a generation/era boundary) wired into the flow +
  e2e walks it.
- **VD-5** the GenAI brief pipeline (path-voice prompts + QA + cache) and the `dossierFigureKey` figure
  pipeline (Imagen on-demand+cache, EI-9d fallback) + tests.
- **VD-6** wire ONE full path end-to-end for the run's actual archetype (real data + brief + figure) +
  live-verify in Chrome (screenshot + READ the composed dossier).
- **VD-7** the remaining placements (decision-aid panel, the upgraded tabs) + the other paths' dossier kinds.

Each step is a forward commit on the long-running branch; full local gate + reviewer trio per commit, folded
forward; the remote PR opens ONCE when the whole milestone is solid (NOT per step).

## Layered onto, not replacing

This sits ALONGSIDE the shipped portrait matrix (EI-8…EI-10) + scarcity-stories — a dossier figure reuses the
portrait Imagen pipeline; a far-future dossier's brief reuses the scarcity guidance. The progenitor portrait,
the emergence, and the scenes all stay; dossiers ADD the visual-anchored "show" layer.
