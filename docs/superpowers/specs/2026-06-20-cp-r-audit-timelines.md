---
title: CP-R-AUDIT — timeline bespoke-content re-slotting map
updated: 2026-06-20
status: current
domain: creative
---

# CP-R-AUDIT: timeline branch → condition map

Input to CP-R-ARCH. Audit of `src/data/timelines/*.json` (34 files: 10 base + 24
branch variants + kennedy/musk person timelines). Goal: NO literal-bespoke branch
file survives — each variant re-expressed as generic content gated by
`place × time × condition (flag and/or archetype)`. (Note: timelines are SCOPE-based
world-context, separate from the place/period EVENT eras of CP-R-ERA; this audit
covers the timeline layer. A sibling audit covers the era events.)

## Branch → condition mapping

| Branch | Condition gate | Place scope | Time window | Archetype(s) | Anchor flags already in events |
|--------|---|---|---|---|---|
| nazi | `flag:axis_ascendant` | usa, world | 1918–2300 | political, technological, religious | `reich_ascendant`, `ww1_us_stays_out`, `germany_stronger_1918` |
| theocracy | `flag:theocracy_proof_of_concept` | usa, world | 1885–2300 | religious, political, technological | `dominion_theology_seeds`, `council_of_christian_citizens`, `evolution_banned_schools` |
| media | `archetype:entertainment` + `flag:pleasure_king_origin` | usa, world | 1885–2310 | entertainment, political, technological | `vice_mainstreamed`, `outrage_economy` |
| megachurch | `flag:dynasty_nonprofit_architecture` | usa, world | 1885–2300 | religious, economic, technological | `parachurch_corporation_model`, `televangelism_born`, `healing_economy` |
| oligarchy | `flag:corporate_state` | usa, world | 1885–2311 | economic, political, technological | `antitrust_nullified`, `capital_consolidation`, `trusts_ascendant` |
| westcoast | `place:westcoast` (geographic, not ideological) | westcoast | 1869–2293 | technological, economic, entertainment | `ca_progressive_tradition`, `silicon_valley_born` |

## Person-centric timelines → DISSOLVE

- **kennedy.json** (26 events, 1888–2300): Irish-outsider → bootlegger fortune →
  political dynasty → curse → RFK Jr neoreactionary pivot. Protagonist biography,
  not world-context. Re-slot into base usa/eastcoast as generic political-dynasty
  events gated by `flag:bootlegger_fortune`, `flag:political_dynasty_active`,
  `flag:kennedy_curse_begins` (rename → generic), `place:eastcoast`. Archetype:
  political (+ economic). The protagonist version dissolves into the founded line;
  any rival-house residue stays as world-context backdrop.
- **musk.json** (37 events, 1971–2037): SA-apartheid child → PayPal → SpaceX →
  Tesla → Mars. Protagonist biography. Re-slot into base westcoast/science gated by
  `flag:musk_paypal_exit` → generic tech-billionaire/Mars beats; `place:westcoast`.
  Archetype: technological (+ economic). As a RIVAL to a non-tech founded line, the
  Musk figure stays world-context (the protagonist's tech rival), per CP-R1 part 4.

## World-context persons that STAY literal (legitimate backdrop)

science.json (Edison, Einstein, Jobs), usa.json (Carnegie, Rockefeller, Nixon),
manhattan.json (Rockefeller, Ford), the nazi/world WW2 leaders (Hitler, Churchill,
Stalin) — these are historical FORCES in systemic events, not dynasties. Keep.

## Proposed post-audit structure

34 → ~10 base timelines + a `conditions.json` reference; each event carries
`requires: {flags?, place?, timeWindow?}` and the pool includes/excludes by the run's
state. A single `usa.json` then renders 6 alternate world-states by condition.

## Execution note (CP-R-ARCH)

The branch→condition flags above mostly EXIST in the events' own `requires`/`setFlags`
already — the merge is largely mechanical: concatenate each scope's variant files into
the base, ensuring every variant event carries its anchor flag in `requires.flags` so
it only fires in that world-state. Validate event-id uniqueness on merge. The
`worldTimelines` loader + `timelinesForBranch` selection must shift from branch-keyed
FILES to flag-conditioned EVENTS (compose with `meetsRequires`).
