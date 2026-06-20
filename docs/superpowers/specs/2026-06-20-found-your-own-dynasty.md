---
title: Found-Your-Own-Dynasty — Generational Sim, Historical Origins, Family-Tree Mechanics
updated: 2026-06-20
status: current
domain: product
---

# Found-Your-Own-Dynasty

> Supersedes the dynasty-as-fixed-house model. The composite-archetype spec
> (`2026-06-20-four-composite-dynasties.md`) is folded in: the four archetypes
> survive as **optional quick-start presets** on this engine, not as the only
> way to play. The FamilyTreeSchema + the four authored trees built in DD-1 are
> reused as preset seeds + the data-model foundation.

## 0. Mandate (user, 2026-06-20)

> "Freed from the constraints of the cartoon portraits AND real names — go through
> everything, fully slot everything, free of the constraints of real names. Go
> all the way back to the Irish Famine, the German migration from Bavaria, South
> African post-apartheid, etc. Really build full family trees and add geographical
> + political + religious + sociological/ideological JSON stacks for not just a
> few places but Ireland, the UK, South Africa, Canada, both coasts… real full
> journeys.
>
> Take this in a REALLY interesting direction: instead of choosing a dynasty you
> CHOOSE YOUR NAME and WHEN and WHERE you start. Recast Stage 0 — since the reign
> is the bespoke JSON storyline built for a SEED + STAGE 0, really commit to that.
> Store common matronyms/patronyms etc. Let the player build their own family
> tree starting by selecting a specific point in time at a historically important
> moment (the Irish Famine, etc.). They BUILD their own dynasty, and choices made
> during the reign RESULT IN the birth of one or more children. Add family-tree
> mechanics, birth & death mechanics, inheritance mechanics, estate planning —
> the PLAYER decides choices reacting to dynastic events."

Decisions confirmed:
- **Player-built dynasty is PRIMARY.** Choose name + when + where → found and
  steer your own multi-generational line. The 4 archetypes = optional presets.
- **Player-named; real history/places kept.** The player names their family; real
  events/places/figures (Famine, apartheid, Bavarian emigration) remain the named
  world backdrop the family moves through.
- **Spec the full vision now; build incrementally** with review per phase.

## 1. The core loop (new)

```
NEW GAME
  → STAGE 0: FOUND YOUR LINE
      pick STARTING MOMENT  (a historically pivotal time+place, e.g.
        "Ireland, 1847 — the Great Hunger"; "Bavaria, 1885 — emigration";
        "South Africa, 1994 — the end of apartheid"; "California, 1849 — Gold Rush")
      pick FAMILY NAME       (player types it; system suggests period+culture-
        accurate names via the onomastic stack — patronymics/matronymics)
      pick PROGENITOR        (given name + a few starting traits/leanings)
  → THE REIGN (bespoke compiled storyline for SEED + STAGE-0)
      live the progenitor's life as pivotal choices; some choices BEGET CHILDREN.
      the family tree GROWS during play.
  → SUCCESSION
      the protagonist ages and DIES; an heir is chosen (inheritance + estate
      planning decisions); play continues AS the heir — the dynasty spans
      generations until the line fails or reaches the far-future endgame.
```

Stage 0 is no longer "pick 1 of 4 houses"; it is **founding a line at a real
historical hinge**. The existing compile-at-0 engine (seed + Era-0 flags → one
bespoke timeline) is the perfect substrate — we commit to it fully: the
starting-moment choice + family name + progenitor traits become the Stage-0 flag
set the compiler builds the run from.

## 1b. ONE UNIFIED EVENT POOL — real + fictional, the timeline is composed (user)

> "Would it make MORE sense to turn the timelines into EVENTS, slotted and biased
> and weighted? … let the flow of decisions build a coherent timeline from a
> combination of real and fictional events." — yes. FULL MERGE.

Today there are two parallel systems: `eras/*.json` events (the protagonist's
life — slotted/biased/weighted, player-chosen) and `timelines/*.json`
world-timelines (dated backdrop facts that merely BROADCAST FLAGS). For a
player-founded line moving through history this split is wrong. **Collapse them
into ONE event pool.**

- Every event gains **`historicity`: `real` | `extrapolated` | `personal`**
  (real history · plausible future-extrapolation · the family's private life) and
  the existing **place/time/branch/personality bias + weight** (the chaos field).
- **Real historical events are REACTABLE** — they present choices (how your family
  responds to the Famine / Black Monday / apartheid's end) via the same EventCard.
  History is the SETTING; the player's reaction is the play. (Minor real events
  may still flow past in the news ticker, tagged ambient — but the default is
  reactable.)
- The **compiler weaves real + fictional** into the bespoke run: an event surfaces
  when the run's place + year + state make it likely (bias/weight), so the *flow
  of decisions* composes a coherent timeline — real events anchor it, fictional/
  personal events fill it, all from one pool.
- **Migration:** the 24 `timelines/<scope>.<branch>.json` files convert into
  unified events (historicity=real|extrapolated, place/era bias carried over,
  their old setFlags preserved, plus authored choices for the reactable ones).
  The world-timeline linking protocol (flag broadcast on year advance) is
  retired in favor of normal event resolution. The `WorldTimeline` schema +
  `worldtime.ts` linking are removed once migration is complete.

This unification is the SUBSTRATE the start-moments (§2), world stacks (§3), and
birth/inheritance events (§5) all ride on, so it lands EARLY (phase FD-2 below).

## 2. Starting moments (the historical hinges)

A new `src/data/origins/start-moments.json` — each a pivotal time+place a line can
be founded at, with the geo/ideology stack it activates and the migration arcs it
opens. Initial set (expandable):

| id | place / year | the hinge | opens |
|----|--------------|-----------|-------|
| `irish_famine` | Ireland, 1847 | the Great Hunger; coffin ships | emigration → Boston/Liverpool/Canada; political-machine arc |
| `bavaria_emigration` | Kallstadt, 1885 | conscription + opportunity | emigration → NYC/Klondike; commercial arc |
| `cape_colony` | South Africa, 1906 | aviation + colonial frontier | apartheid-era capital; tech/engineering arc |
| `apartheid_end` | South Africa, 1994 | Mandela, transition | emigration → US/Canada; modern tech arc |
| `gold_rush` | California, 1849 | the Rush | West-Coast founding; vice/media or mining arc |
| `gilded_age_ny` | New York, 1880 | robber-baron era | East-Coast finance/real-estate arc |
| `second_great_awakening` | American frontier, 1830 | revival camp meetings | the religious arc (the Graham/Roberts spine fictionalized) |

Each start-moment references the **places** it can route through (§3) and seeds the
appropriate archetype-leaning flags WITHOUT locking the player to an archetype.

## 3. Geo / political / religious / sociological-ideological JSON stacks

New `src/data/world/` directory with per-place stacks. Each PLACE
(`ireland`, `uk`, `south_africa`, `canada`, `east_coast`, `west_coast`, plus the
existing usa/world scopes generalized) gets layered stacks so a family's JOURNEY
through places picks up real, period-accurate context:

```
src/data/world/
  places.json                 # canonical place defs (id, region, era-range)
  geography/<place>.json       # terrain, ports, migration routes, economy base
  politics/<place>.<era>.json  # governing order, franchise, machine/patronage
  religion/<place>.<era>.json  # dominant faith(s), tolerance, revival pressure
  ideology/<place>.<era>.json  # class structure, mores, mobility, prejudice axes
```

These generalize the existing `timelines/<scope>.<branch>.json` world-timelines:
the world-timeline linking protocol already broadcasts dated world events into the
run; the stacks add the STANDING context (not just dated events) a family
experiences in a place at a time. A migration arc = moving the run's `place` flag,
which swaps which stacks apply (Irish-Catholic-in-Ireland → Irish-Catholic-
immigrant-in-Boston: different politics/ideology stack, same religion).

## 4. Onomastics — names, patronyms, matronyms

New `src/data/onomastics.json`: per-culture name pools + naming conventions, so
the player's chosen surname + the system-generated given names are period- and
culture-accurate, and children are named by the culture's convention:

```jsonc
{
  "cultures": {
    "irish_catholic": {
      "given_male": ["Patrick","Seamus","Brendan", ...],
      "given_female": ["Bridget","Mary","Siobhan", ...],
      "convention": "patronymic_christian_name",   // eldest son named for grandfather
      "naming_rules": { "eldest_son": "paternal_grandfather", "eldest_daughter": "maternal_grandmother" }
    },
    "bavarian_german": { ... "convention": "patronymic", ... },
    "afrikaner": { ... },
    "scots_irish": { ... },
    "wasp_east_coast": { ... }
  }
}
```

The naming_rules drive the dynasty's given-name resolution (generalizing the
existing AH8c/d Friedrich-III logic): a firstborn heir inherits the progenitor's
name per the culture's convention. The composite presets reuse this (the Graham
preset = scots_irish culture, etc.).

## 5. Family-tree mechanics (the generational sim)

Builds on the DD-1 `FamilyTreeSchema` — but the tree is now MUTABLE STATE that
GROWS during play, not just authored data. GameState gains a `family` field:

```ts
interface FamilyState {
  members: Record<string, LiveMember>;   // id -> live member (alive/dead, age, traits)
  protagonistId: string;                  // who the player currently IS
  progenitorId: string;
  generation: number;
}
interface LiveMember {
  id: string; name: string; born: number; died?: number;
  parentIds: string[]; childIds: string[]; spouseId?: string;
  traits: Partial<Record<PersonalityAxis, number>>;  // inherited + shaped
  role: FamilyMemberRole; alive: boolean;
}
```

### 5.1 BIRTH mechanics
Certain reign choices (marriage, "start a family", "secure an heir") and certain
dynastic events BEGET CHILDREN: a pure, seeded `beget(state, rng)` adds a child
member to the tree, named via the onomastic convention, with traits sampled from
the parents' personality vectors (heritability + variance). Determinism: all RNG
via `rng.fork`, so replay reconstructs the same children.

### 5.2 DEATH mechanics
Members age each in-world year (the systemic tick already advances years). Death
is a seeded hazard rising with age + modulated by health/heat/era medicine. When
the PROTAGONIST dies → SUCCESSION (§5.4). Non-protagonist deaths fire dynastic
events ("your brother dies", feeding the accidental-heir archetype already modeled).

### 5.3 INHERITANCE + ESTATE PLANNING
While alive, the protagonist makes estate decisions: name an heir (eldest /
favored / most-capable), split vs. primogeniture, settle rivalries, dowries,
trusts vs. direct transfer. These set flags that resolve at death: who inherits
the meters/markets/ranks/capital, how much leaks to rivals, whether the line
fragments. The existing rank ladders + markets carry forward to the heir
(possibly with an inheritance tax / dissipation per estate choices).

### 5.4 SUCCESSION
On protagonist death: resolve the estate plan → select the heir → the player
CONTINUES as that heir (a new "reign" within the same compiled saga), inheriting
the family tree, capital, branch, and standing. The dynasty spans generations
until: the line fails (no heir), an ending fires, or the far-future endgame.

## 6. Archetypes as presets

The 4 composites (economic/political/technological/religious + their authored
family-trees from DD-1) become **quick-start presets**: a preset pre-fills the
Stage-0 founding (start-moment + culture + a progenitor template + a leaning
toward that archetype's ladder/branches), then the player plays the same
found-your-own engine. "Custom" is the default; presets are shortcuts.

## 7. Portraits → gone (already done); reclaimed space → the family tree

Portraits were removed (prior unit). The reclaimed space + a "Lineage" view (DD-5
in the prior plan, now expanded) render the GROWING family tree: progenitor →
the living protagonist → children/heirs, with birth/death years, the succession
line highlighted, branch tilts shown. This becomes a core screen, not a flourish.

## 8. Implementation phases (serial, solo — no agent swarm)

- **FD-1 FamilyTreeSchema + 4 preset trees** — DONE: schema + cross-ref
  validation in content.ts; economic/political/technological/religious trees.
- **FD-2 UNIFIED EVENT POOL (§1b)** — add `historicity` (real|extrapolated|
  personal) + ensure place/era bias on EventSchema; migrate the 24 world-timeline
  files into unified events (real/extrapolated, bias + setFlags preserved,
  reactable choices authored for the hinges); retire WorldTimeline +
  worldtime.ts linking; the compiler/selection weaves one pool. This is the
  SUBSTRATE for everything after, so it lands first. Determinism + sweep tests
  stay green through the migration. (Large; may sub-phase per scope group.)
- **FD-3 Onomastics + naming-convention resolution** — onomastics.json + a pure
  resolver (generalizes AH8c/d); tests per culture.
- **FD-4 Start-moments + the new Stage-0 "found your line" flow** —
  start-moments.json; the founding UI (pick moment + name + progenitor); Stage-0
  flags feed the compiler. Presets kept as shortcuts. [USER CHECK-IN: # of moments.]
- **FD-5 World stacks** — src/data/world/ geo/politics/religion/ideology per place
  (Ireland, UK, South Africa, Canada, both coasts); STANDING context applied by
  the run's current place; migration = place change. Schema + load + tests.
- **FD-6 Family-tree STATE + BIRTH mechanics** — FamilyState in GameState; pure
  seeded beget(); choices/events that spawn children; replay-determinism tests.
- **FD-7 DEATH + AGING** — per-year seeded mortality hazard; non-protagonist
  death events; tests.
- **FD-8 INHERITANCE + ESTATE + SUCCESSION** — estate-planning choices; heir
  selection; the protagonist-handoff at death; carry-forward of capital/ladders/
  branch; line-failure ending; multi-generation replay tests.
- **FD-9 LINEAGE VIEW** — the growing family-tree screen; luxury-styled, real-2D,
  no portraits; screenshot-verify.
- **FD-10 DoD** — full gate + sweeps (AH6 + persona) over generational runs +
  app live-verified (found a line at the Famine, beget an heir, die, succeed);
  PRs squash-merged; directive → RELEASED.

Each phase is its own PR. FD-1 landed; FD-2 (the unified event pool) is the
keystone substrate and is next.

## 9. Self-review

- Placeholders: none — every phase has concrete artifacts + a data shape.
- Consistency: the core loop (§1) is the spine; §2-§7 are its subsystems; §8
  phases map 1:1 to them. The compile-at-0 engine + world-timeline linking +
  rank ladders + the removed-portraits space are all REUSED, not replaced.
- Scope: very large — explicitly phased FD-1..FD-9, each reviewable, built
  serially. No agent swarm (see [[agent-swarm-discipline]]).
- Determinism risk (the big one): births/deaths/inheritance MUST be pure +
  seeded (rng.fork) so saves stay seed+history and replay reconstructs the whole
  multi-generation tree to the bit. This is called out in FD-5/6/7 and gated by
  replay tests. The sim-purity ban patterns (no Math.random in src/sim) already
  enforce the discipline.
- Open question for the user at FD-3 boundary: how many start-moments to ship
  first (the table in §2 is the candidate set; could start with 3-4).
