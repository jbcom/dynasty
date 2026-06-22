---
title: Scope-Delineated GenAI QA Pipeline
updated: 2026-06-22
status: current
domain: quality
---

# Scope-Delineated GenAI QA Pipeline

## Problem

The novel corpus is drafted by a bulk GenAI sweep (`genai:expand --type scene`), now on
`gemini-3.5-flash`. A first QA attempt revised each act file as a whole, one call per tier,
sending the full ~90KB file each time — unusably slow, and (worse) **asking the wrong
question**: a whole-file edit conflates error classes that live at different scopes and
can't all be seen from the same context window.

Errors in this corpus live at three distinct **impact scopes**:

| Scope | Unit | Error class it owns |
|---|---|---|
| **Scene** | one scene (`prose`, `beats`, `decision`) | flat prose, weak sensory frame, a limp choice |
| **Storyline (lineage)** | one family's act-file (6 tier-acts × 5 scenes) | cross-tier continuity: heirs/flags carried forward, motivator drift, consistent voice across generations |
| **Braid (cross-storyline)** | a (wave × rival × tier) crossing | the crossings are coherent and pair-specific when two lines are read together |

A per-scene pass is blind to lineage and braid errors — the ones that make the corpus read
as a coherent saga rather than disconnected vignettes. **QA must be delineated by impact
scope: each pass sees exactly the context its error class needs, and fixes the whole
affected unit.**

A separate finding reframes the braid scope: the cross-storyline "crossing" is currently a
single hardcoded template sentence (`player.ts:crossingLine`), identical for every pair
except the two wave labels. There is nothing rich to QA — the braid layer is *under-authored*.
So the braid pass **authors** pair-specific crossing prose; it does not polish a stub.

## Data model (verified)

- Act file `src/data/saga/<wave>/<archetype>.<cls>.act.json` = `{ _comment, acts[6], scenes[30] }`
  — one family's full storyline.
- `act`: `{ id, wave, archetype, cls, tier, macroAct, title, scenes:[sceneId] }`.
- `scene`: `{ id, sense, prose:[para], beats:[{prose,choice}], thread:[ThreadRef], requires, next }`.
- `ThreadRef`: `{ wave, atTier, relation?, crossing?:string }`. On disk `thread` is `[]`; the
  braid is computed at load by `player.ts:weaveThreads`, which **respects an authored thread**
  (`if (mid.thread.length > 0) continue`). → Authored crossings written into a midpoint
  scene's `thread[]` are honored with **no loader change**. This is the braid-pass seam.
- Validation gate (reused by every pass): `scene.ts:validateSceneFile` = `SagaFileSchema`
  + preset-person leak floor + act-id match. `mergeSceneFile` dedups acts/scenes by id.

## Architecture: three scoped passes, one orchestrator

`scripts/genai-qa.ts` becomes a scope-delineated pipeline. Each pass is a pure
prompt-builder + system-instruction in `src/sim/genai/qa.ts` (new module, sibling to
`scene.ts`), validated through the existing gate. The orchestrator runs passes in
**ascending scope order** (scene → lineage → braid) so a later pass reads already-polished
prose, with bounded concurrency.

Token discipline: payloads are **minified JSON** (TOON was evaluated and is −12% on these
files — they are 80% prose, which no notation compresses; the compact win is per-scope
context, not format). Each pass sends only the unit its scope needs, never the whole corpus.

### Pass 1 — Scene polish (scope: one scene)
- Input: a single scene's JSON + its act's title/sense/macroAct for register.
- Ask: richer sensory prose, sharper period voice, choices that bite. Preserve `id`, `sense`,
  `next`, beat count, decision tier/option-count.
- Concurrency: scenes within a file run in parallel; files in parallel.
- Splice each revised scene back; validate the whole file once; keep originals on any failure.

### Pass 2 — Lineage continuity (scope: one act-file)
- Input: the whole family's 6-act chain (post-pass-1), but **only** the structural spine +
  decision/flag/heir surface (not every paragraph) to keep the prompt lean — act titles,
  per-tier macroAct, each scene's decision + `setFlags` + `requires`, the succession beats.
- Ask: identify breaks (a t2 choice that contradicts t3's premise; a flag set but never read;
  motivator drift that makes no sense; voice that lurches between tiers). **Fix the whole
  affected unit** — may rewrite any scenes in the chain needed to repair continuity.
- Validate the full file; keep prior version on failure.

### Pass 3 — Braid authoring (scope: wave × rival × tier)
- For each (act.wave, rival, tier) pairing `weaveThreads` would create, author a
  **pair-specific** crossing: a real intersection between *these two* lines at this tier,
  not the template. Uses `waveLabel` for both lines + the macroAct era.
- Write the authored `crossing` (and `relation`) into the midpoint scene's `thread[]` on disk.
- `weaveThreads` then honors it automatically (respects authored threads). The hardcoded
  `crossingLine` template stays only as the fallback for unauthored pairs.

## Fix policy

Higher-scope passes **revise the whole affected unit** (chosen): a lineage break may rewrite
multiple scenes; a braid pass authors the full crossing. Every write re-runs
`validateSceneFile`; a failed revision is discarded and the prior version kept — the pipeline
never degrades the corpus.

## CLI

```
GEMINI_API_KEY=… pnpm genai:qa                         # dry-run, all passes, all files
GEMINI_API_KEY=… pnpm genai:qa --write                 # all passes, overwrite
GEMINI_API_KEY=… pnpm genai:qa --pass scene --write     # one pass
GEMINI_API_KEY=… pnpm genai:qa --pass lineage --wave baghdad --write
GEMINI_API_KEY=… pnpm genai:qa --pass braid --write
GEMINI_MODEL / GEMINI_QA_MODEL override the model id.
```

Run direct via `vite-node … > log 2>&1` (NOT `pnpm … | head`) — the pnpm+pipe layer buffers
stderr in the background harness, which masked progress in the first attempt.

## Testing

- Unit (pure, no network): each pass's prompt builder includes the right scope context and the
  preserve-this contract; `validateSceneFile` rejects a revision that drops/relabels ids;
  braid authoring writes a `thread[]` entry `weaveThreads` will honor; the pass orchestrator
  runs scene→lineage→braid order.
- The corpus integrity test asserts both tracks (252 poor + 252 middle = 504) once the gen
  track fills baghdad/chinese.

## Non-goals

- No corpus format change (stays canonical JSON; zod-loaded). TOON removed.
- No regeneration of complete cells — QA lifts existing prose; only genuinely-missing cells
  (chinese tail, baghdad) are freshly generated, also on 3.5-flash.
