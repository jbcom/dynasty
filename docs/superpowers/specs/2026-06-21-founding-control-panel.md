---
title: Founding Control Panel & Diegetic Epoch-0
updated: 2026-06-21
status: draft
domain: product
---

# Founding Control Panel & Diegetic Epoch-0

The next unit after the "found your own dynasty" build shipped (PR #28). The user's
direction: replace the current linear 3-step founding (moment picker → surname →
begin) with an **organic control panel that unfolds**, and then let **Epoch 0**
build the line out **diegetically** — finding a partner, choosing a calling that
refines the family for generations, and so on.

## Decisions (user, 2026-06-21)

1. **Replace** the current 3-step flow. The control panel IS the founding UI;
   `foundDynasty` stays the pure engine seam underneath. No second founding path.
2. **Calling = trait + trope bias.** A calling (Merchant, Scholar, Soldier,
   Cleric, …) is a durable generational lens layered on the archetype: it biases
   the family's inherited traits over generations AND weights which tropes/events
   surface. Not a one-time stat package.
3. **Gender identity drives naming + succession + content.** The progenitor's
   gender (and identity choice) sets the onomastic name pool, the succession rule
   (matriarch-led lines, the matriarch-regency trope), and gates/colors content.
   A real sim input, not cosmetic.

## Structural decision — orthogonal fabrics, not conflated buckets (user, 2026-06-21)

The current model CONFLATES dimensions into single labels:
- `culture` "wasp_east_coast" / "scots_irish" smush together ETHNICITY (→ names),
  PLACE (east coast), and CLASS/sociology into one bucket.
- `place` (world-stacks) separately carries geography + politics + religion +
  ideology.

The user wants these as **orthogonal, combinable fabrics**:
- **PLACE** = a real origination OR immigration-DESTINATION location, geographic
  only: Canada, West Coast, American Midwest, American South, East Coast, Ireland,
  Bavaria, South Africa, Baghdad, … (a line MIGRATES between places; the place
  supplies geography/economy + which thematic stacks apply there-and-then).
- **CULTURE / ethnicity** = the naming + heritage lane (Irish-Catholic, Scots-Irish,
  Bavarian-German, Arab, …), decoupled from place — an Irish-Catholic line can be
  in Boston, Chicago, or stay in Ireland.
- **THEMATIC LAYERS** (already separate timelines: religion, mores/sociology,
  ideology, science/technology) are the FABRIC that combines per (place × era ×
  the line's own choices) — NOT baked into the culture label. "WASP" is really
  {Anglo-Protestant culture} × {East-Coast place} × {establishment sociology} —
  three axes, authored separately and woven.

→ Refactor: split `culture` into a pure ethnic-naming `culture` (onomastics only)
  and let PLACE + the thematic stacks carry the rest. Add the missing places
  (Canada, Midwest, South) as proper geography. A start-moment becomes a
  (place, culture, era) tuple plus the Epoch-0 thematic choices below.

## FAITH (and the other axes) as Epoch-0 choices (user, 2026-06-21)

Adopting or REJECTING a faith is a high-impact Epoch-0 decision whose weight
depends on TIME and PLACE (converting in 762 Baghdad, or rejecting the Church in
1847 Catholic Ireland, or finding revival in the 1830 Burned-over District, all
land very differently). Religion is therefore a LIVE axis the player chooses
into/out of at founding — not a fixed culture property. The same shape applies to
the other thematic layers (ideology, sociology, the calling's technological bent):
Epoch-0 offers axis-defining choices whose consequences are place-and-time-scaled
and ripple for generations. This is the diegetic Epoch-0 build-out, made concrete:
faith, partner, calling, and ideological leaning are the founding axis-setters.

## PIVOT — diegetic BitLife-style birth, not a config panel (user, 2026-06-21)

The explicit control panel (carousel → name → gender toggle → calling → axes) is
superseded by a fully DIEGETIC Epoch-0. New Game drops you straight into your own
BIRTH, and you DISCOVER your circumstances through sensory + social cues instead of
configuring them on a form. Think BitLife: you're born into a situation and live
forward.

- **Emergence as event 1:** "You emerge kicking and screaming into the… actually,
  you're not sure. It feels like —" then a 6-slot sensory choice that INFERS the
  place/culture: "desert heat and distant shouts from a market stall" (→ Baghdad),
  "fish and salt air off a grey harbour" (→ Ireland/coast), "woodsmoke and prairie
  wind" (→ midwest), etc. The chosen sense resolves the start-moment / place /
  culture under the hood.
- **Gender discovered, not toggled:** "You hear your parents exclaiming their —"
  → "son" / "daughter" (and a third, more ambiguous option for identity range).
  This sets the progenitor gender diegetically.
- **Name bestowed in-fiction:** the parents name you (seeded suggestion from the
  resolved culture; the player can accept or rename) — the naming modal becomes a
  birth beat, not a form field.
- **Calling + the four axes become LIVED Epoch-0 choices**, not picker screens:
  as the child grows, beats present the calling (what the child gravitates to) and
  the faith/ideology/sociology/tech stances as moments, each place-and-time-scaled.
- **6-slot compressed events:** a new authored style — a 2-line story + up to 6
  terse choices — so a birth/emergence beat can offer six sensory or social
  options without a wall of text. EventSchema already allows ≥1 choices (no cap),
  so 6 is supported; author these as compact events.
- **No abstract identity nouns in player-facing text:** never "ev_donald_is_born"
  / Donald — it's "the next generation of the economic line" / the founded family's
  own name. (The internal preset event ids that still say `ev_donald_*` are legacy;
  player-facing copy must read in the founded line's own terms.)

This pivot REPLACES the CP-7 panel as the founding surface; CP-1..CP-6 sim layers
(place/culture, callings, gender, axes, partner, save) stay — they're now fed by
the diegetic birth sequence instead of a form. Re-sequenced as CP-7r below.

### Locked pivot decisions (user, 2026-06-21)

- **Origin = PLACE × ERA composed independently** (not a fixed start-moment). The
  birth's sensory cue resolves PLACE; a following time/era beat resolves ERA;
  culture follows from place (default) but can diverge. So foundDynasty generalizes
  from `{momentId}` to a composed `{place, era, culture, gender, …}`; the existing
  start-moments become seed material / a place's default era + culture, not the only
  entry. Every offered (place × era) must resolve to a valid founded run + an opener.
- **Replace the panel** entirely. New Game → the birth/emergence event sequence
  driven by the normal event engine + 6-slot events; calling + the four axes are
  lived Epoch-0 beats, not picker screens. The CP-7 panel UI is retired.

### CP-7r build (replaces CP-7's panel)

- **CP-7r-a foundByComposition (sim):** generalize foundDynasty to accept a composed
  origin `{place, era, culture, gender, surname?, calling?, axisChoices?}`; derive
  birthYear from the era; pick culture default from place. Keep `momentId` as a thin
  convenience that expands to a composition. Save carries the composition. Tests +
  replay parity.
- **CP-7r-b place/era resolution data:** a `places` catalog (sensory cue → place)
  + per-place valid era windows + default culture, so the birth can compose any
  offered (place × era). Cross-ref: every composition resolves to a world-stack +
  onomastics culture + a real era.
- **CP-7r-c the diegetic birth event sequence:** authored 6-slot emergence events
  (sensory → place, "son/daughter/other" → gender, name bestowal) + the era beat,
  as ordinary engine events flagged epoch0/birth, gated to run first. New Game drops
  straight in.
- **CP-7r-d retire the panel UI:** TitleScreen → title (New Game · Load · Settings)
  only; New Game starts the birth sequence. Remove the carousel/name/calling/axes
  panel screens + their tests; the birth runs in PlayScreen via the event engine.
- **CP-7r-e player-facing copy:** no internal identity nouns (Donald, ev_donald_*)
  in shown text — the founded line is named in its own terms ("the next generation
  of the line").

## CP-R1 — dissolving the literal protagonist layer (decision, 2026-06-20)

Reassessed-order step 1 (see directive §REASSESSED ORDER). The user: "ev_donald_is_born
not 'next generation of the economic family'… get rid of fallbacks, absorb everything
instead of wasting, rename and repurpose all stuff like Donald." Map (from the literal-layer
audit): 9 literal-person event ids, ~197 literal-name occurrences, 4 literal fallbacks in
code/data, 3 dynasty-mutuality flags, family-tree literal names.

**Root cause of the visible bug.** The `{given_name}`/`{full_name}`/`{surname}`/`{family_name}`
token system already exists and is partly adopted in content — but `applyTerms` resolves them
from the STATIC branch terms table (default "Donald"/"Trump"), never from the run's founded
line. So a founded Irish-Catholic or Abbasid line still renders "Donald Trump". The protagonist's
real identity now lives on the live family tree (`family.protagonistId` member's given name) +
`founding.surname`, not on a branch-keyed term.

**Decision — four atomic parts, load-bearing first:**
1. **Wire the founded line into term resolution.** Resolve `given_name`/`surname`/`full_name`/
   `family_name` from the run's `founding` + `family` protagonist, overriding the static branch
   terms. PlayScreen/LegacyReport build the per-run terms via a single `runTerms(content, state)`
   seam. REMOVE the literal fallbacks (`?? "Donald"`, `?? "Trump"`, `PATRIARCH_GIVEN="Friedrich"`).
   Since every run is founded under the diegetic model, terms.json's `given_name`/`surname`/
   `full_name`/`family_name` literal defaults are deleted (institutional terms stay branch-keyed).
2. **Rename the 3 `ev_donald_*` protagonist-birth ids** → generic founded-line ids
   (`ev_protagonist_*`), updating the 8 test references + any slot/butterfly refs.
3. **Tokenize literal protagonist-line strings** in era/timeline content (the "Trump"/"Donald"/
   "Friedrich"/"Fred" that name the PLAYER'S line) → tokens; keep place-specific biography
   (Kallstadt, barber, Eider) as bavaria-origin content (it only applies to a Bavarian-German
   founding), not shown to other lines.
4. **Rival houses stay world-context.** Kennedy/Musk `ev_musk_*` etc. are rival/world actors,
   NOT the protagonist — they keep proper-noun framing as world-timeline events the butterfly
   engine threads; only the PROTAGONIST identity is dissolved into the founded line. This is the
   "tons of different timelines to weave together" the user wants — rival dynasties as backdrop.

Why this order: wiring (1) makes every already-tokenized string in content immediately render the
founded name, which is the bulk of the fix; (2)/(3) clean the remaining literals; (4) preserves
the rival-house content as the weave material instead of deleting it ("absorb, don't waste").

## UX flow (the control panel) — SUPERSEDED by the diegetic birth above

```
TITLE ─New Game→ CONTROL PANEL (unfolds organically)
  │
  ├─ 1. MOMENT CAROUSEL  — swipe ←/→ through the start-moments (real time+place);
  │      each card shows label, place·year, scene, archetype, deep-history badge.
  │      Tap a card → it expands / the panel advances.
  │
  ├─ 2. NAMING MODAL (fade-in) — patriarch/matriarch:
  │      • surname (the line's name)
  │      • given name (seeded suggestion from the moment's culture, re-rollable,
  │        or hand-entered)
  │      • GENDER IDENTITY choice (drives name pool + succession + pronouns)
  │
  ├─ 3. CALLING — choose the founding calling (trait+trope lens). Shows how it
  │      tilts the family (e.g. Scholar → +cunning/+piety drift, surfaces
  │      prophet/centrist-to-zealot tropes).
  │
  └─→ EPOCH 0 (diegetic build-out) — the founding scene plays; then the early
       beats are the line's first life decisions: finding a PARTNER (who shapes
       the next generation's traits + an in-law line), the first child, the early
       calling-colored events. The "control panel" dissolves into play.
```

The panel should feel like one continuous surface that reveals the next facet as
each is chosen (carousel → name → identity → calling → play), not a wizard of
discrete full screens.

## Locked decisions (user, 2026-06-21)

- **Identity = PLACE × CULTURE × thematic axes** (full split, recommended option).
  Places are geography-only and include immigration destinations (add Canada,
  American Midwest, American South alongside East/West Coast). Culture is
  ethnic-naming only. Conflated labels (`wasp_east_coast`, `scots_irish` as a
  place-ish bucket) are decomposed into {culture} × {place} × {sociology stack}.
- **All four thematic axes are explicit Epoch-0 choices**: FAITH (adopt/reject/
  convert), IDEOLOGY, SOCIOLOGY (mores stance), and TECHNOLOGICAL BENT — each
  place-and-time-scaled (weight read from that place×era's stack), each rippling
  for generations via flags + trope/trait bias.

## Build plan (CP-1 … CP-9)

- **CP-1 Decouple identity: PLACE × CULTURE × axes (sim+data).** Split the
  conflated `culture` into pure ethnic-naming `culture` + geography-only `place`.
  Add places: canada, midwest, american_south (+ keep east_coast/west_coast/
  ireland/bavaria/south_africa/baghdad). Author the missing world-stacks. Decompose
  `wasp_east_coast` → an Anglo-Protestant culture × east_coast place. Re-point
  start-moments to (place, culture). Cross-ref + tests; every existing run still
  founds + plays.
- **CP-2 Calling system (sim):** `Calling` data type (trait-drift vector + trope
  weights) + callings.json + pure resolver applied in `beget` (trait drift) and
  `effectiveWeight` (trope weights). Catalog-cross-ref'd. Tests.
- **CP-3 Gender/identity in the sim:** generalize `progenitorSex` to an identity
  that selects the onomastic pool, sets succession mode (primogeniture /
  matriarchal / absolute), and exposes pronouns for `{token}` interpolation. Wire
  into foundDynasty + succession. Tests.
- **CP-4 Thematic axes as Epoch-0 choices (sim+data):** a pure `AxisChoice` model
  for FAITH / IDEOLOGY / SOCIOLOGY / TECH, each resolved against the founding
  place×era stack so its weight is place-and-time-scaled; sets durable flags +
  trope/trait bias. Faith adopt/reject/convert is the exemplar. Tests prove the
  same choice lands differently by place/era.
- **CP-5 Partner mechanic (Epoch 0):** an early beat — the protagonist takes a
  partner (a new in-law LiveMember whose traits feed the next `beget` + a
  dynastic-merger trope hook). Pure + seeded. Tests.
- **CP-6 foundDynasty + save extend:** foundDynasty accepts {moment/place,
  culture, surname, given, gender, calling, axisChoices}; save format carries them;
  replay reconstructs. Tests.
- **CP-7 Control-panel UI:** swipeable moment carousel → naming modal (name +
  gender identity) → calling picker → Epoch-0 axis choices (faith/ideology/…) →
  partner beat → play. Replaces the current 3-screen founding. Screenshot-verify;
  browser tests.
- **CP-8 Content pass:** author the Epoch-0 axis-choice events + partner beats per
  place/era (lean on the Gemini toolkit for breadth); branch-density still passes.
- **CP-9 DoD:** full gate + AH6/persona/founded-longrun sweeps over the new model +
  live-verify the whole panel → Epoch-0 flow per a modern line AND the
  deep-history line; PR; reviewer trio; squash-merge; directive → RELEASED.

## Constraints carried forward

- Determinism is load-bearing: every new sim input (calling, gender, partner)
  flows through the seed + history; partner/trait draws use `rng.fork(label)` with
  reconstructable labels. Replay must stay bit-identical.
- The calling's trope weighting layers on the existing `effectiveWeight` bias
  (branch + personality), it does not replace it.
- `foundDynasty` remains the single pure entry the UI calls; the control panel only
  gathers inputs (moment, surname, given, gender, calling) and hands them to it.
