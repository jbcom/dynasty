---
title: Founding-Spine Redesign — one line from America's founding → stars, corpus as braid fabric
updated: 2026-06-22
status: draft
domain: creative
---

# Founding-Spine Redesign

## The problem this fixes

Reading four disparate cells (Irish dock-poor / Chinese political-middle / Jewish entertainer-poor /
Bavarian clergy-middle) side by side: rich, period-accurate PROSE but **one shared skeleton** — every
open is "the [place] smelled of [3 nouns]," every turn is the same "the [community] stands at a
crossroads… how will you shape [it]?" with the **same three options** (collective action / build an
institution / withdraw-or-go-market). 504 cells, one template. The prose-polish QA passes (UQ-2) could
not fix this — it's a STRUCTURAL fault: dissolving the original single-archetypal-line concept into 504
procedurally-equivalent parallel protagonist stories *is what created the sameness*
([[founding-spine-pivot]], [[craft-spines-not-generator]]).

It also caused the second problem the user named — **split focus**: authoring effort spread thin across
504 cells instead of concentrated on one strong story.

## The redesign (user-confirmed, 2026-06-22)

**ONE spine line, founded at America's FOUNDING (late-1700s), carried to the stars.** America's story AS
the player's family's story. The seven immigrant WAVES (Irish/Italian/Chinese/Jewish/Scandinavian/
German/Baghdadi) are no longer 504 parallel games — they are the **braided fabric**: supporting
plotlines and intersecting lives that weave in and out of the spine as they arrive across the centuries.

**The 504-act corpus is MINED selectively, not discarded:** its strongest scenes + crossings become the
intersection-fabric pool; acts that don't serve the spine are retired. The tons of authored prose are
repurposed as the world the one line moves through.

This recovers the strength the user kept circling back to (a single synthesized archetypal American-power
through-line — the old Trumpesque-line focus) but anchored to 1776 — the founding era we'd originally
discussed dropping, now the ANCHOR.

## Architecture

### 1. The SPINE (the one authored line)

A single dynastic chain spanning ~1776 → stars, structured as a sequence of generational ACTS along the
existing macro-acts, with a new founding band prepended:

- **Founding (≈1776–1860)** — NEW. The line begins as Americans-at-the-founding (the original stock the
  later waves arrive *into*). 2–3 generational acts: revolution-era founding, early republic, the run-up
  to the Civil War.
- **Convergence (→1899)**, **Emergence (1900–2040)**, **Ascension (2041+)** — the existing macro-acts,
  re-pointed at the ONE spine instead of 504 cells.

The spine is **CRAFTED, not generator-stamped** — distinct act shapes + distinct decision architectures
per era (a founding-era constitutional choice ≠ a Gilded-Age labor choice ≠ a stellar-expansion choice),
explicitly NOT the one civic-fork template. This is where the per-era bespoke-spine work
([[craft-spines-not-generator]]) finally lands, now tractable because it's ONE line, not 504.

Identity: the spine is still composed (the player's onboarding choice colors it — archetype/power base
+ a family character), but there is ONE line, not a lattice. Onboarding simplifies: you found THE
American line and choose its character, not a wave×class×archetype cell among 504.

### 2. The WAVES as braid fabric (the mined corpus)

Each wave arrives in its historical era and **braids into the spine** at intersection points:

- The existing braid machinery (`src/sim/saga/braidSelect.ts` selector + the slot-tagging QA pass +
  `loop.ts` weave) is REPOINTED: instead of weaving one cell into another peer cell, it weaves a WAVE's
  mined scene-fragment into the SPINE's current act at an era-appropriate crossing (the Irish arrive in
  the 1840s and cross the spine on the docks; the Chinese on the 1860s railroad; etc.).
- **Corpus mining (`scripts/mine-fabric.ts`, new):** walk the 504 acts, score scenes for (a) crossing
  potential (existing braid slots / public settings), (b) prose quality, (c) era/wave fit; extract the
  keepers into a `src/data/saga/fabric/` pool keyed by `wave × era × setting`; retire the rest. The
  spine's braid selector draws from this pool. The mining is a one-time offline pass; reviewable diff.
- Waves are thus **forces that intersect**, woven INTO the spine prose ([[intersections-woven-not-walls]]),
  never separately played start-to-finish.

### 3. What gets retired / changed

- The wave×archetype×class cell as the unit of PLAY is retired (it becomes fabric source material).
- `spineFor()` (the generator that stamps 504 scaffolds) is replaced by the AUTHORED spine acts +
  per-era bespoke decision architectures. The arc-shape variety machinery may survive as one input, but
  the one-template civic-fork decision is GONE — decisions are authored per era.
- Onboarding collapses to: found THE line (1776) + choose its character/archetype + name (ONB-1 naming
  flow is reused). No wave/class cell pick.
- The visual layer ([[visual-layer-revival]]) is DEFERRED until the spine works (it outranks it).

### 4. What's preserved

- The deterministic sim (seed+history replay), the save model, the braid SELECTOR + slot machinery, the
  guidance.json research (now informs the WAVES-as-fabric, their real arrival history + braid affinity —
  exactly what it was researched for), the SceneReader + the shipped UQ-UI scannability rework, ONB-1
  naming, the convergence endings.

## Build order (decomposed into the directive queue)

1. **FS-1 design sign-off** — this doc. (Sign-off pre-granted [[vl-autonomy-and-branch-split]]; proceed.)
2. **FS-2 the founding era band** — extend eras/macroActs with the 1776 founding band; the spine clock
   spans 1776→stars; tests + determinism.
3. **FS-3 the authored spine model** — replace the 504-cell `spineFor` generator with the authored spine:
   per-era act definitions + DISTINCT decision architectures per era (founding/Gilded-Age/modern/stellar).
   This is the core craft work; tests pin "no two eras share a decision template."
4. **FS-4 corpus mining** — `scripts/mine-fabric.ts`: extract the keeper scenes/crossings from the 504
   acts into `src/data/saga/fabric/`; retire the rest; license/provenance preserved.
5. **FS-5 repoint the braid** — braidSelect draws wave fabric into the spine at era-appropriate crossings;
   weave INTO prose; live-verify a crossing reads organically.
6. **FS-6 generate/author the spine prose** — GenAI (reusing the pipeline) fleshes the authored spine acts
   to depth, era-distinct; QA against guidance; commit-before-run.
7. **FS-7 onboarding collapse** — found-THE-line flow (reuse ONB-1 naming); retire the cell picker.
8. **FS-8 live-verify the hour+ playthrough** — one line, 1776→stars, waves braiding in, era-distinct
   decisions, reads as ONE strong story not a template. THEN revisit the visual layer.

## Open questions for the build (decide in-flight, log decisions)
- Exactly which/how-many founding-era generational acts (3-ish) and their distinct decision shapes.
- Mining score thresholds (how much corpus survives as fabric).
- Whether the player's onboarding archetype still maps to a "power base" coloring of the one spine
  (likely yes — keeps agency without the 504 lattice).
