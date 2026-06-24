---
title: GenAI Surfaces
updated: 2026-06-24
status: current
domain: technical
---

# GenAI Surfaces

The game's GenAI content is produced through a single repeated pattern, applied across **seven runtime
surfaces** plus the earlier text (scenes/QA/spine) and portrait/dossier image passes. Every surface obeys
**sim purity**: the deterministic sim never calls a model. Each surface is:

1. a **pure prompt/asset-key builder** in `src/sim/**` (no DOM, no `Date`, no `Math.random`),
2. an **offline generation script** in `scripts/` that fills a cache (a JSON map or a file under
   `public/assets/generated/**` or `public/assets/audio/**`), keyed by the builder's stable key,
3. a **runtime loader** that reads the cache and **degrades gracefully** when an asset is absent — so the
   game runs identically whether or not the assets have been generated (they are key-gated behind a
   `GEMINI_API_KEY`).

The composite key → filename map always replaces `:` with `_`.

## The seven surfaces

| # | Surface | Builder (`src/sim/…`) | Offline script | Runtime loader | Missing-asset fallback |
|---|---------|----------------------|----------------|----------------|------------------------|
| 1 | **News dispatches** | `news/genaiNews.ts` | `scripts/genai-news.ts` | `ui/loadNewsDispatch.ts` → `ui/NewsTicker.svelte` | the dispatch layer is omitted (the world-news rows + quiet-world grace note carry the panel) |
| 2 | **Era score (music)** | `music/genaiMusic.ts` | `scripts/genai-music.ts` | `audio/engine.ts` `setEra` | `.ogg → .wav → synth-chord` fallback chain |
| 3 | **Cinematics (video)** | `cinematic/genaiCinematic.ts` | `scripts/genai-cinematics.ts` | `ui/cinematic/CinematicView.svelte` | the `<video>` hides on error (the dossier/legacy report beneath shows) |
| 4 | **Map base art** | `genai/mapArt.ts` | `scripts/genai-map-art.ts` | `ui/saga/MapView.svelte` | era base → founding base → hide (the CSS base + data-overlay carry the journey) |
| 5 | **Dossier diagrams** | `dossier/dossierGenai.ts` (`buildDossierDiagramPrompt`) | `scripts/genai-dossiers.ts` | `ui/dossier/FigurePanel.svelte` (caption variant) | the `<img>` hides on error (the data panels carry the briefing) |
| 6 | **Beat narration (TTS)** | `narration/genaiNarration.ts` | `scripts/genai-narration.ts` | `audio/engine.ts` `playNarration` → `ui/sound.ts` | silent no-op (pre-start / muted / missing asset) |
| 7 | **Encounter portraits** | `genai/portrait.ts` (`rivalEncounterFacets`) | `scripts/genai-encounter-portraits.ts` | `ui/saga/RivalDossier.svelte` | the rival head `<img>` hides on error (the row still reads) |

Earlier passes on the same pattern: the **authored dynasty spine** (text, `pnpm genai:spine`), the
retired class-cell scene corpus retained as mined fabric/source material, the **dossier brief** prose
(`dossier/dossierGenai.ts` → `dossierBriefs.json` → `ui/dossier/loadDossierBrief.ts`, which shows a
"Compiling the assessment…" pending line when absent), the **dossier atmospheric figure**, and the
**protagonist portrait matrix** (`genai/portrait.ts` → `scripts/genai-portraits.ts`).

## The model tiers (`src/sim/genai/client.ts`)

| Modality | Default model | Constant |
|----------|---------------|----------|
| Text (generation + QA) | `gemini-3.5-flash` | `DEFAULT_GEN_MODEL` / `DEFAULT_QA_MODEL` |
| Image | `imagen-4.0-fast-generate-001` | `DEFAULT_IMAGE_MODEL` |
| Music | `models/lyria-realtime-exp` | `DEFAULT_MUSIC_MODEL` |
| Video | `veo-3.0-generate-001` | `DEFAULT_VIDEO_MODEL` |
| Speech (TTS) | `gemini-2.5-flash-preview-tts` | `DEFAULT_TTS_MODEL` |

Each is overridable via the matching `GEMINI_*_MODEL` env var. The video `uri` download passes the key in
the `x-goog-api-key` **header**, never a query string (CWE-598).

## Generating the live assets (offline)

All scripts require `GEMINI_API_KEY` in the env and are **idempotent** (skip already-cached keys unless
`--force`). Run via `pnpm vite-node`:

```sh
pnpm genai:spine                                # 10 authored spine generations → src/data/saga/spine.act.json
node scripts/fs-spine-origin-flavor.mjs         # reapply power-base opening variants after spine regen
node scripts/fs-spine-act-depth.mjs             # reapply depth interstitials after origin flavor
pnpm vite-node scripts/genai-news.ts               # 24 era×mood dispatch sets → src/data/genaiNews.json
pnpm vite-node scripts/genai-music.ts              # 10 era beds → public/assets/audio/<track>.wav
pnpm vite-node scripts/genai-cinematics.ts         # founding handoff + 4 finales → …/cinematics/<key>.mp4
pnpm vite-node scripts/genai-map-art.ts            # 8 era map bases → …/map/map_<eraBand>.png
pnpm vite-node scripts/genai-dossiers.ts           # dossier figures + diagrams + briefs (kind×era)
pnpm vite-node scripts/genai-narration.ts          # 2 beats × 8 eras → …/audio/narration/<key>.wav
pnpm vite-node scripts/genai-encounter-portraits.ts# 7 rival heads × 8 eras → …/portraits/<key>.png
pnpm vite-node scripts/genai-portraits.ts          # the protagonist portrait matrix
```

Each image/audio/video asset is license-logged in `src/data/assets.json` (`license: "Generated"`).

## Status

All seven surfaces are SHIPPED (builders + scripts + graceful runtime + tests), merged through PRs
#202 (news), #203 (music), #205 (video), #207 (map), #209 (dossier diagrams), #211 (TTS), #213
(encounter portraits). The live assets are produced offline when a key is available; until then every
surface degrades cleanly per the table above.
