---
title: Four Composite Power-Archetype Dynasties + Family-Tree System
updated: 2026-06-20
status: current
domain: product
---

# Four Composite Power-Archetype Dynasties + Family-Tree System

## 0. Mandate (user, 2026-06-20)

> "A DEEP and WIDE research task next making sure all dynasties are fully backed
> by a thorough family tree AND the full implementation of the religious dynasty."
>
> "…maybe the best thing would be COMPOSITES for each of the four dynasties:
> POLITICAL, TECHNOLOGICAL, RELIGIOUS, and ECONOMIC."

Decisions confirmed:
- The four dynasties are **composite power-archetypes**, each with a **primary
  real-family spine** but free to **blend other real figures** for depth. Names
  stay recognizable; the house *represents* the archetype.
- Each composite **ties to its rank ladder + native governance branches** — it
  starts advantaged on its own ladder and its branches are its native forms.
- The religious dynasty becomes a **full 4th playable dynasty + carousel house**;
  its megachurch/theocracy branches become its mid/late-game governance forks.
- Family trees: build **a data model AND author lineage from it** (deepest form),
  surfaced in-game.

## 1. The archetype model

Each dynasty embodies one **form of power**, anchored to one of the four rank
ladders that already exist in `src/data/ranks.json` (this alignment was latent in
the system — the ladders practically name the archetypes):

| Archetype | Primary spine | Rank ladder (advantaged) | Native governance branches | Driving meter |
|-----------|---------------|--------------------------|----------------------------|---------------|
| **ECONOMIC** | Trump (Drumpf→Fred→Donald) | `commercial` (amplify money ×1.2) | default · oligarchy · media | money |
| **POLITICAL** | Kennedy (Patrick→PJ→Joseph→JFK/RFK→RFK Jr) | `political` (amplify power ×1.25) | default · nazi | power |
| **TECHNOLOGICAL** | Musk (Walter→Errol→Elon) | a new `scientific` ladder (amplify ?) | westcoast · default | (innovation) |
| **RELIGIOUS** | Graham (W.F.Sr→Billy→Franklin→Will) | `religious` (amplify loyalty ×1.15) | megachurch · theocracy | loyalty |

Note the gap: there is a `social` ladder but no `scientific` one. The
technological archetype currently leans on `commercial`/`social`. DECISION: add a
`scientific` rank ladder for the technological house (rungs: tinkerer → engineer →
founder → architect → singularity-steward) so all four archetypes have a native
ladder. (Deferred to implementation phase 3; the social ladder remains shared.)

### Composite blending — primary spine + secondary real figures

Each composite is the primary family **plus** thematically-aligned real dynasties
woven into its slot pool + backdrop, so the house reads as the *archetype*, not a
biography. Blend sources per archetype (for lineage events, slot resolutions, and
flavor — never as the literal protagonist):

- **ECONOMIC (Trump-primary):** + Rockefeller (Standard Oil → philanthropy →
  Nelson/Jay political arc), Vanderbilt (Gilded-Age rise-and-dissipation),
  Astor (real-estate origin). These give the economic house its "old money vs
  new money," dissipation-of-the-line, and robber-baron→legitimacy threads.
- **POLITICAL (Kennedy-primary):** + Roosevelt (two branches, patrician
  reform), Bush (Prescott→GHW→GW→Jeb, oil→CIA→presidency machine), Adams (the
  original two-president founding dynasty). These give the political house its
  multi-generational office-holding, bootlegger→legitimacy, and assassination/
  martyrdom slot archetypes.
- **TECHNOLOGICAL (Musk-primary):** + Edison/Ford (inventor→industrialist→
  reactionary), Wright-brothers (the aviation-origin Walter already echoes),
  the PayPal-mafia/Thiel network (the modern techno-frontier peer set). These
  give the tech house apartheid-capital origin, first-principles myth, and the
  techno-libertarian→techno-authoritarian tilt.
- **RELIGIOUS (Graham-primary):** + Roberts (Oral→Richard, faith-healing +
  university + the prosperity tilt), Falwell (Jerry Sr→Jr, Moral Majority →
  Liberty University → the political-theocracy pivot + the scandal-fall),
  Robertson (Pat, 700 Club → Christian Coalition → presidential run),
  Bakker/Swaggart (the televangelism→scandal collapse arc), Osteen (the modern
  prosperity-megachurch apex). These give the religious house every pole:
  Billy-style soft-centrist establishment, Falwell/Robertson political-theocracy
  (Gilead pole), Roberts/Osteen prosperity-megachurch, and the
  televangelist-scandal fall.

## 2. Research — the four genealogical spines

### 2.1 ECONOMIC — the Trump spine (already in `eras/origins.json`)
Friedrich Drumpf (b. 1869 Kallstadt, Bavaria; barber's apprentice; emigrates 1885;
Klondike-era fortune; anglicizes to Trump) → Frederick "Fred" Trump (b. 1905;
Elizabeth Trump & Son real estate; NYC outer-borough housing empire) → m. Mary
Anne MacLeod (Scots immigrant) → five children, of whom **Donald** (b. 1946) is
the FOURTH; heir only because firstborn **Fred Jr.** rebelled, became a pilot,
and died 1981 (the accidental-heir dynamic, already modelled by `ev_the_children`).
Next gen: Don Jr., Ivanka, Eric, Tiffany, Barron (heirs — `ev_grooming_heirs`).
**Status: spine present; needs the family-tree DATA model + Rockefeller/Vanderbilt
blend events.**

### 2.2 POLITICAL — the Kennedy spine (in `timelines/kennedy.json` + origins bridge)
Patrick Kennedy (b. 1823 Dunganstown, County Wexford; flees the Famine on a
coffin ship 1848/9; Boston cooper; dies 1858 of cholera) → P.J. Kennedy (b. 1858;
saloon-keeper → ward boss → Massachusetts legislator) → Joseph P. Kennedy Sr.
(b. 1888; Harvard 1912; youngest bank president 1914; bootlegger-era fortune;
SEC chair; ambassador) → the nine children incl. Joe Jr. (the groomed heir, KIA
1944 — the political house's accidental-heir/martyrdom slot), **JFK** (b. 1917,
president, assassinated 1963 — the leader-assassination slot archetype), RFK
(assassinated 1968), Ted → **RFK Jr.** (b. 1954, the living protagonist-dynast).
**Status: spine present (kennedy.json, 26 events); needs the family-tree DATA
model + its own playable Era-0 origin + Roosevelt/Bush blend.**

### 2.3 TECHNOLOGICAL — the Musk spine (in `timelines/musk.json` + origins)
Walter Henry James Musk (b. ~1890s; the Cape Colony aviator-grandfather — the
game opens the Musk house on him, 1906 "Walter and the Cape Sky") → Errol Musk
(b. 1946; engineer/property/emerald-stake, apartheid-era South Africa) → **Elon**
(b. 1971 Pretoria; emigrates Canada→US; PayPal/Tesla/SpaceX; first trillionaire).
Next gen: many children (the dynasty-spreading heir model). **Status: spine
present (musk.json, 37 events, its own Era-0); needs the family-tree DATA model +
a `scientific` ladder + Edison/Thiel blend.**

### 2.4 RELIGIOUS — the Graham spine (NEW — researched this session)
William Franklin Graham Sr. (Scots-Irish dairy farmer, Charlotte NC; Associate
Reformed Presbyterian) → **Billy Graham** (William Franklin Graham Jr., b. 1918
Charlotte; the patriarch-evangelist; founds the Billy Graham Evangelistic
Association 1950; deliberately apolitical/centrist — refused Falwell's Moral
Majority 1979; d. 2018 aged 99) → m. Ruth Bell (daughter of China-missionary
surgeon L. Nelson Bell — a missionary in-law line) → five children: Gigi (b.
1945, speaker), Anne Graham Lotz (b. 1948, AnGeL Ministries), Ruth (b. 1950),
**Franklin Graham** (William Franklin Graham III, b. 1952; succeeded Billy at
BGEA + runs Samaritan's Purse; went HARD political/Republican→Independent — the
theocratic-pivot heir), Ned (b. 1958, China literature ministry — the
burial-dispute sibling-rivalry beat). Next gen: **Will Graham** (4th-generation
evangelist, Franklin's son) — the dynasty continues.

Why Graham is the right primary spine (vs Roberts/Bakker/Osteen/Falwell):
- A genuine **3–4 generation** dynasty with **clean succession** (Billy→Franklin
  →Will) — the others are largely single-generation or scandal-collapsed.
- **Built-in pole pivot**: Billy = soft-centrist establishment (refused political
  capture); Franklin = political-theocracy tilt. This maps EXACTLY onto the
  game's existing **megachurch (centrist/utopian) ↔ theocracy (dictatorial/
  Gilead) poles** — the religious house's two native branches.
- Sibling-rivalry + heir-grooming (Ned vs Franklin) feeds the existing birth-
  order/`ev_the_children` machinery.
- The blend dynasties (Roberts prosperity, Falwell/Robertson political-theocracy,
  Bakker/Swaggart scandal-fall, Osteen prosperity-apex) supply every pole + the
  televangelist-collapse trap the religious house needs for depth.

## 3. Family-tree data model

New `src/data/family-trees/<dynasty>.json`, validated by a new
`FamilyTreeSchema` (zod), one per dynasty:

```jsonc
{
  "dynasty": "religious",
  "archetype": "religious",
  "spine": "graham",
  "members": [
    { "id": "graham_sr", "name": "William Franklin Graham Sr.", "born": 1888,
      "died": 1962, "role": "patriarch-progenitor", "tags": ["dairy_farmer"],
      "children": ["billy_graham"] },
    { "id": "billy_graham", "name": "Billy Graham", "born": 1918, "died": 2018,
      "role": "founder-patriarch", "spouse": "ruth_bell",
      "children": ["gigi","anne_lotz","ruth_g","franklin_graham","ned_graham"] },
    { "id": "franklin_graham", "name": "Franklin Graham", "born": 1952,
      "role": "heir-successor", "pole_tilt": "theocracy",
      "children": ["will_graham"] },
    // … etc.
  ]
}
```

Schema fields: `id`, `name`, `born`, `died?`, `role` (progenitor | founder-
patriarch | heir-successor | rival-sibling | in-law-line | next-gen),
`spouse?`, `children[]`, `tags[]`, `pole_tilt?` (which governance branch this
member pulls toward — feeds slot/branch resolution). Validated on load via
`buildContent`. Cross-checked: every `children` id resolves to a member; exactly
one `founder-patriarch`; no cycles.

The tree DRIVES content (not just displays it): `ev_the_children`-style birth-
order, given-name resolution (AH8c/d), heir/slot resolution, and the in-game
genealogy viewer all read the tree rather than hard-coding names.

## 4. In-game surfacing

A genealogy view (extend the existing Dossier tab, or a new "Lineage" tab) renders
the active dynasty's family tree: the line from progenitor → the protagonist →
the groomed heirs, highlighting the player's position (e.g. "fourth child,
accidental heir") and which ancestors' choices set the run's branch. Luxury-UI
styled (Playfair headings, gold connectors), real-2D, no portraits.

## 5. Implementation phases (serial, solo — per the no-swarm directive)

- **DD-1 FamilyTreeSchema + data model** + the 4 tree JSONs (Trump/Kennedy/Musk
  authored from existing lineage; Graham newly authored from §2.4) + load
  validation + cross-ref tests.
- **DD-2 RELIGIOUS DYNASTY as 4th playable house:** add `"religious"` to
  `DynastyKey`; its Era-0 origin (`origins_religious` or gated origins events —
  Graham-Sr Charlotte 1918-ish opener); `religious_dynasty_active` flag →
  `dynastyOf`; wire the megachurch/theocracy branches as its native forks; add
  the carousel house ("THE HOUSE OF GRAHAM / Charlotte, 1918"). Reachability +
  prologue-not-skippable tests (per the Epoch-0 fix).
- **DD-3 archetype↔ladder binding:** each dynasty starts advantaged on its ladder;
  add the `scientific` ladder for the technological house; tests.
- **DD-4 composite blend content:** author the secondary-family lineage/slot/
  backdrop events per §1 blend lists, deepening each house. Depth-floor + no-
  shallowness guards (reuse branch-depth-floor pattern).
- **DD-5 genealogy viewer** (§4) + screenshot-verify.
- **DD-6 DoD:** full gate + AH6 sweep over all 4 dynasties × branches + persona
  sweep incl. religious + app live-verified per dynasty; PRs squash-merged.

## 6. Self-review

- Placeholder scan: none — every phase has concrete artifacts.
- Consistency: the archetype↔ladder↔branch table (§1) is the single source of
  truth; §2 spines + §3 model + §5 phases all reference it.
- Scope: large but decomposable into DD-1..DD-6, each its own PR.
- Ambiguity resolved: composite = primary spine + blend (not fictional, not
  literal-only); religious = full 4th dynasty; trees = data model that DRIVES
  content. The one open sub-decision (the `scientific` ladder for tech) is
  recorded as a DD-3 decision, not left vague.
