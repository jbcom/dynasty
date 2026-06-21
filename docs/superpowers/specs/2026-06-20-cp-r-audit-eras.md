---
title: CP-R-AUDIT — era events by power archetype
updated: 2026-06-20
status: current
domain: creative
---

# CP-R-AUDIT: era events → power-archetype map

Input to CP-R-ARCH (the archetype-tagging pass). Audit of the 519 events across the
14 era files under `src/data/eras/<place>/<period>/events.json`. Classifies each era
by which of the 6 power archetypes (economic | political | technological | religious |
entertainment | athletic) its events serve, to drive the `archetypes: [...]` tagging.

## Per-era archetype breakdown (event counts)

| Era | econ | pol | tech | relig | entmt | athl | dominant |
|---|--:|--:|--:|--:|--:|--:|---|
| new-york/origins | 24 | 9 | 31 | 4 | 4 | 0 | technological |
| new-york/boyhood | 19 | 7 | 18 | 1 | 6 | 2 | economic |
| new-york/mogul | 38 | 9 | 21 | 0 | 24 | 3 | economic+entertainment |
| new-york/brand | 34 | 13 | 23 | 0 | 27 | 0 | economic+entertainment |
| new-york/primetime | 23 | 15 | 26 | 2 | 31 | 1 | entertainment |
| new-york/ascent | 12 | 37 | 35 | 1 | 12 | 1 | political |
| new-york/interregnum | 9 | 31 | 26 | 1 | 7 | 0 | political |
| new-york/victory | 15 | 6 | 19 | 0 | 6 | 1 | technological |
| _shared/atomic | 12 | 2 | 20 | 0 | 1 | 1 | technological |
| _shared/unification | 13 | 4 | 17 | 1 | 0 | 0 | technological |
| _shared/redplanet | 14 | 1 | 38 | 4 | 10 | 0 | technological |
| _shared/firstcontact | 7 | 1 | 21 | 2 | 5 | 0 | technological |
| _shared/interstellar | 7 | 4 | 17 | 1 | 4 | 0 | technological |
| baghdad/caliphate | 13 | 0 | 5 | 1 | 1 | 0 | economic |

(Counts overlap — many events serve multiple archetypes; ~49% are multi-archetype,
~36% archetype-agnostic, ~25% locked to one.)

## Carving targets for the two NEW archetypes

### entertainment — 138 events (re-taggable, NOT greenfield)
Concentrated in primetime (31), brand (27), mogul (24). Branding/TV/celebrity/
spectacle/media beats. These get `archetypes` including "entertainment" (often
alongside "economic" where a brand deal is both). Sample ids: `ev_taj_mahal_opening`,
`ev_apprentice_premiere`, `ev_reality_megastar`, `ev_licensing_empire`,
`ev_trump_consumer_goods` (now `{surname}` consumer goods), `ev_escalator_announcement`.

### athletic — 9 events, GREENFIELD (1.7% of pool, zero in 5 eras)
Only ~6 true core sports events exist: `ev_nyma_baseball_star`, `ev_usfl_generals`
(sports-franchise ownership), `ev_marry_ivana` (athlete spouse — marginal),
`ev_celebrity_apprentice` (athlete contestants — marginal). Athletic is effectively a
greenfield archetype: re-tagging yields almost nothing, so an athletic-run needs
AUTHORED content (CP-R6 breadth). Tag the ~6 real ones; flag the rest as to-author.

## Archetype-agnostic core (~36%, fire for ANY line)

Births, deaths, marriages, family feuds, scandals, war, disaster, succession. These
get NO `archetypes` field (absent = agnostic) — the common case. Do NOT over-tag;
only tag events that are genuinely power-base-specific. This keeps every founded line
playable even before per-archetype breadth exists.

## Tagging strategy (CP-R-ARCH)

1. Leave agnostic events untagged (absent `archetypes` = fires for all). ~36%.
2. Tag locked events with their single archetype (~25%).
3. Tag multi-base events with all that fit (~49%) — e.g. a casino-brand event =
   `["economic","entertainment"]`.
4. The entertainment slice is real (138); the athletic slice is greenfield (~6) and
   flags CP-R6 as the place to author athletic-dynasty content.
5. The eligibility gate (`ownedByOtherArchetype` in events.ts) already honors the
   `archetypes` field + the legacy `archetype:` tag — tagging immediately takes effect.
