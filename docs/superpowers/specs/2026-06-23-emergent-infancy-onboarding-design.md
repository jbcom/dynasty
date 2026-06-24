---
title: Emergent-Infancy Onboarding
updated: 2026-06-23
status: current
domain: product
---

# Emergent-Infancy Onboarding — identity crystallizes through a lived Act 1

**Governing user directive (2026-06-23, four messages).** Replace the ~10-step upfront onboarding MENU
with a lived, sensory-emergent infancy/childhood Act 1. Identity facets *emerge* through experience, not
picked from cards. Memory: [[emergent-infancy-onboarding]]. Directive: `.agent-state/directive.md`
"★TOP PRIORITY — EMERGENT-INFANCY ONBOARDING★", queue EI-1…EI-8.

This spec is **EI-1** (use-case enumeration + data model + chosen approach). No code until it's written.

## The problem (confirmed this session)

`OnboardingScreen.svelte` is a 10-phase `.card`/`.choices` button funnel:

| # | phase | facet it sets |
|---|-------|---------------|
| 1 | `region` | founding place (New England / Mid-Atlantic / South) |
| 2 | `base` | power base / archetype (Commerce, Pulpit, Law, Land, Press, Sword) |
| 3 | `standing` | starting class rung |
| 4 | `style` | naming tradition (culture) |
| 5 | `surname` | family name (text/auto) |
| 6 | `gender` | progenitor sex |
| 7 | `given` | given name (text/auto) |
| 8 | `job` | life-seed: first job |
| 9 | `friend` | life-seed: best friend |
| 10 | `partner` | life-seed: life partner |

The user counted "TEN choices before you even start." Four faults:
1. **Front-loaded menu** — facets that should *emerge* through a lived infancy are a checklist.
2. **3 picked start-locations** force three competing Act-1 storylines.
3. **Choices render as plain sentences below the prose "without buttons"** — not the Suzerain
   glowing-inline pattern.
4. **Cutting the Epoch-0 birth removed the diegetic sensory + formative texture** where facets would
   crystallize naturally (the retired birth chain WAS this — see below).

## The retired Epoch-0 birth chain (the seed of the fix)

`docs/STATE.md` "diegetic birth (Epoch 0) — RETIRED" records exactly the mechanic the user is asking
for, since deleted:

- **ev_birth_emergence** — a **6-slot sensory cue → place reveal** (location emerged from the senses).
- **ev_birth_gender** — "your parents exclaim…" (gender named in-fiction).
- **ev_birth_naming** — "You are {full_name}" (named in-fiction).
- **ev_birth_calling** — a lived choice among the six callings (`setsCalling`).

The redesign is, in essence (per the user's 2026-06-23 correction): **UN-RETIRE Epoch 0** as the
emergence of the progenitor through infancy → childhood → adulthood, **with real authored copy**, and
delete the funnel — built on the current saga/SceneReader substrate (glowing inline choices, the
foundByComposition seam), feeding ALL ten facets through lived beats.

## Use-case enumeration — where each facet EMERGES in a lived Act 1

The pure founding seam stays `foundByComposition(content, {place, era, culture, year, archetype, gender,
surname, given?, ...})`. The funnel that feeds it is replaced by the opening act's *accumulated* state.
Each facet maps to a diegetic moment:

| facet | emerges from | when (Act 1) | mechanism |
|-------|--------------|--------------|-----------|
| **place / region** | the newborn's senses (hear/smell/touch/taste) | beat 1 (birth) | sense-accumulation → resolved place (see data model) |
| **culture / naming tradition** | the family's world (the cradle-tongue, the rites around the birth) | beat 1–2 | implied by place + a naming-rite reaction; defaulted from place, nudged |
| **gender** | named at birth ("your parents see a son / a daughter") | beat 1 (gender beat) | seed-dealt; surfaced in-fiction, not picked |
| **surname** | the family name spoken over the cradle | naming beat | seed/culture-dealt; the player may accept or (rarely) reshape |
| **given name** | the parents' choice, spoken | naming beat | culture-pool dealt; player accepts/aligns |
| **standing / class rung** | the family's circumstances the child grows up in (the house, the table, the work seen) | early childhood | shown through sensory detail of the household; resolves the rung |
| **power base / archetype** | the child's early inclinations + what the family does (the ledger, the pulpit, the land, the press, the blade) | mid Act 1 (early schooling / first work) | the formative beats nudge the bent; resolves archetype |
| **life-seed: first friend** | the FIRST-FRIEND beat | mid Act 1 | a lived scene (the friend's character set by the player's reaction) |
| **life-seed: best friend / rival** | the friend deepening, OR a FIRST-BETRAYAL beat | mid–late Act 1 | formative beat |
| **life-seed: partner** | a FIRST-ROMANCE beat (later in the opening) | late Act 1 | formative beat |
| (new texture) **first loss** | a FIRST-LOSS beat (a death/parting) | mid–late Act 1 | formative beat; sets a hardship seed |
| (new texture) **early schooling** | an EARLY-SCHOOLING beat | mid Act 1 | formative beat; nudges archetype/standing |

So the ten funnel cards become: **1 sensory birth beat** (place + gender + culture seeds) → **1 naming
beat** (surname/given) → **a childhood of formative beats** (schooling, first friend, first betrayal,
first loss, first romance) that set standing, archetype, and the three life-seeds. Identity is fully
composed by the end of Act 1 — woven, not front-loaded.

## Data model

Two new pure pieces in `src/sim/` (sim-pure: deterministic, no DOM/Date/Math.random):

### 1. Sense-accumulation → resolved place (`src/sim/founding/senseEmergence.ts`)

```
SenseCue = { sense: "sound"|"smell"|"touch"|"taste", text, placeWeight: Record<placeId, number> }
```

- The birth beat deals (seeded) a small set of sensory cues; each cue carries a weight toward candidate
  places (gulls+brine → coastal New England; mill-clatter → Mid-Atlantic; cicadas+tobacco → South; and
  the immigration-wave places similarly). The player's *reaction taps* (which sense they attend to) add
  weight. After the beat, `resolvePlace(cues, reactions, rng)` returns the single place with the highest
  accumulated weight (ties broken deterministically by seed). **One emergent place, never a 3-way pick.**
- Deterministic: same seed + same reaction taps → same place. (Replaces the `region` card.)

### 2. Formative-beat → facet/seed accrual (reuse the saga act substrate)

The opening is an **authored Act-1 spine** (the EI opening act), expressed in the EXISTING saga schema
(`src/sim/saga/schema.ts` Scene → Beat → Decision), so it renders through the SceneReader's glowing
inline-choice surface for free. Each formative beat's decision sets flags / motivator shifts / life-seed
values via the existing `applyDecision` / motivatorShifts machinery — the same way saga beats already
accrue into the run + the convergence ending. No new accrual engine; the opening act is just saga content
authored to set the founding facets, with `foundByComposition` called from the act's accumulated state at
Act-1 close (or progressively as each facet resolves).

**Why reuse the saga substrate (not a bespoke onboarding state machine):** the SceneReader glowing-inline
choices, the paged prose, the motivatorShift/flag accrual, and replay-determinism ALL already exist there.
The funnel's bespoke `.card` machine is exactly what the user is rejecting. Building the opening as saga
content makes it look + behave like the rest of the game (the whole point) and deletes a parallel system.

## Approaches considered

**Option A — bespoke "emergent onboarding" component (extend the funnel into a prose-y flow).** Rejected:
keeps a parallel surface from the saga; re-implements glowing-inline choices + accrual that SceneReader
already has; risks the same "sentences without buttons" fault.

**Option B — author a new EI opening act in the saga schema only (don't touch Epoch 0).** Rejected per
the user's explicit 2026-06-23 correction: **"you were supposed to UN-RETIRE Epoch 0 as part of
emergence — the emergence of the progenitor of the dynasty through infancy through adulthood — and write
real copy for it."** Epoch 0 is not to be mined-and-discarded; it is to be **un-retired** as the literal
opening. So a from-scratch parallel act that ignores Epoch 0 is the wrong framing.

**Option C (CHOSEN) — UN-RETIRE Epoch 0 as EMERGENCE: the progenitor's lived arc infancy → adulthood,
with real authored copy, on the saga substrate.** Epoch 0 returns as the played opening — but rebuilt on
the current saga/SceneReader substrate (glowing-inline choices, motivatorShift/flag accrual, replay
determinism, foundByComposition seam), NOT as the old `eras/.../birth` event chain. Its proven mechanics
(the **6-slot sensory cue → place reveal**, **gender named in-fiction**, **naming in-fiction**, the lived
**calling** choice) are revived AND extended into a full infancy→childhood→adulthood emergence with the
formative beats (first friend / betrayal / loss / romance / early schooling). **Real copy is authored**
for every beat (not placeholder/generated-only — hand-written prose in the game's voice, GenAI may flesh
texture but the spine copy is real). The funnel is deleted; `foundByComposition` is fed from Epoch 0's
accumulated state. This is the user's directive made concrete: Epoch 0 un-retired = the emergence.

### docs/STATE.md correction (part of EI-6)
`docs/STATE.md` currently marks "The diegetic birth (Epoch 0) — RETIRED". When EI lands, that section is
UN-retired: rewritten to describe Epoch 0 as the live emergence opening (saga-substrate, real copy),
not a historical artifact.

## Visuals (EI-7 / EI-8 — designed here, built after the opening exists)

- **EI-7 portrait text-wrap:** the SceneReader prose FLOWS alongside the portrait then continues DOWN
  BELOW it (CSS `shape-outside`/float wrap), not portrait-block-then-text-block. Mobile-first; READ a
  screenshot to confirm the wrap.
- **EI-8 GenAI portrait matrix:** portraits are an ESTABLISHED part of the game ([[visual-layer-revival]]
  — not a reversal). The demand matrix is **LIFE-STAGE (infant/child/youth/adult/elder — cycles recur
  every generation) × ERA (300+ yrs, not 3 coarse bands) × ARCHETYPE/PATH WARDROBE (religious vestments /
  celebrity / cult leader / CEO / crime / …, scaled by rung) × ENCOUNTER role**. Generate-on-demand +
  cache by a composite key (`portrait:<lifeStage>:<eraBand>:<archetype>:<rungTier>[:<encounterRole>]`);
  never blanket-generate (the matrix is large). Use the EXISTING GenAI image/video pipeline; NEVER
  hand-drawn SVG figure art (the crayon-portrait violation). Determinism: assets keyed so a seed
  reproduces the same portrait reference; generation is offline/cached, not at sim runtime (sim purity
  holds, per [[visual-layer-revival]]).

  **Art-ban precision (user, 2026-06-23):** the only banned thing is hand-drawn SVG *figures* (crayon
  sketches). **Shaders are NOT banned** — a shader is a shader; the existing ShaderBackdrop (a gorgeous
  atmospheric shader) STAYS, it is not "procedural art to retire." Portraits = GenAI raster; backdrops/
  atmosphere may use shaders + CSS; the hard no is hand-drawn SVG people.

## EI-8 — the portrait-demand MATRIX (enumeration, grounded in the real sim enums)

The current pipeline (`src/sim/genai/portrait.ts`) keys a portrait on **generation × gender** only
(`portraitKey(act, gender) → spine_g{gen}_{gender}`) with a 4-band `ERA_VISUAL` (the macro-acts). EI-8
generalizes that to the full demand matrix below. Each axis is enumerated against the actual code so the
key space is finite and cacheable.

### Axis 1 — LIFE-STAGE (5)
The birth→growth→death cycle recurs every generation, so a portrait is keyed on where in a life the
subject is, NOT just "the gen's adult":
`infant` · `child` · `youth` · `adult` · `elder`.
(The Epoch-0 emergence walks infant→child→youth→adult for the progenitor; later generations re-enter the
cycle. Encounter characters carry their own life-stage.)

### Axis 2 — ERA BAND (8, fine — NOT the 4 macro-acts)
The line runs 1776→the stars; "a child in 1790 ≠ a child in 1990 ≠ a child among the stars," so the
visual register is sub-banded finer than `MacroAct`. Bands (period dress + setting cue), derived from the
saga clock year:
`founding_1700s` (1776–1799) · `federal_1800s` (1800–1859) · `industrial_late1800s` (1860–1899) ·
`early_1900s` (1900–1939) · `midcentury` (1940–1979) · `digital_modern` (1980–2040) ·
`near_future` (2041–2200) · `stellar` (2201+).
A pure `eraBandForYear(year)` resolver (sibling of `macroActForYear`) maps the year → band; `ERA_VISUAL`
grows from 4 → 8 entries.

### Axis 3 — ARCHETYPE / PATH WARDROBE (7) × RUNG TIER (3)
The portrait reflects WHO the line has become. Archetype is the existing union
(`src/sim/slots.ts` ARCHETYPES: economic, political, technological, religious, entertainment, athletic)
**plus `crime`** (the planned 7th power axis — [[crime-power-axis]]; cult-leader reads as a religious-path
extreme at high rung). Each archetype has a WARDROBE register that scales by **rung tier** (the 4 rank
ladders are 6 rungs each → collapse to 3 tiers: `low` 0–1, `mid` 2–3, `high` 4–5):
- economic → tradesman → merchant → magnate/CEO
- political → ward heeler → official → statesman/ruler
- technological → apprentice → engineer → visionary-industrialist
- religious → lay devout → ordained → prelate/cult-leader (vestments deepen with rung)
- entertainment → busker → performer → celebrity/icon (celebrity dress at high rung)
- athletic → striver → competitor → champion
- crime → corner soldier → made operator → boss/"crime planet" sovereign

So wardrobe = `f(archetype, rungTier)` — 7 × 3 = 21 wardrobe registers.

### Axis 5 — PRESENTATION MEDIUM (era × station) — user, 2026-06-23
The portrait is not just a face — it is an ARTIFACT of its time and station: how that society, at that
class, would actually have *captured and kept* this person's likeness. The MEDIUM and framing track era ×
rung, NOT a single locked engraving for all. The user's examples set the shape:
- a **miner seeking fortune** keeps a cheap, worn **tintype / hand-tinted carte-de-visite** of his wife
  back home — a humble, creased keepsake, not a commissioned work;
- a **Gilded-Age robber baron** commissions a **gilt-framed oil painting** or a formal **studio cabinet
  card** — the medium itself is a statement of wealth.

So presentation = `f(eraBand, rungTier)` — the real historical object:
- founding_1700s: low → a rough graphite/charcoal sketch or crude woodcut; high → a fine intaglio engraving
  or a small oil miniature.
- federal_1800s: low → a silhouette / cut-paper profile; high → an oil portrait in a gilt frame.
- industrial_late1800s (Gilded Age): low → a worn tintype / carte-de-visite (a fortune-seeker's keepsake);
  mid → a sepia cabinet card; high → a commissioned gilt-framed oil / formal studio cabinet card.
- early_1900s: low → a plain black-and-white snapshot; high → a formal studio photograph.
- midcentury: low → a square Polaroid / ID photo; high → a color studio portrait.
- digital_modern: low → a phone snapshot; high → a polished corporate headshot.
- near_future: low → a utilitarian scan/ID capture; mid → a volumetric capture; high → **a RARE physical
  hand-painted oil on canvas** (scarcity inversion, below).
- stellar: low → a worn archival hologram-still; mid → a holographic capture; high → **an extravagantly RARE
  physical oil painting, hand-made** — the ultimate dynastic flex (scarcity inversion).

**SCARCITY INVERSION (user, 2026-06-23).** In a post-scarcity DIGITAL future, captures are abundant and
free — so the medium hierarchy INVERTS: a *physical* oil painting on real canvas becomes RARE, and rarity
is the whole point. At the extreme high tier of near_future + stellar, the presentation flips back to a
hand-painted physical oil — the Gilded-Age robber-baron oil returning, now an even more extreme status
symbol *because* in a copy-everything age the one thing that cannot be copied is a singular physical
artifact. Low/mid stay digital/holographic (the abundant default); only the apex commissions the physical
thing. This scarcity theme is worth carrying into the STORIES too, not just the visual medium — the
post-scarcity era's drama is about what stays scarce (singular artifacts, real presence, an authentic line)
when everything else is abundant.

COHESION is preserved NOT by a single medium but by a shared framing wrapper — every asset reads as "an
aged artifact in a dynastic chronicle": muted/limited palette, a restrained gold-ochre + oxblood accent,
plate/keepsake framing, gentle age. The MEDIUM varies (the era+station signal); the chronicle wrapper holds
the gallery together. A pure `presentationFor(eraBand, rungTier)` returns the medium descriptor; the
composite prompt folds it in alongside the era register + wardrobe (replacing the blanket engraving lock).

### Axis 4 — ENCOUNTER ROLE (optional)
Storyline figures met across the 300+ years (first friend, betrayer, partner, rival head, mentor, …) get
their own era/age-appropriate portrait. Encounter portraits reuse axes 1–2 (their life-stage + the
encounter's era band) but carry a `role` token instead of the line's archetype/rung, so they read as
distinct people, not the protagonist.

### Composite key + caching
`portrait:<lifeStage>:<eraBand>:<archetype>:<rungTier>` for the line's own portraits, and
`portrait:enc:<role>:<lifeStage>:<eraBand>` for encounter figures. Gender folds in as a suffix
(`:m`/`:f`) where it applies. The full protagonist key space is 5 × 8 × 7 × 3 × 2 = **1680** — far too many
to blanket-generate, so generation is **on-demand + cached**: the runner asks for a key, the cache serves a
hit or triggers ONE generation, writes the asset under the key, and serves it thereafter. Offline/cached —
never at sim runtime (sim purity holds). Deterministic: the same (key) → the same prompt → a stable asset,
so a seed reproduces the same portrait references.

### Build sub-steps that follow (surfaced by this enumeration)
1. `eraBandForYear` resolver + the 8-entry `ERA_VISUAL` (replaces the 4-band map).
2. `lifeStage` + `rungTier` derivations (pure, from sim state).
3. `wardrobeFor(archetype, rungTier)` register table (21 entries) + crime archetype wiring.
4. `buildPortraitPrompt`/`portraitKey` generalized to the composite key; encounter-role variant.
5. An on-demand generate+cache layer keyed by composite key (no blanket gen).
6. Wire the SceneReader/PlayScreen portrait lookup to derive the key from the live (year, lifeStage,
   archetype, rung, encounter) instead of `spine_g{gen}_{gender}`.

## Build order (the EI queue)

EI-1 (this spec) → EI-2 sense→place resolver → EI-3 glowing-inline opening (the EI Act-1 spine, rendered
via SceneReader) → EI-4 formative beats (first friend/betrayal/loss/romance/schooling) → EI-5 naming
in-fiction → EI-6 retire the funnel + wire foundByComposition + update e2e → EI-7 portrait wrap → EI-8
portrait matrix. Each ships behind the gate (check/typecheck/test/test:browser/test:e2e — e2e REQUIRED
since the entry flow changes).
