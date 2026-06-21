---
title: Convergence Saga — the dynasty-as-novel redesign
updated: 2026-06-21
status: draft
domain: creative
---

# Convergence Saga — Dynasty redesign

A foundational redesign of Dynasty (maga-money-moves). Supersedes the breadth/"hour-long
depth via generated events" framing. The game becomes a **choose-your-own-adventure NOVEL of
a single bloodline**, told one intimate life at a time. **It is the story of America**: each
starting line is a distinct **wave of immigration to America** (defined by WHEN it came, WHAT
class it arrived as, its culture, and what pushed it out), spanning the founding era to the
modern day. All waves **converge in America** — landing, stratifying, intersecting — and the
surviving dynasties then climb toward (or fail to reach) the **colonization of the stars**.

This doc is the canonical design. It is intentionally an architecture + creative spec, not an
implementation plan (that follows via writing-plans).

## 1. Governing principles (non-negotiable)

1. **One person, always.** Every act is told from the intimate, human-interest perspective of
   ONE person. The camera never widens to a strategy chronicle — not even at interstellar scale.
   What broadens across generations is that person's **importance to the world** and their reach
   as a **change-agent**: a gen-1 choice moves a family; a late-gen choice moves a civilization;
   both are still one person's story (their fears, their family, their one life). **The FINAL act
   is still one person** — a single descendant looking back at their family, drawing on the whole
   lineage, as they seek out among the stars. By the endgame you are effectively reading
   **first-person hard sci-fi**: the intimate voice of one human at the frontier carrying the
   bloodline's weight. The original game's mistake was DEPERSONALIZATION (the late game went
   abstract/world-historical); the corrective is that intimacy and single-person POV NEVER break,
   only the genre register changes.
2. **Importance EMERGES.** Early acts are small and personal; the line's weight in the world
   compounds heir to heir. A humble line may stay small for many generations — that is its story.
3. **Grounding by motivators.** The ability to shape the future has grounding: 8 motivator axes
   that drift across generations AND gate what futures are reachable.
4. **Convergence, not snowflakes.** Endings are shared convergence states (grounded on
   colonizing the stars), reached by different motivator-paths and colored by the line's
   dominant biases — not unique per place. The storylines are HOW you converge.
5. **A living world.** Every place/line you do NOT play grows its own family in parallel as a
   GOAP agent — opposing, contributing, or neutral forces you glimpse and may cross.
6. **Spine authored, flesh generated.** Humans author the structural spine (goals, act lattice,
   convergence states) + the circulatory system (which motivator-shifts route where); GenAI
   weaves the prose flesh per-act onto those bones. One corpus — no authored-vs-generated split.
7. **Determinism preserved.** All sim logic stays pure: RNG only via `createRng(seed)`, no
   `Math.random`/`Date.now`/`performance.now` in `src/sim/**`; save = seed + history; replay is
   bit-identical. (Yuka's goal core is pure + JSON-serializable and fits this; its steering
   examples are NOT used in the sim.)

## 2. The 8 Motivators (the grounding layer)

Each motivator is a signed axis (a lean–centrist–lean triad), stored per line and drifting each
generation:

| Motivator | − pole | + pole |
|---|---|---|
| Wealth | poor | rich |
| Politics | left | right |
| Worldview | faith | science |
| Power | community | power |
| Tradition↔Progress | tradition | progress |
| Honor↔Cunning | honor | cunning |
| Self↔Lineage | self | lineage |
| Insular↔Expansive | insular | expansive |

- **Drift:** an heir inherits the parent's profile, then each life's choices nudge the axes. The
  profile is the line's evolving *character*.
- **Gate:** the current profile gates which act-branches and futures are reachable, and
  determines how each cross-cutting EPOCH impacts the line (a Tradition line suffers the tech
  epochs; a Progress line rides them). A line cannot reach a future its biases don't support —
  that is the grounding.
- These replace/absorb the fragmented existing axes (personality ideology/grandiosity/outward/
  inward + axes.json Faith/Ideology/Society/The-New). Migration handled in the plan.

## 3. The engine: every dynasty is a GOAP agent (Yuka)

One uniform model for ALL lines (yours + every other dynasty). Each line is a **GOAP agent** with
a Yuka `Think` brain.

- **Library:** `yuka@0.7.8` (ESM `build/yuka.module.js`) + `@types/yuka@0.7.4`. We use ONLY the
  goal core (`Goal`, `CompositeGoal`, `Think`, `GoalEvaluator`) — pure, no RNG/time, with
  built-in `toJSON`/`fromJSON`/`registerType`. We never import Yuka steering into `src/sim`.
- **`Think.arbitrate()`** picks the highest-`calculateDesirability() × characterBias` evaluator
  as the current goal, then executes subgoals each step. This runs for every line each turn —
  cheap, deterministic, serializable.
- **Mapping:**
  - **Motivators → `characterBias`** on each evaluator (an empire evaluator is weighted up for a
    Power+Cunning line).
  - **Archetype/trope → the evaluator/goal SET** a line is built from.
  - **Epoch-0 SEEDS the brain.** Playing birth→calling sets the starting motivators + which
    evaluators are active ("Epoch-0 seeds the choices that determine the GOAP engine going
    forward"). Unplayed lines have their Epoch-0 resolved by the planner, not a player.
  - **Epochs** are world-state inputs every `calculateDesirability` reads.
  - **Your line** is the only one that surfaces choice-points to the player; arbitration is
    otherwise identical. (At a player choice point, the player picks among the goals the brain
    deems desirable — agency within grounding.)
- **Where seeded RNG is needed** (e.g. resolving an unplayed line's choice, a stochastic
  outcome), inject `createRng(seed)`-derived values — never Yuka/Math.random.

### Determinism + the living world
Each turn: advance the player's act, then `arbitrate()`+step every other line's brain, storing
each line's compact state (motivators, tier, position, resources, alive). Stored progress = the
others as forces. Two lines' states aligning (place/tier/tech/epoch) produces opposing/
contributing/neutral pressure; that is when an intersection scene is generated (§5).

## 4. Structure: three macro-acts, and acts = generations = one life

### 4.0 The three macro-acts (the saga spine)
The whole bloodline saga moves through three macro-phases — this is "the story of America":
- **I. CONVERGENCE — the 1800s.** The waves of immigration arrive and converge in America. EVERY
  starting line begins here: a specific 1800s wave (era + class + culture + push) crossing to and
  landing in America, where the classes stratify and the lines become entangled.
- **II. EMERGENCE — the 1900s.** Post-convergence, the lines stratify, rise, intersect, and
  collide across the American century; a line's importance EMERGES generation by generation.
- **III. ASCENSION — the 2000s+.** The surviving dynasties climb toward (or fail to reach) the
  colonization of the stars.

A bloodline's many per-generation acts (§4.1) flow through these three macro-phases. Because
CONVERGENCE is gated to the 1800s, **a starting line must be an 1800s immigration wave** (see §7:
this is why the 1990s South-African-evacuation line is dropped — it would belong in Ascension, not
Convergence). Early-wave lines (founding-era) have MANY generations before the stars; later-1800s
waves have fewer — a deliberate asymmetry that still lets importance emerge.

### 4.1 Per-generation acts
- **One Act = one generation = one person's life**, lived from the seeded birth (the existing
  Epoch-0: overhear-your-year → name → station → schooling → calling) through the choices of
  that life to death. Death closes the act; the next act opens on the heir (motivators inherited
  with drift; the GOAP brain carries forward).
- Each act has a **title** (the novel's chapter heading) and sits within one of the three
  macro-acts by its year.
- **Change-agent reach tiers** widen the *consequence* of choices across generations (the POV
  stays intimate at all tiers):
  - T1 Personal — affects self/family; other dynasties are distant rumor.
  - T2 Local — touches town/city; first faint crossings.
  - T3 National — a regional power; alliances/rivalries with other lines are real.
  - T4 Global — a world player; epochs are theirs to ride or be crushed by.
  - T5 Interstellar — a descendant with the leverage to reach the stars.
- A line advances tiers only by GOAP success (gated by motivators). Staying low-tier for many
  generations is a valid, authored story — not a failure.
- **Genre register gradient (POV stays first-person-intimate throughout):** the prose register
  shifts with the era/tier even as the camera stays tight on one person — e.g. rain-soaked
  realism in an Act-I Irish tenancy → industrial/urban drama → 20th-c. world-historical-but-still-
  personal → and a **first-person hard-sci-fi** final act (a descendant at the stellar frontier
  looking back at the lineage). The GenAI flesh-generation prompt is told the register for the
  act's tier+era; the harness/textQuality gate keeps it in-voice and leak-free.

## 5. Spine + flesh (authoring model)

- **Spine (authored by humans):** the goal/evaluator structure per archetype/trope; the act
  lattice (per-tier act templates + branch/convergence points); the motivator→branch routing
  (the "circulatory system"); the convergence/ending states.
- **Flesh (generated by GenAI):** the act prose — scenes, choices, outcomes — generated per act,
  on demand, seeded by the line's state (motivators, tier, place, epoch, and any intersecting
  line). Intersection scenes (glimpses/clashes/alliances) are generated when two lines align.
- **One corpus.** No `.gen.json` shadow. Generated prose is validated through the same harness
  gate (0 leaks / 0 findings) and persisted into the canonical content. The old events-only
  `genai:breadth` is reworked into this spine-driven, per-act generator.

## 6. Convergence + endings

- All lines move toward **colonizing the stars**. Endings are **shared convergence states**, not
  per-place — reached by different motivator-paths and colored by the dominant motivator:
  - **Stars reached** — variants by HOW (Power/Cunning conquest among the stars; Faith carried
    outward; Science/Progress ascendancy as equals; Community commons). Same destination,
    different color.
  - **Contributed to / absorbed by** another line's ascent (convergence WITH the others).
  - **Earthbound** — endured but never left the cradle (quiet legacy or twilight).
  - **Extinguished** — failed/fell at some tier (ruin, extinction, no heir).
- **The other lines' fates are part of YOUR ending** (you reached the stars first / with the
  Bavarians / after the Pacific line beat you there).
- **Ending count: ~16-20** (paper-playtest call). The lattice = ~4 destinations × ~3 motivator
  colorings (≈12 base) PLUS sub-variants (e.g. Conquest benevolent vs. tyrant; first-contact
  friendly vs. hostile at the stars). Base destinations + colorings:
  - **Stars reached** — Conquest (Power/Cunning), Covenant (Faith), Ascendancy (Science/Progress),
    Commonwealth (Community); each with benevolent/dark sub-variants where it fits.
  - **Contributed/absorbed** — ally-of-the-victors / absorbed into another line's ascent.
  - **Earthbound** — quiet legacy / twilight.
  - **Extinguished** — ruin / the line that failed (no heir).
  Prioritize authoring the **extremes** (pure-pole star ascents + hard failures) and the
  **middle** (the balanced line's quiet-vs-great) first; sub-variants fill in.

## 7. Starting lines = 1800s immigration waves (roster, grounded in history)

Historical grounding (researched 2026-06-21, US-immigration-overview): scholarship frames US
immigration in four epochs — Colonial (1700s: English, Scots-Irish/Ulster, Germans, Huguenots;
~½ indentured), Mid-19th-c (1840s-60s: Famine Irish + Germans), the "Second Great Wave" (1880-1920:
Southern & Eastern Europeans — Italian, Slavic, Jewish; European peak 1907), and Post-1965. A
starting line must be an **1800s wave** (Convergence macro-act, §4.0) — the colonial wave (deep
backstory) and the mid-19th-c + early-Second-Wave (still-1800s arrivals) qualify.

**The window (user decision): mid-1800s → late-1800s (~1845-1900).** Drop pre-1800s/colonial
(too early — breaks the tight convergence + early-intersection goal) and the wrong-macro-act
modern waves. This band is tight enough that all lines overlap in America by ~1900, enabling
EARLY macro-intersections of the family lines.

**Final source-wave roster (7), grounded in the real waves:**
| Wave | Arrival | Class | Faith | Push | Lands |
|---|---|---|---|---|---|
| Famine Irish | ~1845-55 | poor tenant | Catholic | starvation/eviction | NE port |
| German '48ers | ~1848-80 | skilled middle | mixed | failed 1848 revolutions | city/Midwest |
| Chinese | ~1850-80 | poor laborer | — | Gold Rush/rail; Taiping | Pacific |
| Scandinavian | ~1860-90 | farmer | Lutheran | land hunger | Midwest |
| Italian | ~1880-1900 | poor laborer | Catholic | mezzogiorno poverty | NE/cities |
| E-European Jewish | ~1881-1900 | artisan/trader | Jewish | pogroms | NE cities |
| Arab/Levantine | ~1880-1900 | merchant | mixed | Ottoman decline | (re-founded "baghdad") |

- **DROP for good:** colonial Ulster-Scots/Anglo deep-line (pre-1800s); **south_africa** (its
  white-SA evacuation is a ~1990s/Ascension-era wave, not an 1800s Convergence wave — its
  frontier-squeeze/Calvinist texture may be mined as flesh later, but it is not a starting line).
- **KEEP as DESTINATION GROUNDS (not lines):** the current east_coast / american_midwest /
  american_south / west_coast / canada become the grounds where waves LAND + STRATIFY (NE port =
  arrival + old-money gentry already here; the South; grain Midwest; Pacific West). Their authored
  content becomes destination-ground flesh + the gentry/old-stock layer.
- **RESHAPE baghdad** → the 1880-1900 Arab/Levantine merchant wave (same `arabic_abbasid` pool,
  Epoch-0 re-generated).
- **ireland → Famine-Irish wave; bavaria → German-'48er wave** (the existing Epoch-0s adapt).
### 7.1 Onboarding funnel + class as TRAJECTORY (not a static tier)
- **Onboarding: pick TIME PERIOD → pick CLASS → resolves to a race/culture + migration wave.**
  The 7 waves cluster into chronological period×class groups; a (period, class) selection maps to
  the historically-true wave for that cell (poor + mid-1840s → Famine Irish; middle + 1880s →
  E-European Jewish or Arab/Levantine; etc.).
- **You START poor or middle** (an immigrant wave, in the Convergence/1800s macro-act).
- **UPPER CLASS is EMERGENCE, not a starting pick.** It is what you ACHIEVE by the Emergence
  (1900s) macro-act. The default arc is: arrive poor/middle → by Emergence you've established the
  line as comfortably middle or upper class. ("Upper = already-here Anglo gentry you found as" is
  REJECTED — upper is EARNED, gated by motivators, not granted at the font.)
- **Staying/falling poor has two sources:** (a) a deliberate CHOICE — an austere / rebellious /
  communist / otherwise intentionally-poor path, gated by motivators (Community / anti-Wealth /
  Self↔Lineage); and (b) ACCIDENTAL MISFORTUNE — a **misfortune tract** per line where bad luck at
  points of WAR, DISEASE, FINANCIAL COLLAPSE (and other shocks) derails the climb regardless of
  intent. The misfortune tract is the EPOCHS doing cross-cutting work: the same war/plague/crash
  that lifts one line ruins another; how hard it lands is gated by motivators + SEEDED luck
  (`createRng` — deterministic yet unpredictable to the player). This makes the climb earned and
  FRAGILE (do everything right, still fall to a flu or a panic) — the human-interest "a life
  lived" texture — and feeds the ruin / line-failed / no-heir failure endings.
- So class trajectory has **three drivers: intent, motivator-gating, and accidental misfortune.**
  Class MOBILITY across the macro-acts is the spine of the game; the Wealth motivator drives it.

### 7.2 Class as a movable RUNG (mechanics for falling + recovering)
Because each line has authored class STORYLINES (a poor track, a middle track, an upper track),
class is not a fixed label — it's a **rung position on a ladder the line moves both directions on**,
and each rung's authored track is content the line can be ROUTED into mid-saga.
- **Rung index** (poor → middle → upper, extended by the Emergence/Ascension tiers). The line's
  current rung selects which class-track beats are eligible.
- **Misfortune drops you DOWN one or more rungs, temporarily** (a panic wipes the middle-class
  doctor's capital → the family LIVES THE POOR TRACK for a generation or two), then **recovery
  climbs back up.** Same climb machinery, run in reverse — and it **REUSES the existing class-track
  content** (no bespoke "you fell" corpus; you re-enter the lower rung's authored track).
- Drop/recover is gated by motivators + seeded luck (`createRng`), same as the misfortune tract.
- **Hysteresis (the mark it leaves):** a fallen-then-recovered line is NOT identical to one that
  never fell — the experience leaves a durable flag / motivator drift (e.g. "knew hunger once" →
  nudges Community / Self↔Lineage / anti-Wealth), so the recovered line's later beats remember it.
- DETAILED MECHANICS (resolve in the plan): exact rung model, how far a shock can drop you, the
  recovery conditions, how rung-routing interacts with the per-generation act boundaries, and how
  GOAP evaluators read the current rung.
- **Class strata coexist + entangle** in a shared ground from the start (the gentry already there
  owns the land the poor wave works) — but the gentry are the WORLD/other-lines, and your line
  climbs INTO that tier (or refuses to) rather than starting in it.
- **Multiple waves per period×class → a 3rd race/culture pick** (decided: "all of it, no
  deferrals"). Onboarding is a 3-step funnel: Period → Class → (Race/Culture, when >1 wave fits
  the cell). All 7 waves are playable. Cells with a single wave skip the 3rd step.

**Other scope changes:**
- **Place-gating fix (staged, branch `fix/place-gate-nyc-origins`):** the NYC/German-immigrant
  origins content was leaking into every line (an Irish boy got Prohibition bootlegging + American
  gospel). Under this model that content becomes east_coast DESTINATION-GROUND flesh; the gating
  fix folds in here, not shipped standalone.
- **Existing 591 events / 45 endings:** mined as spine raw-material + flesh seeds, not kept as-is.
  The authored Epoch-0 (OB milestone, v0.7.0) is PRESERVED — it becomes the GOAP-seeding step.
- **Personality/axes** consolidated into the 8 motivators.

## 8. Resolved decisions + remaining open questions

RESOLVED in this design (paper-playtest, 2026-06-21):
- **Three macro-acts** (Convergence 1800s / Emergence 1900s / Ascension 2000s+) — §4.0. This
  settles the acts↔epochs coupling: per-generation acts are the lives; the macro-acts + epochs are
  the cross-cutting world-time the lives flow through.
- **Roster:** 7 mid-to-late-1800s immigration waves; SA + colonial deep-line dropped — §7.
- **Endings:** ~16-20 (destinations × motivator colorings × sub-variants) — §6.
- **8 motivators**, drift + gate — §2. **Engine:** Yuka GOAP per line, Epoch-0 seeds — §3.

OPEN (resolve in the implementation plan):
- GenAI per-act generation cost/latency vs. pre-generation + caching strategy.
- Migration: v0.7.0 saves likely a clean break (pre-release private game) — confirm.
- The exact convergence lattice (which motivator-paths reach which ending) — draft as a table.
- The merged "frontier" destination-ground details + which dropped places' beats are mined where.
- Whether to ship a vertical slice first (1-2 waves end-to-end) before the full 7.

## 9. Acceptance (how we know it's right)

- A playthrough is ONE bloodline across generations, each act an intimate life, importance
  emerging; reads as a novel, not a control panel.
- Other lines visibly advance (glimpses), act as forces, and appear in the ending.
- Motivators demonstrably gate reachable futures (a Tradition/Faith/Community line CANNOT reach a
  Cunning-conquest stars ending; it reaches its own convergence).
- An hour+ per playthrough, carried by personal depth + emergent scope, not padding.
- Determinism holds: same seed + same choices → bit-identical replay (incl. all other lines).
- 0 preset-person leaks; harness audit 0 findings; full gate green.
