---
title: RB-8 — Caricature Portrait + Scene Compositing
updated: 2026-06-22
status: current
domain: creative
---

# RB-8 — Caricature portrait + scene compositing (`src/render`)

The render layer that gives the paged-novel a FACE and a PLACE. Today `src/render/` is empty;
`SceneReader.svelte` renders prose over a `data-sense` edge-wash and nothing else. RB-8 adds a
deterministic, layered caricature compositor above the prose: a portrait of the line's dominant
character and an atmospheric scene wash, both derived from the run's identity + the scene's sense.

Caricature only — never photographic ([[dynasty-ui-conventions]]). Every asset license-logged in
`src/data/assets.json` (the existing `{id,path,kind,source,license,attribution}` schema). Pure
presentation: the compositor reads the `SagaView` + `Scene`, never the sim.

## Use-case enumeration (step 1 — who/when triggers a render)

The compositor is asked to draw a frame at these lifecycle moments. Each is a distinct trigger, so
the answer is a **hybrid**: one shared `composeScene()` core, fed by different identity inputs.

1. **Scene paint** (every `scene.id` change in SceneReader) — the dominant character's portrait +
   the sense/era atmospheric wash behind the prose. The high-frequency path; must be cheap + cached.
2. **Generation turn** (succession → next-gen act begins) — the portrait swaps to the new heir
   (archetype constant, the FACE changes: age/era step). A composed cross-fade, not a hard cut.
3. **Era crossing** (macro-act advances) — the scene wash shifts palette (rooted origins →
   interstellar), echoing the audio's `chordForEra`. Visual + audio era cues stay in lockstep.
4. **Convergence glimpse** (a rival surfaces in the strip) — a SMALL rival vignette (silhouette, not
   a full portrait) so the "other lines" read as people, not rows. Lower fidelity than the player.
5. **Ending** (apex / line-extinct) — a terminal composed frame keyed on `dominant.pole` + outcome
   (stars / contributed / earthbound / extinguished). One-shot, highest fidelity.

> Triggers 1–3 share the player portrait+wash core. Trigger 4 is a reduced variant (silhouette,
> no wash). Trigger 5 is the same core with an outcome overlay. NOT five renderers — one
> `composeScene(input)` whose `input` differs per trigger.

## Identity → asset mapping (what keys an asset)

Available, all already in the read model / schema:

| Input | Source | Drives |
|-------|--------|--------|
| `archetype` (6) | Act | portrait base (face/silhouette family) |
| `class` (poor/middle…) rung | Act / `SagaView.rung` | portrait dress/props tier |
| `wave` / `macroAct` era | Act / `SagaView.macroAct` | era styling + scene-wash palette |
| `sense` (5) | Scene | atmospheric wash accent (reuses SceneReader's `--sense-accent`) |
| `dominant.pole` | `SagaView.dominant` | portrait expression/mood + ending coloring |

The portrait is composed from **layers**, not one monolithic image per (archetype×class×era×sense)
combination (that's a 6×N×10×5 explosion — unshippable). Layers: `base(archetype)` +
`tier(class)` overlay + `era(macroAct)` palette remap + `mood(pole)` expression. Each layer is a
small caricature 2D asset; the compositor stacks them. This is the only tractable asset budget.

## Architecture options considered

- **A — one image per full combination.** Rejected: thousands of assets, no GenAI/artist budget,
  impossible to keep license-logged or consistent.
- **B — layered caricature compositor (CHOSEN).** A handful of caricature layers per axis, stacked
  + palette-remapped at runtime. Bounded asset count (~6 bases + ~N tiers + 10 era palettes + 5
  mood overlays), every layer license-logged. Deterministic: same identity+sense → identical frame.
- **C — pure CSS/SVG procedural caricature (no raster assets).** Tempting (zero asset pipeline) but
  fails the "real 2D caricature art, never Unicode/primitive" bar of [[dynasty-ui-conventions]].
  Use SVG for the *wash/frame* (procedural is fine for atmosphere) but real layered art for faces.

**Decision: B for portraits, with C's procedural SVG for the scene wash/frame.** Faces are art;
atmosphere is procedural. This matches the existing `--sense-accent` gradient already in SceneReader
(extend it into a full compositor-driven wash) and keeps the face-asset count shippable.

## Module shape (`src/render/`)

- `composeScene.ts` — PURE: `(input: SceneRenderInput) => SceneFrame`. No DOM. Resolves which
  layers/palette a frame needs; returns a descriptor (asset ids + transforms + wash stops). Unit-
  testable in node; deterministic (no Date/random).
- `palettes.ts` — era → palette ramp (the visual twin of `chordForEra`); sense → accent (reuse the
  SceneReader sense map, single-sourced here so both agree).
- `SceneStage.svelte` — presentation: takes a `SceneFrame`, stacks the layer `<img>`s + the SVG
  wash, cross-fades on frame change (respects `prefers-reduced-motion`). Mounted BEHIND the prose
  in SceneReader (z-index below `.scene-body`).
- `assets/` manifest entries in `src/data/assets.json` — `kind: "portrait-layer" | "wash"`, each
  license-logged. Placeholder-free: ship the real caricature layers, not stubs.

## Testing

- `composeScene.unit.test.ts` — determinism (same input → identical frame), layer selection per
  archetype/class/era/sense, the reduced rival-vignette variant, the ending overlay variant.
- `SceneStage.visual.test.ts` (Vitest browser) — renders each archetype×era a frame, asserts layer
  count + wash presence + cross-fade on frame change; screenshot the output and READ it against the
  caricature reference before commit (the visual-ownership rule).
- Wire into the existing PlayScreen e2e walk: assert `[data-testid="scene-stage"]` present + the
  portrait swaps on a generation turn.

## Asset pipeline (prerequisite)

Layers are real caricature 2D art. Source via the asset tooling (aseprite for hand-caricature
layers; the assets-library MCP for any reusable bases), each ingested + license-logged in
`assets.json`. No layer ships without an attribution entry — the manifest is the gate.

## Build order (this is discovery, not a fixed plan)

1. `palettes.ts` + the procedural SVG wash in `SceneStage` (no raster yet) — proves the
   era/sense atmosphere end-to-end against the existing sense map.
2. `composeScene.ts` pure core + its determinism unit tests (layer descriptors, no art yet).
3. The portrait layer art (archetype bases first — the 6 — then class tiers, then era palettes,
   then mood overlays), license-logged as each lands.
4. `SceneStage.svelte` stacking + cross-fade; mount behind SceneReader prose.
5. Generation-turn + era-crossing + ending + rival-vignette variants, each visual-tested.

Only build what the current step surfaces; let the work reveal the next layer.
