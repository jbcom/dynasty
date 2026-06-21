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

## UX flow (the control panel)

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
