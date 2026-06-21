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

## 1c. DYNASTIC TROPES AS INFLUENCES — dissolve the literal lines (user)

> "It's actually simpler to just completely refactor the existing lines like Trump,
> Kennedy etc as DYNASTIC TROPE INFLUENCES. That way we reuse the most meat out of
> everything written while allowing real plus extrapolated well into the future."
> "We should be RIPPING OUT FLIP MECHANICS — this game is about how a dynasty
> reacts and builds each new generation."

The four real families STOP being literal protagonists/houses. They become
**TROPES** — reusable archetypal dynastic patterns that ANY player-founded family
can express:

**TROPE CATALOG (the reusable archetypal patterns — the gap-check answer).**
The 4 spine tropes (from the existing lines):
- the **accidental heir** (fourth child inherits because the firstborn falls — Trump/JFK)
- **bootlegger-to-legitimacy** (vice fortune laundered into respectability — Kennedy/Joseph Sr.)
- the **frontier / emerald / colonial-edge capital origin** (Musk/Errol)
- the **centrist-patriarch → zealot-heir pivot** (soft founder, political heir — Graham→Franklin)

The branch/governance tropes (already in content): the **conqueror** (nazi), the
**prophet/theocrat** (theocracy), the **pleasure-king→media mogul** (media), the
**oligarch/plutocrat** (oligarchy), the **techno-frontiersman** (westcoast), the
**prosperity-megachurch builder** (megachurch).

MISSING tropes to ADD (well-attested across real dynasties, high reuse — covers
the DECLINE/SUCCESSION/MERGER space the rise-only set lacks):
- the **dissipating line** (wealth squandered across generations — Vanderbilt/
  Buddenbrooks; the DECLINE arc, the counterweight to every rise)
- the **martyr** (an assassination/early death that SANCTIFIES the line and becomes
  dynastic capital — JFK/RFK)
- the **matriarch-regency** (the widow who holds + rebuilds the line — Rose Kennedy,
  Bridget Murphy, Elizabeth Christ Trump; a member role today, a trope here)
- the **dynastic merger** (two houses fuse by marriage — Fitzgerald+Kennedy)
- the **cadet branch** (a younger son founds a rival sub-dynasty / the line splits)
- the **prodigal heir** (the wild/rebel child who returns to take the mantle —
  Fred Jr.-that-didn't, Franklin's wild youth)
- the **scandal-fall → rehabilitation** (collapse then comeback — Bakker/Swaggart)
- the **exile → return** (a generation forced out, a later one returns — diaspora)
- the **reformer vs reactionary schism** (a generation splits ideologically —
  the Roosevelt two-branch split)
- the **bastard/outside claimant** (a succession crisis from beyond the marriage)

This catalog is the FD-3 authoring target; FD-4/FD-11 generate fill against it.

A trope is `trope:<id>` tags + bias on events, NOT a person. The player's NAMED
family activates tropes through its origin + choices; the same authored content is
reused across any house. **This removes the leak problem at the root**: there is no
"Trump" or "Kennedy" object to drift into — only tropes a line embodies, and your
family stays YOUR family. The **role-flip + kennedy_swap mechanics are DELETED**
(they were the literal-person-swap model + the deepest leak vector). The 4 preset
family trees (FD-1) survive as *trope-flavored quick-starts*, not fixed identities.

Consequence: with no fixed protagonist to "end," the birth + inheritance mechanics
(§5) let a line run **for damn near eternity** — each generation a new heir takes
up the saga.

## 1d. PROCEDURAL POOL — 1000 years × ~100,000 events from a modest authored base (user)

> "Think about how we could use libraries and clever mechanics and algorithms to
> create a much wider pool that can extend 1000 years and 100,000 different events."

Hand-authoring 100k events is impossible. The vast pool is **GENERATED** —
deterministically — by composing a modest authored base across many axes:

```
concrete event  =  TROPE TEMPLATE  ×  PLACE (world-stack)  ×  ERA/YEAR  ×
                   FAMILY MEMBER (from the live tree)  ×  seeded RNG
```

- **Trope templates** (authored, ~hundreds): parameterized event patterns with
  slots — `{member}`, `{place}`, `{year}`, `{rival}`, `{institution}`, `{peril}` —
  e.g. "the {member} faces the {place}-{year} {peril}: flee, profit, or resist."
- **Substitution stacks** (the world stacks §3 + onomastics §4 + the live family
  tree §5) supply period- and place-accurate fillers, so an instantiated event is
  coherent for its time+place+family.
- **Generative grammar / expansion**: a seeded text-grammar expander (a small
  tracery-style library, or a hand-rolled deterministic expander — evaluate
  `tracery`/`chancejs`-class libs vs a purpose-built one; MUST be seedable +
  pure, no Math.random, to keep replay-determinism) turns a template + fillers
  into the event's title/scene/choices.
- **Weighted selection** = the existing chaos field (bias/weight) decides WHICH
  generated candidates surface, so the flow of decisions still composes a coherent
  arc rather than noise.
- **Bounded materialization**: never generate 100k up front. Per turn, the
  selector lazily instantiates only the candidate events viable for the current
  (year, place, family, tropes, state), seeded by `rng.fork(year:place:…)`. The
  100k is the SIZE OF THE REACHABLE SPACE, not a stored list — combinatorics
  (templates × places × eras × members × seeds) make it effectively unbounded,
  while memory stays small.
- **Determinism (load-bearing):** every generation step flows through `rng.fork`
  keyed on stable coordinates (year/place/member/template), so saves stay
  seed+history and replay reconstructs the exact same generated timeline — across
  1000 in-world years. This is the hard constraint the generator is designed
  around and gated by replay tests.

The authored real/extrapolated events (the migrated 1169 + the era events) remain
the **anchors** (fixed historical hinges); the generated events are the **fill**
that makes any year/place/generation rich. Real anchors + procedural fill +
tropes + the family sim = an eternal, bespoke-per-seed dynastic saga.

## 1e. GEMINI EXTRAPOLATION — AI-generated, quality-gated fill (user)

> "Wire google js-genai into the dev libraries… it plays through as one of our
> four dynastic types until it runs out of content, then uses thorough system
> prompting with a Gemini API key to extrapolate additional events/timelines, and
> automatically flesh out gaps where the response felt weaker. It can back-query
> the last 10–25 events, evaluate + quality-check. We go from 40 events per to
> 500 with the right approach." Both DEV-time bulk AND optional RUNTIME live mode.

Two complementary generators fill the pool: the §1d procedural grammar (cheap,
deterministic, combinatorial) and **Gemini** (rich, novel, context-aware). The
Gemini library is `@google/genai` (the unified Gen AI SDK — NOT the deprecated
`@google/generative-ai`); `new GoogleGenAI({})` picks up `GEMINI_API_KEY`;
`ai.models.generateContent({ model, contents, config })` with
`responseMimeType:"application/json"` + `responseJsonSchema` forces schema-valid
output; `systemInstruction` carries the thorough prompt; `tools:[{googleSearch:{}}]`
can ground REAL events. Default model `gemini-3-flash-preview` (bulk),
`gemini-3-pro-preview` (the self-critique/hard passes). Codegen guidance indexed
under "google js-genai codegen instructions".

**WHY BUILD GEMINI FIRST — it's a DEV AI TOOLKIT, not just a content generator
(user).** Once the `@google/genai` dev harness + the game-bible system prompt +
the schema-forced-output plumbing exist, the same toolkit accelerates MANY of the
remaining refactors — so it is built EARLY (FD-11 pulled forward) and reused:
- **gap-fill / extrapolate** events (the headline job; 40 → 500/dynasty).
- **slot-detection**: scan content for places that SHOULD be archetypal slots
  (AH7) but are hard-coded, and propose the slot + per-branch/dynasty resolutions.
- **trope-retagging** (FD-3): classify every authored event with its trope(s) +
  historicity + place, turning the literal-line refactor from hand-work into a
  reviewed AI pass.
- **error-correction / consistency**: find anachronisms, title-leaks, dead flags,
  duplicate ids, chronology breaks, no-shallowness gaps — and propose fixes
  (a richer, generative AH6 sweep).
- **migration assist** (FD-2): author the reactable choices for the 1169 projected
  world-events.
Every such job is a DEV script that PROPOSES changes which are then schema-/guard-
validated + git-reviewed before committing — the human/agent stays in the loop;
Gemini does the heavy lifting. This multiplier is why FD-11 is sequenced first.

### Mode A — DEV-TIME BULK (default; deterministic play)
A repeatable `pnpm extrapolate` script (`scripts/extrapolate.mjs`):
1. **Detect gaps**: drive autoPlaythrough across seeds/dynasties/places; find
   thin (year, place, trope) cells where the pool runs dry or the run dead-ends.
2. **Generate**: prompt Gemini (system prompt = the game bible: tone, the
   historicity/place/trope schema, the EventSchema) to extrapolate events for the
   thin cells, **back-querying the last 10–25 events** as context for coherence.
3. **Self-critique loop** (gemini-3-pro): score each generated event for
   coherence-with-context + tone + schema validity + non-duplication; **regenerate
   the weak ones**; only events that pass commit.
4. **Commit**: schema-validate (zod) + the existing dup-id/chronology/no-shallow
   guards, then WRITE into the JSON content files (40 → ~500 per dynasty). Now
   they are ordinary authored content — **play stays 100% deterministic**; the
   pool grows between releases. Never touches the live game.

### Mode B — RUNTIME LIVE (optional, API-key gated)
When a run exhausts authored+procedural content mid-play, an optional live mode
calls Gemini to generate the next event, schema-validates it, and **persists the
generated event INTO THE SAVE** (so replay re-reads it — the save grows beyond
seed+history in this mode only, behind a clearly-marked "live extrapolation"
toggle that needs the player's own API key). Deterministic replay is preserved
because the generated event is stored, not re-generated. Default OFF.

**API key storage (Capacitor):** the player's Gemini key is stored SECURELY on
device via Capacitor (Preferences / secure storage), never bundled or committed.
This drives a TITLE-SCREEN MENU restructure: **New Game · Load Game · Settings**.
Settings is where the player (a) enters/clears their Gemini API key (secure
store), (b) toggles live extrapolation on/off, (c) other prefs. The existing
seed/founding flow moves under "New Game"; "Load Game" reads the save; "Settings"
is the new third entry. On web (no Capacitor) the key falls back to an in-memory/
localStorage entry with the same UI.

This keeps the determinism invariant intact (Mode A bakes to content; Mode B
persists to save) while making the pool effectively unbounded with HIGH quality
(the self-critique gate), realizing the 40→500-per-dynasty / 1000-year vision.

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

**DEEP-HISTORY / WORLD REACH (user).** The start-moments are NOT US-centric or
modern. Old-money, Asian, European, and Middle-Eastern lines can be founded MUCH
further back — centuries or millennia — opening whole new dynastic forms:
- a **European monarchy** (a medieval noble house climbing toward a crown)
- a **caliphate / Islamic dynasty** (a Middle-Eastern religious-political line)
- a **religious dynasty** rooted in an ancient faith (not just American evangelism)
- **old-money European / Asian merchant or scholar-official houses** (e.g. a
  Florentine banking house, a Chinese scholar-gentry/imperial-examination line, a
  samurai/daimyō house, a Mughal or Ottoman line)
This widens the place/era/onomastic/trope space enormously (new cultures, naming
conventions, governance forms, faiths).

**DECISION — deep-history era ordering (FD-6).** Eras are ONE linear chain keyed
by `order`; the run's STARTING position is set by the chosen start-moment's
`startEra` (the founding flow looks up that era's index — not a hardcoded 0). A
modern line begins at the `origins` era; a deep-history line begins at a
deep-history era placed BEFORE origins via a negative `order` (so it sorts to the
front without renumbering the 13 existing modern eras). A deep-history dynasty
plays its deep era(s) then continues through the SAME universal mid/late eras —
which is exactly the "endures across 1000 years" vision (one chain, different
entry points). `EraSchema.order` is relaxed from nonnegative to any integer to
admit the negative-ordered deep prefix. It is exactly the kind of breadth the
PROCEDURAL POOL (§1d) + GEMINI EXTRAPOLATION (§1e) exist to populate — hand-
authoring a millennium of Mughal court events is infeasible; generating + quality-
gating them is the point. Ship a focused starter set of moments (the table above
+ 1-2 deep-history exemplars), then let extrapolation flesh the long tail.

### §1d.1 DECISION — purpose-built seeded grammar, NOT tracery (FD-4)

The procedural expander is a **purpose-built, pure, seeded grammar** living in
`src/sim/procgen/**`, not a tracery-class string library.

**Why not tracery / its kin:**
- Tracery expands strings via `Math.random` internally — banned in `src/sim/**`
  (the sim-purity gate) and impossible to replay deterministically without
  forking the lib to inject our `Rng`.
- Tracery produces STRINGS; we need to emit fully-structured `GameEvent` objects
  (id, era, year, choices with meter/personality deltas, requires, trope tags) —
  a flat string grammar can't carry that typed structure.
- Slot resolution pulls from TYPED game data (the live family tree, world-stacks,
  onomastics) and must thread the run's `Rng` for determinism — a generic grammar
  has no hook for typed, seeded, context-aware substitution.

**The design:** an `EventTemplate` (data, zod-validated) carries a skeleton event
with `{slot}` tokens in its text + a declared slot list. A pure `expandTemplate(
template, ctx, rng)` resolves each slot via the run context (family tree → member/
rival; world-stacks → place/peril; era → year window; the trope catalog → trope),
draws choices/deltas from the template's authored ranges via `rng.fork(label)`,
and returns a validated `GameEvent`. Materialization is LAZY + BOUNDED: the
selection pool asks the expander for the next event only when the authored pool
thins for the current (era, place, trope) cell, and caps how many it requests, so
a 1000-year run never realizes more than the chaos field needs. Determinism is the
gating invariant: `expandTemplate` is a pure function of `(template, ctx, rng)`,
so the same seed + history reconstructs the same generated events on replay (no
persistence needed — unlike Gemini Mode B, which must store its output).

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

- **FD-1 FamilyTreeSchema + 4 preset trees** — DONE.
- **FD-2 UNIFIED EVENT POOL (§1b)** — IN PROGRESS. 2.1 historicity/place (done);
  2.2 projectWorldEvents projects the 1169 entries → year-keyed reactable events
  with no-leak dynasty tags (done); 2.3 selector weave + retire linking + the
  no-leak gate (next); 2.4 RIP OUT FLIP/SWAP — code layer done (roles.ts deleted),
  data layer (role-flip endings, ev_flip_* events, kennedy_swap) folded into the
  trope refactor (FD-3 below).
- **FD-3 TROPES-AS-INFLUENCES (§1c)** — refactor the literal Trump/Kennedy/Musk/
  Graham lines into `trope:<id>` influences (accidental-heir, bootlegger-to-
  legitimacy, frontier-capital-origin, centrist→zealot, + branch tropes); retag
  the authored events; remove the orphaned flip/swap data + tests; the 4 preset
  trees become trope-flavored quick-starts. No house-leak possible (no person to
  drift into).
- **FD-4 PROCEDURAL POOL (§1d)** — the 100k-events / 1000-years generator: trope
  templates (slots) + the seeded generative-grammar expander (evaluate a small
  tracery-class lib vs purpose-built; MUST be pure/seedable) + lazy bounded
  materialization through the chaos field; substitution from world-stacks +
  onomastics + the live tree. Replay-determinism is the gating constraint.
- **FD-5 Onomastics + naming-convention resolution** — onomastics.json + pure
  resolver (generalizes AH8c/d); per-culture tests. (Feeds FD-4 substitution.)
- **FD-6 Start-moments + the new Stage-0 "found your line" flow** —
  start-moments.json; founding UI (pick moment + name + progenitor) feeding the
  compiler; presets as shortcuts. [USER CHECK-IN: # of moments.]
- **FD-7 World stacks** — src/data/world/ geo/politics/religion/ideology per place
  (Ireland, UK, South Africa, Canada, both coasts); STANDING context by current
  place; migration = place change. (Feeds FD-4 substitution.)
- **FD-8 Family-tree STATE + BIRTH mechanics** — FamilyState in GameState; pure
  seeded beget(); choices/events spawn children; replay-determinism tests.
- **FD-9 DEATH + AGING** — per-year seeded mortality hazard; non-protagonist
  death events; tests.
- **FD-10 INHERITANCE + ESTATE + SUCCESSION** — estate-planning choices; heir
  selection; protagonist-handoff at death; carry-forward of capital/ladders/
  branch; line-failure ending; multi-generation replay tests. (Enables the
  eternal-dynasty loop.)
- **FD-11 GEMINI DEV-BULK EXTRAPOLATION (§1e Mode A)** — add `@google/genai` dev
  dep; `scripts/extrapolate.mjs` (gap-detect → generate w/ last-10–25 context →
  gemini-3-pro self-critique loop → schema+guard validate → commit into JSON).
  **SHIP CRITERION (user): run it out until all four dynasties sustain a full
  1000 YEARS of dynastic rule with no dead-ends / thin years** — that depth is
  the bar to ship. Deterministic play unaffected.
- **FD-12 TITLE MENU + SETTINGS + RUNTIME LIVE (§1e Mode B)** — restructure the
  title into New Game · Load Game · Settings; Settings stores the Gemini key via
  Capacitor secure storage (+ web fallback) and toggles live extrapolation;
  optional runtime generate-on-exhaustion that persists generated events into the
  save (determinism preserved by storage). Default OFF. NOTE (user): with the
  1000-year dev-bulk depth (FD-11), runtime may not be NEEDED — but it ships as
  the optional infinite-tail layer anyway.
- **FD-13 LINEAGE VIEW** — the growing family-tree screen; luxury-styled, real-2D,
  no portraits; screenshot-verify.
- **FD-14 DoD** — full gate + sweeps (AH6 + persona) over multi-generation runs +
  app live-verified (found a line at the Famine → beget heir → die → succeed →
  carry the line forward) + a determinism stress test over a 1000-year run;
  PRs squash-merged; directive → RELEASED.

PR/batch size is NOT a constraint (user: don't split for size; be smart, use
barrel-organized package-like module structure where appropriate, e.g. an
`events/` package barrel for the pool + generator). FD-1 landed; FD-2 in flight;
FD-3 (tropes) + FD-4 (procedural pool) are the conceptual heart.

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
