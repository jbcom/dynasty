---
title: Visual Layer — Map, Portraits, Signature Style (GenAI-generated)
updated: 2026-06-22
status: draft
domain: creative
---

# Visual Layer Design — Map + Portraits + a Signature Look

## Mandate & constraints (user, 2026-06-22)

The game feels DENSE / text-only "hurts things" / no map = no visual sense of progress. Reverse the
old no-art rule ([[visual-layer-revival]]) and add a visual layer:
- **A persistent MAP** that conveys migration + era PROGRESS across the 1800s→stars saga.
- **PORTRAITS** — a unique portrait per person (people × era × archetype × gender).
- **Art direction: NOT cartoony** — a polished, cohesive SIGNATURE look/feel, the game's own identity.

Hard constraints:
- **NO hand-drawn SVG art** (it sank the first portrait attempt). 
- **GENERATE imagery + video via the EXISTING GenAI pipeline.** Verified: the `@google/genai` SDK
  (already a dep, used by `src/sim/genai/client.ts`) exposes `generateImages`, `editImage`,
  `upscaleImage`, `recontextImage`, and `generateVideos`. We extend that pipeline — we don't add a new one.
- **Sim purity holds**: generation is an OFFLINE, CACHED build step (like `genai:expand`/`genai:qa`),
  keyed by cell so a seed reproduces the same art reference. No image gen at sim runtime; no
  `Math.random`/`Date.now` in `src/sim`. Assets load as static raster/video at play time.
- Mobile-first (Pixel 5a class). pnpm/Biome/Conventional-Commits. License-log every asset in
  `src/data/assets.json` (existing shape: `{id, path, kind, source, license, attribution}`).

Process: full autonomy, sign-off PRE-GRANTED ([[vl-autonomy-and-branch-split]]) — build immediately.
All work on this branch (`feat/visual-layer`).

## Reference synthesis (the deep study)

From the narrative-game reference study (80 Days, Suzerain, Pentiment, Citizen Sleeper, Roadwarden,
Crusader Kings, Reigns, Disco Elysium) + [[suzerain-ui-reference]]. The load-bearing findings:

- **Map as a toggled FULL-BLEED mode, not co-displayed with prose** (80 Days). The map is the
  *breather* between text scenes; the mode switch resets attention. On a phone, giving map and prose
  each the full screen is what keeps a text-heavy game legible. (Also dodges Suzerain's pan-vs-dismiss
  gesture-collision bug — a separate mode means no fighting the tap-to-page layer.)
- **The map shows PROGRESS on its own surface** — fog-of-war peeling back (Roadwarden) + a migration
  line drawn place→place across eras + "paint your color" spread (CK). This is THE feature that turns
  "wall of text" into "a journey with momentum."
- **Translucent, bordered reading card over a DIMMED map — never a solid panel** (Suzerain's own
  documented failure). Our SceneReader already floats prose; this formalizes the backdrop.
- **Progress as a filling radial CLOCK, not a bar** (Citizen Sleeper) — era/generation/epoch dread.
- **Typography as period voice** (Pentiment) — shift the type era as the saga advances over a constant
  layout. We already self-host Playfair/Garamond; cheap, zero runtime cost, signals 1800s→future.
- **Portraits: painterly bust, ONE speaker at a time, swapped on speaker change** (Disco + Suzerain).
  Painterly-at-~120px reads as *historical memory* and degrades gracefully on mobile where line/photoreal
  would not — perfect for looking back across centuries.
- **Recurring archetype CAST, not per-beat art** (Reigns) — this is what makes portraits AFFORDABLE.
- **DNA-vector inherited resemblance + CSS life-stage aging** (CK) — makes the BLOODLINE visible.
- **Signature style = a CONSTRAINT, not a quantity of art**: one medium, one ~5-color master palette
  (era variation in accent only), one shared grain/texture overlay, a single named "house illustrator"
  persona in every prompt, a reproducible line spec, retro-futurism (not chrome) for the future eras.

## Art direction — the signature spec (locked, reused verbatim in every gen prompt)

To make GenAI output cohere into ONE identity across portraits + map (the study's #1 lesson), define a
machine-reproducible style spec injected into every image prompt:

- **Medium:** period **engraving / aquatint ink-line with a muted wash** — a printed-plate look. Chosen
  because (a) it spans 1800s→future without breaking (engraving reads as "historical record / ledger of
  a life," our exact frame), (b) it's the most GenAI-STABLE across eras (line + limited wash drifts less
  than painterly), (c) it suits the dynastic-saga "book of your life" tone.
- **Master palette (~5, named):** ink-black, aged-parchment, dynasty-gold (`--mmm-gold`), oxblood-red
  (`--mmm-red`), deep-navy (`--mmm-navy`) — the existing brand tokens. Per-era variation = ACCENT shift
  only (a teal creeps in at the modern tiers, a cold steel-blue at the stellar tiers), palette otherwise
  constant. This is the mechanism that lets one look span centuries.
- **Texture:** a single crosshatch/paper-grain overlay applied to EVERY asset (portrait + map) so they
  read as one printed surface. (Can be a CSS/`feTurbulence` filter over raster, or baked into the gen
  prompt — prefer baked for cohesion, CSS overlay as the unifying backstop.)
- **House-illustrator persona:** every prompt opens with a fixed fictional engraver persona + the medium
  + palette + grain spec, THEN the per-subject detail. This forces a signature instead of a per-asset
  style lottery.
- **Future eras = retro-futurism** (80 Days "the future, as imagined in 1872"), not chrome sci-fi — the
  engraving medium + a retro-futurist framing + the accent shift carry the period; the art style never
  breaks.

The style spec lives as data: `src/data/saga/artStyle.json` (the persona + medium + palette + grain +
per-era accent + negative prompts), imported by the generation pass so it's one source of truth.

## The generation pass (extend the GenAI pipeline)

New module `src/sim/genai/image.ts` (pure prompt builders, mirroring `scene.ts`/`qa.ts`) + runner
`scripts/genai-art.ts` (mirroring `genai-expand.ts`/`genai-qa.ts`):

- **Portrait prompts** — keyed by CELL identity (`wave × archetype × class × tier × gender`). The recurring
  CAST economy (Reigns): we generate a portrait per *cell+gender+tier-band*, NOT per scene — ~7 waves × 6
  archetypes × 2 classes × 2 genders × ~3 era-bands ≈ a bounded set (hundreds, cached), reused across the
  504 acts. The prompt = artStyle spec + the wave's period/dress/trade (from `guidance.json`) + gender +
  era-band + archetype bearing. Deterministic key → filename → license-log.
- **Map** — a generated period world-map base image (the signature engraving style), ONE backdrop, plus
  per-era accent-tint variants (or a single base recolored in CSS). Place nodes + migration routes are an
  SVG OVERLAY positioned over the raster map (data-driven from `places.ts` lat/long-ish anchors) — the
  overlay is NOT hand-drawn ART (it's data viz: dots, a polyline, fog mask), which honors the no-SVG-ART
  ban (the ban is on illustrated figures/cartography, not data-overlay primitives).
- **Video (optional, later)** — `generateVideos` for transition/ambient moments (e.g. the migration
  crossing, the succession handoff). Deferred to a VL-late step; portraits + map first.
- **Caching + determinism:** generated assets written to `public/assets/generated/<key>.<ext>`,
  license-logged in `assets.json`, keyed deterministically. The runner is idempotent (skip existing
  keys). Commit-before-run; the asset set is reviewable as a diff.

## Composition into the UI (mobile-first)

- **MAP MODE** (new): a full-bleed screen toggled from the HUD — the engraving world-map with the
  migration line lit up to the current place/era, fog over the unreached, a radial era-clock. The
  "breather" between acts. Tap a node → its era/recap. (80 Days mode-toggle + Roadwarden fog + CK paint.)
- **SCENE (play) screen:** the SceneReader prose card (already measured-column from UQ-UI-4) now floats
  over a DIMMED era-map backdrop (Suzerain translucent-card-over-dimmed-map). ONE speaker portrait at the
  card's edge, swapped on speaker change; the active line's portrait persists. (No solid panel — the
  documented Suzerain failure.)
- **Lineage view:** member cards gain the DNA-vector portrait + CSS life-stage aging → visible bloodline
  resemblance down the generations.
- **Type era-shift:** the existing `--mmm-font-*` tokens gain per-era-band values; layout constant.
- All additive over the shipped UQ-UI scannability work; the type-role split + meter bars stay.

## Build order (VL-2+, decomposed into the directive queue)

1. **VL-2 artStyle.json + the gen-prompt builders** (`src/sim/genai/image.ts`, pure + unit-tested).
2. **VL-3 the generation runner** (`scripts/genai-art.ts`): portraits first; commit-before-run; cache +
   license-log; generate a first wave (e.g. ireland) to validate the signature style end-to-end, read the
   output, iterate the style spec until it's polished + cohesive.
3. **VL-4 portrait composition** into SceneReader (one speaker at a time) + Lineage (bloodline) — mobile
   layout, visual tests, Chrome verify.
4. **VL-5 the MAP**: generate the base map; SVG node/route/fog overlay from places data; MAP MODE screen +
   the dimmed-map scene backdrop; radial era-clock; Chrome verify the journey-progress reads.
5. **VL-6 type era-shift** + per-era accent.
6. **VL-7 (optional) video** transitions for crossing/succession.
7. **VL-8 full-corpus art generation** once the style is locked; live-verify an hour-long playthrough
   now has visual presence + progress; PR the branch.

Quality gate per step: generate → READ my own output (screenshot/asset) → compare to the signature spec →
fix before commit. Never ship art I haven't looked at. License-log every asset.

## Open risks
- GenAI image style drift across eras → mitigated by the locked persona+palette+grain spec reused
  verbatim + the engraving medium choice + `editImage`/`recontextImage` for consistency passes.
- Asset weight on mobile → bounded cast economy + raster compression + lazy-load; budget per the
  mid-tier device target.
- The map overlay must stay data-viz (dots/polyline/fog), NOT illustrated cartography drawn by hand —
  the illustrated base is GENERATED, the overlay is data. Keeps the no-hand-drawn-SVG-art ban intact.
