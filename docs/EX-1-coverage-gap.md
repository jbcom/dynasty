---
title: EX-1 — place × era × archetype coverage gap matrix
updated: 2026-06-21
status: current
domain: creative
---

# EX-1 — coverage gap matrix (1000-year expansion)

The authoring-priority map for the expansion milestone, derived from the harness +
content. Drives EX-2 (per-place life-arc), EX-3 (athletic/entertainment depth), EX-4
(GenAI breadth), EX-5 (the millennium run).

## Per-era event density (current)

Healthy across the chain — totals 18–51 events/era. Because ~most events are
archetype-AGNOSTIC, every archetype already sees nearly the full pool per era, so a
founded line of ANY of the six archetypes has a rich arc today:

| era | total | per-archetype reach |
|---|--:|---|
| caliphate | 18 | all 6 ≈ 18 |
| origins | 51 | 45–48 |
| boyhood | 37 | 36–37 |
| mogul | 50 | 47–50 |
| brand | 48 | 43–48 |
| primetime | 44 | 36–44 (entertainment richest) |
| ascent | 47 | 47 |
| interregnum | 40 | 40 |
| victory | 32 | 32 |
| atomic | 30 | 30 |
| unification | 32 | 32 |
| redplanet | 42 | 42 |
| firstcontact | 25 | 25 |
| interstellar | 27 | 27 |

**Takeaway:** archetype reach is NOT the primary gap (the dissolution made content
broadly playable). Archetype-LOCKED depth is thin only for athletic/entertainment
locked beats (EX-3), but agnostic events keep those runs full.

## The real gap — PLACE coverage

All life-arc content currently lives under three content dirs: `new-york` (origins→
victory), `baghdad` (caliphate), `_shared` (the future arc). Every non-baghdad place
maps `eraContentDir=new-york`, so a founding in ireland / bavaria / south_africa /
west_coast / east_coast / canada / american_midwest / american_south plays the
new-york arc — coherent and 0-leak (it's all tokenized/generic), but NOT
place-distinct.

**EX-2 fork targets (8 places sharing the new-york arc):** ireland, bavaria,
south_africa, west_coast, east_coast, canada, american_midwest, american_south.
Each should grow its own period content under `eras/<place>/<period>/` so a Bavarian
boyhood ≠ an Irish one. baghdad already has its own dir.

## Priority order

1. **EX-2** — per-place life-arc breadth (the 8 fork targets), starting with the
   places most distinct from new-york (ireland, bavaria, baghdad-modern).
2. **EX-3** — athletic + entertainment LOCKED depth to parity (density target: match
   the other archetypes' locked-event counts per era).
3. **EX-4** — GenAI breadth toolkit to generate the above at scale, gated through the
   harness (0 leaks, branch-density, chronology).
4. **EX-5** — verify a ~1000-year run is rich + non-repeating via the dev overlay +
   a harness long-run audit.

Every cell added must keep the harness audit at **0 findings**.
