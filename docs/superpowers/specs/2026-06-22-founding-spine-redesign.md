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

## DECISION (2026-06-22, FS-ONB-DRIFT): the founding-era origin funnel

Grounded in `2026-06-22-founding-era-research.md`. The pre-pivot onboarding still
narrates an immigrant CROSSING (period→class→wave, "what did they carry off the
boat?") — wrong: the player FOUNDS the line at the 1776 American founding; the
immigration waves are the recurring CAST woven as intersections, not the player's
own origin. The live game already routes founded runs through the 1776 spine
(`beginSpine`), so the wave-shaped onboarding + the old 1885 new-york origins
events are dead-but-reachable drift.

**Decision — replace the wave funnel with a founding-era ORIGIN funnel:**

1. **REGION** (replaces PERIOD/wave-era): New England · Mid-Atlantic · South —
   with the Tidewater/backcountry split surfaced in the South (and as flavor
   elsewhere). Each region carries its researched economy/culture/faith.
2. **POWER BASE / ARCHETYPE** (replaces poor/middle CLASS as the *primary* axis):
   the six interlocking bases from the research — **Land** (planter/yeoman),
   **Commerce** (merchant), **Pulpit** (minister), **Law & Politics** (lawyer/
   officeholder), **Press** (printer), **Military** (officer). This IS the
   archetype coloring of the one spine (answers the open question: yes). It seeds
   the starting motivators + the spine's decision flavoring.
3. **STANDING** (a lighter replacement for poor/middle): where the founder starts
   within that base — established (gentry/master) vs. rising (apprentice/yeoman/
   journeyman). Capital-gated mobility is the researched truth; standing sets the
   starting rung, not a separate class identity.
4. **STYLE → SURNAME → GENDER → GIVEN → JOB → FRIEND → PARTNER** — REUSE the ONB-1
   naming flow + the FS-7b life-seeds verbatim. The naming-style options stay (a
   founding family still has a cultural naming tradition — Anglo-Protestant,
   Scots-Irish, Dutch, German, Huguenot, etc., per region), just no longer tied to
   an immigration wave.

**Why:** matches the founding-spine fiction, kills the "off the boat" drift, gives
real researched agency (region × power base × standing) without resurrecting the
504 cell lattice, and keeps the diegetic birth + life-seeds the user asked for.
The self-made/log-cabin myth is deployed as in-world propaganda (flavor text), not
the advancement mechanic — advancement is the convertible power-base flywheel.

**Build order:** (a) a `foundingOrigin.ts` resolver (region/base/standing →
motivators + seed flags), replacing the `waveSelect` role for the player; (b)
rewrite OnboardingScreen's first three steps + copy; (c) thread region/base/
standing through onComplete → founding; (d) retire/rehome the dead 1885 new-york
origins line-failure content (FS-EARLY-TERMINATION); (e) tests + Chrome verify.
Keep `waveSelect` + the wave places for the CAST/braid system (they're not the
player origin anymore, but the cast still uses them).

## DECISION (2026-06-23, SPINE-ACT-DEPTH): deepen each act toward the hour+ mandate

MEASURED: each of the 10 spine acts has only ~4 CORE scenes (open + ~3
DecisionArchitecture scenes) at ~2 prose paragraphs each — ~15-20 min of total
reading, well short of the user's "an hour or more of gameplay." The
origin-flavor work (g0-g9) added a rich per-base OPENING; the remaining depth
lever is MORE lived texture between the major decisions.

**Decision — interleave INTERSTITIAL scenes (not more major decisions):**
Per [[novel-not-fragments]] the content should read as a NOVEL — not every scene
a choice. So between the authored DecisionArchitecture beats, insert decisionless
(or weave-only) interstitial scenes that develop world/family/consequence:

- **TEXTURE** scene (after the open, before the first decision): grounds the
  generation's world + the family's standing in it — sensory, 2-3 paras, 1-2
  weave beats (flavor + a small motivator nudge, `gather:true`), falls forward.
- **CONSEQUENCE/AFTERMATH** scene (after a major decision): shows the decision
  landing — the cost, the rival's reaction, the next generation taking shape.
  2-3 paras, 1-2 weave beats, falls forward.

Target shape per act: open → texture → [decision] → consequence → [decision] →
close (~6 scenes, ~10-12 beats), roughly doubling each act's reading + choices →
~6 min/act × 10 ≈ the hour. Interstitials are decisionless/weave-only (the major
DecisionArchitecture decisions stay the act's pivots — the anti-sameness
invariant is unaffected).

**Authoring:** the GenAI spine pipeline is the natural author, BUT no key in this
env. So hand-author the interstitials in the spine voice (multi-para sensory
prose, {given_name}/{surname}/{family_name} tokens, weave beats with small
motivatorShifts), inserted via an idempotent script like the origin-flavor one
(regen-safe — spine.act.json is GenAI-generated). Build g0 first as the
pattern-setter, then extend act by act; ship in sensible batches as PRs.

## DECISION (2026-06-23, SAGA-RESTORE-CURSOR): persist the saga walk in save/restore

**Discovered building the act-depth interstitials:** deepening g0 from 4→6 scenes
broke the loop.unit "crossing nudges replay-safe across save/restore" test
(year diverged 2166→2182). Root cause is a real save/restore gap, in two layers:

1. **In-memory layer:** `Game.beginSagaActForState()` always RESTARTED the
   current generation's act at its OPENING on (re)construct. A `GameState`-object
   restore taken mid-act therefore replayed the act's already-seen scenes,
   over-advancing the decoupled saga clock. (4-scene acts only passed by luck —
   restores happened to land on generation boundaries.) **Fixed** by persisting a
   `SagaCursor` (actId + sceneId + beatCursor) on `GameState` and a
   `SagaDriver.restore(cursor, motivators, flags)` that resumes at the saved
   scene. The motivators/flags are NOT duplicated in the cursor — they live in
   `personality`/`flags`, kept in sync — so the full ActState rebuilds from the
   cursor + those.

2. **Persisted-save layer (deeper):** the on-disk save (`toSave`/`fromSave`) is
   **seed + event-history only** ([[mmm-save-and-chronology]]). The saga walk
   choices (`pickBeat`/`pickDecision`) were NEVER recorded in `history`, so
   `fromSave` (which replays only event `applyChoice` steps) reconstructs a
   saga-deep run back to its FOUNDED BASE — losing all saga progress. Since a
   founded line's primary surface IS the saga, a reload silently rewinds the run.

   **Decision — Option A: record saga choices in `history`, reconstruct by
   replaying them through the engine.** This preserves the "save = seed + history,
   bit-identical replay" invariant rather than snapshotting mutable state (which
   would have to capture the saga clock, family aging, and rival world — all
   advanced OUTSIDE history by `advanceRunClock`). `HistoryEntry` gains an optional
   saga discriminant (`{ saga: "beat" | "decision", index }`); `loop.ts` appends
   one on every `pickBeat`/`pickDecision`; `toSave` carries them; reconstruction
   replays the event steps to the founded base, then re-drives the SagaDriver
   through the recorded saga steps. The saga clock/family/world all re-derive
   deterministically from the choice sequence, so the reconstruction is identical.
   The in-memory `SagaCursor` (layer 1) remains as the cheap mid-render position
   for the `GameState`-object restore path used by tests + hot reload; the save
   layer is the durable seed+history channel. Rejected: Option B (snapshot full
   GameState) breaks the invariant; Option C (separate side-channel array) is just
   Option A with a redundant parallel list — folding into `history` keeps ONE
   ordered choice log that already drives every RNG fork label.
