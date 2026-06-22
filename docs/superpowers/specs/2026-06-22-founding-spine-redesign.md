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

### 2-PRIME. Everything is BRANCHES OFF THE ONE DYNASTY TIMELINE (the unifying frame)

The decisive simplification (user, 2026-06-22): there are NOT separate Jewish / Scandinavian / German
lineages running in parallel. There is **ONE timeline — the player's dynasty — with BRANCHES off it.**
The choicest bits of ALL the wave material are **rewritten AS branches of the player's line**: instead
of "a Scandinavian family's story," it's "OUR dynasty meets the merchant / the fishmonger / …" — the
encounters, sub-plots, and 20th-century turns are framed from the PLAYER'S dynasty's POV, hanging off
its single timeline. The other waves dissolve from foreign protagonists into branch-content *in your
path*. (The recurring-family cast of §2 still exists as the PEOPLE you meet across the branches — the
Turtledove continuity — but they live INSIDE the one timeline as recurring encounters, not as parallel
playable lineages.) This is what the deterministic-trigger lattice (§2b) activates: branches of the one
tree, not weaves between peer trees.

Mining (FS-4) therefore = pull the choicest/most-unique scenes from the 504 acts and **REWRITE them,
POV-shifted, as branches off the dynasty timeline** (the merchant encounter, the dock meeting, the
20th-c. turn), keyed by the trigger conditions that bring them in.

### 2. The recurring people you MEET across the branches (the Turtledove cast)

The fabric is NOT anonymous one-off crossing fragments — it is a **persistent, bounded recurring cast of
FAMILIES** (≈one per wave, ~7) that grow ALONGSIDE the spine across the centuries. The model is **Harry
Turtledove's long alt-history series**: you follow a handful of families through the ages, the same
lineages recurring decade after decade, and you become EMOTIONALLY INVESTED in their rise/fall/
intersection/persistence (user, 2026-06-22). This is also the Suzerain/80 Days "recurring cast" strength
and the Reigns cast-economy — and it KILLS the duplication: ONE spine + ~7 tracked families >> 504
redundant parallel stories.

Each cast family:
- **arrives in its historical era** (Irish 1840s, Chinese 1860s railroad, Italians/Jews 1880s-1900s, …)
  and **braids into the spine** at era-appropriate crossings, woven INTO the spine prose
  ([[intersections-woven-not-walls]]).
- **recurs with CONTINUITY + MEMORY:** you meet the same family's descendants generations later; the game
  tracks who they were and your prior crossings, so a later meeting pays off the earlier one. (A small
  per-family state: name, current generation/standing, history of crossings with the player — the same
  shape as the player's own `family` state, reused.)
- is a CHARACTER you track + care about, not a disposable vignette.

**Corpus mining = curate the BEST + most UNIQUE (`scripts/mine-fabric.ts`, new).** This is how the 504
acts become an ASSET: with that much authored material, mine for the genuinely STANDOUT, DISTINCTIVE
scenes/crossings per family (user: "mining for the best and most unique will help with that") — discard
the templated-sameness bulk, keep the moments that make each family feel singular + memorable. Score
scenes for (a) UNIQUENESS/distinctiveness (the priority — what breaks the template), (b) crossing
potential (braid slots / public settings), (c) prose quality, (d) era/wave fit; extract the keepers into
`src/data/saga/fabric/` keyed by `family(wave) × era × setting`; retire the rest. One-time offline pass,
reviewable diff.

### 2b. The anchoring system → a DETERMINISTIC-TRIGGER LATTICE (the big unlock)

Because the wave families are **no longer separately playable**, their material doesn't have to hold
together as self-contained games — so I can RIP PIECES OUT freely and recompose. And because the spine
sim is **fully DETERMINISTIC** (seed + history, no RNG; save = seed+history replays bit-identical), the
anchoring changes from "weave one fragment at a braid slot" to a **TRIGGER LATTICE: deterministic
conditions on the spine state activate ENTIRE family BRANCHES** (user, 2026-06-22 — "way more flexibility
because the triggers are deterministic").

**Trigger grammar (compound, all reading deterministic spine state):**
> IF `archetype/power-base = X` AND `leanings/motivators ⋛ Y` AND `money/meters ⋛ Z` AND `place = L`
> AND `era ∈ E` AND `flags include/exclude F` AND `priorCrossing(family) = …` → THEN activate
> `family.branch[B]` (a whole arc of that family's mined material, not a single vignette).

(User's shorthand: *"if this and this and your leanings are this and your money is this and you're at
location this then that."*) The inputs — archetype, motivators/leanings, meters, place, era, flags, and
the per-family crossing-history (memory) — are ALL deterministic, so the same playthrough fires the same
branches every replay; determinism + the save model are preserved for free.

**Why this beats slot-weaving:** a 1880 spine choice can deterministically pull the Italian family's
whole rise-arc into your path; a flag from an earlier crossing branches that family's later appearance
(continuity/memory); the recurring cast's arcs are gated by WHO YOU ARE + WHERE YOU ARE, so each
playthrough threads a different subset of family branches → emergent variety from authored material, no
RNG needed. This is the [[emergent-cause-effect-sim]] goal, achieved through deterministic triggers over
the mined fabric rather than per-cell randomness.

**Implementation:** a `TriggerRule[]` data table (`src/data/saga/triggers.json`) — each rule = a compound
condition (predicate over the deterministic state vector) + the `family.branch` it activates + priority/
once-only flags. A pure `evaluateTriggers(state, fabric)` selector (deterministic, replaces/extends
`braidSelect.ts`) returns the activated branches for the current spine beat; the runner weaves the branch
INTO the spine prose. Conditions are authored data (designer-tunable), not code.

### 3. What gets retired / changed

- The wave×archetype×class cell as the unit of PLAY is retired (it becomes fabric source material).
- `spineFor()` (the generator that stamps 504 scaffolds) is replaced by the AUTHORED spine acts +
  per-era bespoke decision architectures. The arc-shape variety machinery may survive as one input, but
  the one-template civic-fork decision is GONE — decisions are authored per era.
- Onboarding collapses to: found THE line (1776) + choose its character/archetype + name (ONB-1 naming
  flow is reused). No wave/class cell pick.
- The visual layer ([[visual-layer-revival]]) is DEFERRED until the spine works (it outranks it).

### 3b. ENDINGS — archetypal DESTINIES for the one dynasty (the payoff of one line)

With ONE dynasty (not 504 gated cells), the endings get CLEAN + ambitious: a set of recognizable
archetypal DESTINIES the single line can reach (user, 2026-06-22) — e.g. **religious leader, communard,
dictator, oligarch, crime leader, media mogul** (+ more). Because it's one line, we can be far more
creative + far-reaching in HOW you get to each (the trigger lattice branches toward any destiny via your
leanings/power-base/choices over centuries), AND in the STELLAR finales:
- **reach the stars to forge ALLIES** (a covenant/commonwealth among worlds),
- **reach deep into the stars to SEIZE COLONIES** (conquest/empire),
- **end ISOLATED + ALONE on a planet quiet enough to attract no notice** (the hidden-survivor ending).

This supersedes the abstract convergence-gate endings: destinies are now NAMED archetypes + multiple
distinct stellar fates, gated by the line's accumulated deterministic state (motivators/power-base/flags/
crime-vs-legit path), composed from the spine + branch history. The existing `convergence.ts` ending
lattice + motivator gates are the mechanism; this re-skins/expands them as dynasty destinies. (Folds in
[[crime-power-axis]]'s "crime planet" dictatorial finale as one destiny among the set.)

### 4. What's preserved

- The deterministic sim (seed+history replay), the save model, the braid SELECTOR + slot machinery (to be
  generalized into the trigger lattice), the guidance.json research (now informs the recurring families'
  real arrival history + branch affinity — exactly what it was researched for), the SceneReader + the
  shipped UQ-UI scannability rework, ONB-1 naming, and the convergence ending lattice (re-skinned as the
  archetypal dynasty destinies of §3b).

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
