---
title: DE-6a Consistency Sweep Report
updated: 2026-06-20
status: current
domain: quality
---

# DE-6a Consistency Sweep Report

## Executive Summary

A cross-permutation consistency audit across 7 dynasty/branch combinations (trump/default, trump/kennedy, musk/default, musk/nazi, kennedy/default) identified 37 distinct findings ranging from terms resolution that assigns Trump's name to Musk and Kennedy protagonists, to slot event IDs that resolve to non-existent events, to world-timeline events firing in incompatible branches without flag guards. The most systemic root causes are: (1) `terms.json` has no `musk` or `kennedy` branch so all dynasties resolve to Trump's name, (2) `slots.json` references phantom event IDs that exist nowhere in the data files, and (3) the majority of world-timeline events lack `axis_ascendant` guards, letting allied-America events fire inside the nazi branch.

---

## Critical Findings

### C-1 — Terms resolution assigns Trump name to Musk and Kennedy dynasties
**Severity:** critical | **Category:** title-leak
**Permutations:** musk/default, kennedy/default
**Location:** `src/data/terms.json`, `src/sim/compiler.ts` (termFor()), `src/sim/terms.ts`

`terms.json` is keyed by branch (default/nazi/westcoast/theocracy), not dynasty. Because there is no `musk` or `kennedy` branch key, both resolve to `default`, which maps `given_name='Donald'`, `surname='Trump'`, `full_name='Donald Trump'`. Every `{given_name}` and `{surname}` token in `boyhood.json ev_born_in_queens`, `origins.json` prologue events, and elsewhere renders the Trump name for Musk and Kennedy players.

**Fix:**
- Add a `musk` key in `terms.json`: `given_name='Elon'`, `surname='Musk'`, `full_name='Elon Musk'`.
- Add a `kennedy` key: `given_name='Joseph'`, `surname='Kennedy'`, `full_name='Joseph Kennedy'`.
- In `src/sim/terms.ts` (or `compiler.ts` `termFor()`), resolve dynasty before branch — dynasty-keyed entry takes precedence over branch key.
- Remove the `firstborn/only-child` Friedrich override from terms.ts for non-trump dynasties.

---

### C-2 — Slot event IDs resolve to non-existent events (all permutations)
**Severity:** critical | **Category:** flag-gap
**Permutations:** trump/default, trump/kennedy, musk/default, musk/nazi, kennedy/default
**Location:** `src/data/slots.json`

Four resolved slot event IDs do not exist in any era or timeline file. They appear only in `slots.json` and in unit test fixtures, meaning the test suite asserts broken resolution and passes:

| Slot | Branch | Phantom ID | Nearest real event |
|------|--------|------------|-------------------|
| `leader_assassination` | trump/default | `ev_fred_assassinated` | — (needs authoring) |
| `leader_assassination` | kennedy | `ev_jfk_assassinated` | `wk2_jfk_assassination` (kennedy.json 1963) |
| `the_crash` | default | `ev_great_depression_1929` | `wu_crash_1929` or `wm_great_crash` |
| `the_great_scandal` | default | `ev_watergate_era_scandal` | — (needs authoring) |
| `the_crash` | nazi | `wun_reich_war_economy` | — (needs authoring in usa.nazi.json) |
| `the_great_scandal` | nazi | `wun_commissar_corruption_tribunal` | — (needs authoring in usa.nazi.json) |

**Fix:**
- Remap `leader_assassination` kennedy → `wk2_jfk_assassination` in `slots.json`.
- Remap `the_crash` default → `wu_crash_1929` (or `wm_great_crash`) in `slots.json`.
- Author `ev_watergate_era_scandal` in a suitable era file (mogul or brand era) and wire the slot.
- Author `ev_fred_assassinated` in an appropriate era for the trump dynasty slot, or change the slot to a real event.
- Author `wun_reich_war_economy` and `wun_commissar_corruption_tribunal` in `usa.nazi.json`.
- Add a cross-reference validation in `buildContent` / `consistencyReport` that asserts every `resolveSlot()` output ID exists in `allEvents` — currently these phantom IDs pass silently.

---

### C-3 — `ev_born_in_queens` (boyhood) fires unconditionally for all dynasties
**Severity:** critical | **Category:** other
**Permutation:** kennedy/default (also affects musk/default)
**Location:** `src/data/eras/boyhood.json` — event `ev_born_in_queens` (year 1946)

The opening boyhood scene fires with no `requires` guard. It places the player at Jamaica Hospital, Queens, names `Mary Anne` and `Fred` as parents, and resolves `{given_name}/{surname}` to `Donald Trump`. A Kennedy dynasty player (JPK born 1888 in East Boston) sees a 1946 Queens birth scene. A Musk player sees the same.

**Fix:**
- Add `notFlags: ['kennedy_dynasty_active', 'musk_dynasty_active']` to `ev_born_in_queens` and any subsequent boyhood chain events that are Trump-specific.
- Author a kennedy-specific birth event (East Boston, 1888, names `Rose Fitzgerald` and `P.J. Kennedy`) gated on `requires: { flags: ['kennedy_dynasty_active'] }`.
- Author a musk-specific birth event (Pretoria, 1971) gated on `requires: { flags: ['musk_dynasty_active'] }` — this also resolves anachronism C-5 below.

---

### C-4 — Nazi-branch occupation year and mechanism conflict across three timelines
**Severity:** critical | **Category:** cross-timeline-inconsistency
**Permutation:** musk/nazi
**Location:** `src/data/timelines/usa.nazi.json` `wun_occupation_begins` (1943); `src/data/timelines/world.nazi.json` `wwn_axis_partition_agreement` (1944); `src/data/timelines/religion.nazi.json` `wrn_reich_conquers_america` (1944)

Three timelines active in the same run give incompatible accounts of when and how the US fell. `usa.nazi` says Reichskommissariat proclaimed in 1943. `world.nazi` says a 1944 Tripartite Treaty declared Americas a "neutral buffer for now." `religion.nazi` says a 1944 armistice had the US ceding "eastern territories" to a Continental Security Zone — implying partial sovereignty survives, contradicting `usa.nazi`'s full dissolution (New York renamed Neu Berlin).

**Fix:**
- Canonicalize full US dissolution in 1944 across all three files.
- Shift `usa.nazi wun_occupation_begins` to 1944, `wun_occupation_order` to 1945.
- Rewrite `world.nazi wwn_axis_partition_agreement` to describe full US dissolution rather than a neutral buffer.
- Rewrite `religion.nazi wrn_reich_conquers_america` to remove "ceding eastern territories" language and align with full dissolution.

---

### C-5 — Nazi-branch Reich space/moon milestones announced twice at conflicting years
**Severity:** critical | **Category:** cross-timeline-inconsistency
**Permutation:** musk/nazi
**Location:** `usa.nazi.json wun_reich_space_v2` (1950) vs `world.nazi.json wwn_reich_space_program` (1960); `usa.nazi.json wun_reich_moon_1961` (1961) vs `world.nazi.json wwn_reich_moon_landing` (1967)

The first Reich orbit is announced at 1950 in `usa.nazi` and again at 1960 in `world.nazi`. The Reich moon landing is placed at 1961 in `usa.nazi` and 1967 in `world.nazi`. Both events in each pair set the same flag (`reich_space_program`). Players see the same milestone twice with conflicting years.

**Fix:**
- Align on 1950 for first Reich orbit. Rewrite `world.nazi wwn_reich_space_program` (1960) as continued orbital dominance commentary, not a first-orbit announcement.
- Align on 1961 for the Reich moon landing. Rewrite `world.nazi wwn_reich_moon_landing` (1967) as a propaganda-impact note, not a milestone announcement.

---

### C-6 — Post-nuclear USA events fire without `the_atomic_horror` guard
**Severity:** critical | **Category:** cross-timeline-inconsistency
**Permutation:** trump/kennedy (also affects other runs where `ww_the_atomic_horror` can set)
**Location:** `src/data/timelines/world.json ww_the_atomic_horror` (2041) vs `src/data/timelines/usa.json wu_constitutional_convention` (2089), `wu_orbital_economy` (2140), `wu_continental_federation` (2300)

`ww_the_atomic_horror` describes a full nuclear exchange that topples governments. Three subsequent USA-timeline events describe a thriving constitutional democracy with orbital industry, with no guard against the `the_atomic_horror` flag. A post-nuclear America cannot logically rewrite its constitution 48 years later with no narrative acknowledgment.

**Fix:**
- Add `requires: { notFlags: ['the_atomic_horror'] }` to `wu_constitutional_convention`, `wu_orbital_economy`, and `wu_continental_federation`.
- Author parallel post-nuclear USA events gated on `requires: { flags: ['the_atomic_horror'] }` describing the USA's alternate post-2041 trajectory.

---

### C-7 — `wk_musk_takes_power` fires unconditionally, hardcodes "Donald Trump" across all dynasties
**Severity:** critical (merged with major) | **Category:** cross-timeline-inconsistency
**Permutations:** trump/default, trump/kennedy, musk/default, musk/nazi, kennedy/default
**Location:** `src/data/timelines/musk.json wk_musk_takes_power` (2037); also `wk_musk_presidency_eligible` (2035), `wk_musk_campaign_launch` (2036)

`wk_musk_takes_power` has no `requires` clause and fires in every dynasty run. Body hardcodes `"Donald Trump — now the world's most famous commercial brand — watches from a sky-box"`. In a kennedy run no Trump presidency occurred. In a musk/nazi run the US was dissolved. In a trump/default run the event fires even when the player holds power (no `role_flip` gate). `wk_musk_campaign_launch` (2036) describes Musk broadcasting from Mars with no `musk_mars_colony` prerequisite.

**Fix:**
- Add `requires: { flags: ['role_flip'] }` to `wk_musk_takes_power` (trump/default) — or add `requires: { notFlags: ['kennedy_dynasty_active'] }` and `notFlags: ['axis_ascendant']`.
- Add `requires: { flags: ['musk_presidency_eligible'] }` to `wk_musk_takes_power`.
- Add `requires: { flags: ['musk_mars_colony'] }` to `wk_musk_campaign_launch`.
- Add `notFlags: ['axis_ascendant']` to all three Musk presidency events (2035–2037).
- Replace the hardcoded `'Donald Trump'` in `wk_musk_takes_power` body with `{full_name}` term token.

---

## Major Findings

### M-1 — `kennedy_dynasty_active` set by passive world events, corrupting dynastyOf()
**Severity:** major | **Category:** other
**Permutation:** trump/kennedy
**Location:** `src/data/timelines/kennedy.json wk2_jpk_bootlegger_fortune` (1923), `wk2_kennedy_dynastic_swap_event` (2030)

These events set `kennedy_dynasty_active` in `setFlags`, which `dynastyOf()` uses to classify the run dynasty. A Trump run encountering the kennedy world timeline would be silently reclassified as kennedy mid-run.

**Fix:** Remove `kennedy_dynasty_active` from `setFlags` of all kennedy world-timeline events. Use `kennedy_swap` as the thematic convergence marker. Update `dynastyOf()` to read `kennedy_dynasty_active` only from prologue choices, not world-event flags.

---

### M-2 — `wk_musk_buys_twitter` hardcodes "Donald Trump's account" in all dynasty runs
**Severity:** major | **Category:** title-leak
**Permutations:** trump/kennedy, kennedy/default, musk/nazi
**Location:** `src/data/timelines/musk.json wk_musk_buys_twitter` (2022)

Body: "reinstates banned accounts including Donald Trump's" — fires unconditionally in all dynasty runs including kennedy and nazi branch.

**Fix:** Replace `'Donald Trump's'` with `'{full_name}'s'` or `'prominent political figures previously removed'`. Add `notFlags: ['axis_ascendant']`.

---

### M-3 — `wt_john_trump_mit` fires in all dynasties, hardcodes "Donald's uncle", sets dead-end flag
**Severity:** major (merged across permutations) | **Category:** other
**Permutations:** trump/default, musk/default, musk/nazi, kennedy/default
**Location:** `src/data/timelines/science.json wt_john_trump_mit` (1936)

Headline "A Trump Joins the MIT Electrical Engineering Faculty." Body hardcodes "Donald's uncle." Fires in every dynasty run with no gate. Sets flag `trump_science_lineage` which no subsequent event anywhere in the data consumes (dead-end flag). In Musk and Kennedy runs, a player reads about "Donald's uncle" as if Trump is their family patriarch.

**Fix:**
- Add `requires: { flags: ['trump_prologue'] }` (or `notFlags: ['musk_dynasty_active', 'kennedy_dynasty_active']`) to `wt_john_trump_mit`.
- Replace `'Donald's uncle'` with `'John G. Trump — uncle to the future dynasty patriarch'` if the event must appear in shared timelines.
- Either wire `trump_science_lineage` as a gate on a downstream Trump science event, or remove it from `setFlags`.

---

### M-4 — `wk2_jfk_president_1960` and Kennedy political arc fire in nazi branch without guard
**Severity:** major | **Category:** anachronism
**Permutation:** musk/nazi
**Location:** `src/data/timelines/kennedy.json wk2_jfk_president_1960` (1960), `wk2_rfk_doj` (1961), `wk2_jfk_assassination` (1963), `wk2_rfk_assassination_1968` (1968), `wk2_chappaquiddick` (1969)

These events describe a functioning US democracy (JFK defeating Nixon, RFK as AG, California Democratic primary) in a branch where the US was dissolved since 1943.

**Fix:** Add `notFlags: ['axis_ascendant']` to all five events (and any other post-1943 kennedy world events describing US political structures).

---

### M-5 — Default-path Musk events fire alongside axis-path events (mutually exclusive histories)
**Severity:** major | **Category:** cross-timeline-inconsistency
**Permutation:** musk/nazi
**Location:** `src/data/timelines/musk.json` — default-path events `wk_musk_zip2_founded` (1995) through `wk_musk_doge_cuts` (2025) fire alongside axis-path events

With `axis_ascendant` set, both the axis-path and default-path Musk events fire simultaneously. Players read Musk founding Zip2 in Palo Alto in 1995 and also read that "there is no Silicon Valley to flee to" in 1995.

**Fix:** Add `notFlags: ['axis_ascendant']` to all default-path `musk.json` events from `wk_musk_canada_pivot` (1989) onward. Events before 1989 (born 1971, Blastar 1984) predate the branch point and can remain ungated.

---

### M-6 — Science timeline events lack `axis_ascendant` guard (Sputnik, Apollo, Manhattan)
**Severity:** major | **Category:** anachronism
**Permutation:** musk/nazi
**Location:** `src/data/timelines/science.json wt_sputnik_launch` (1957), `wt_apollo_11_moon_landing` (1969), `wt_manhattan_project` (1945)

In the nazi branch: USSR fell in 1942, the Reich orbited in 1950 (no Sputnik), there is no US Apollo program, and the Reich holds nuclear monopoly (no two-city strike). All three events contradict the nazi branch world-state.

**Fix:** Add `notFlags: ['axis_ascendant']` to `wt_sputnik_launch`, `wt_apollo_11_moon_landing`, and `wt_manhattan_project`.

---

### M-7 — `wt_first_contact` fires without guard alongside `wwn_reich_first_contact_intercept`
**Severity:** major | **Category:** cross-timeline-inconsistency
**Permutation:** musk/nazi
**Location:** `src/data/timelines/science.json wt_first_contact` (2152) vs `world.nazi.json wwn_reich_first_contact_intercept` (2168)

Two incompatible first-contact events fire 16 years apart. `wt_first_contact` sets `contact_made` with open benevolent framing; `world.nazi` sets the same flag with hostile classification. Downstream gates on `contact_hostile`/`contact_benevolent` become unpredictable.

**Fix:** Add `notFlags: ['axis_ascendant']` to `wt_first_contact` in `science.json`.

---

### M-8 — Musk birth year triple inconsistency (era year vs scene body vs world timeline)
**Severity:** major | **Category:** cross-timeline-inconsistency / anachronism
**Permutation:** musk/default
**Location:** `src/data/eras/origins.json ev_elon_musk_born` (year field: 1946, scene body: "It is 1971"); `src/data/timelines/musk.json wk_musk_born_pretoria` (year: 1971)

Three values disagree: the era JSON `year=1946`, the scene body "It is 1971", and the world-timeline stamp `1971`. The `researchNote` documents year compression but the scene body was not updated.

**Fix:** Remove the explicit "1971" year claim from the `ev_elon_musk_born` scene body. Replace with era-neutral language: "In apartheid Pretoria, in the years before the world learns his name..." Alternatively extend the origins era end year past 1971 to carry the true birth year.

---

### M-9 — `wk_musk_political_turn` and `wk_musk_buys_twitter` hardcode Trump name (cross-dynasty pollution)
**Severity:** major | **Category:** other
**Permutation:** musk/nazi
**Location:** `src/data/timelines/musk.json wk_musk_political_turn` (2022 area), `wk_musk_buys_twitter` (2022)

`wk_musk_political_turn` describes Musk pouring money into "the 2024 Trump campaign." `wk_musk_buys_twitter` reinstates "Donald Trump's" account. Both fire without `axis_ascendant` guard. In nazi branch these events fire in a timeline where Trump never ran for president.

**Fix:** Add `notFlags: ['axis_ascendant']` to both events. Replace hardcoded `'Donald Trump'`/`'Trump campaign'` with `{full_name}` tokens or gate behind `requires: { flags: ['role_flip'] }`.

---

### M-10 — Title-leak: Drumpf hardcoded in kennedy.json body text visible in trump/default
**Severity:** major | **Category:** title-leak
**Permutation:** trump/default
**Location:** `src/data/timelines/kennedy.json wk2_jpk_bootlegger_fortune` (1923), `wk2_kennedy_dynastic_swap_event` (2030), `wk2_kennedy_immortal_dynast_declared` (2150)

Three Kennedy-timeline events hardcode `'Drumpf'` or `'Trump-Drumpf'` in body text. In trump/default where `surname.default='Trump'`, a player sees their family called `Drumpf` (the nazi-branch name).

**Fix:** Replace all hardcoded `'Drumpf'` occurrences in body text with `{surname}` token. Replace `'Trump-Drumpf'` in `wk2_kennedy_immortal_dynast_declared` with `{family_name}` (resolves to `Trump` in default, `Drumpf` in nazi).

---

### M-11 — Nazi-branch title-leak: timeline events hardcode "Donald Trump" / "Fred Trump"
**Severity:** major | **Category:** title-leak
**Permutation:** musk/nazi
**Location:** `usa.nazi.json wun_commissar_trump_2009`, `wun_denazification_tribunals`; `religion.nazi.json wrn_trump_born_occupied_queens`, `wrn_trump_reichskirche_confirmation`, `wrn_trump_religion_as_performance`

Nazi branch maps `given_name='Friedrich'`, `surname='Drumpf'`. Five events hardcode `'Donald Trump'`, `'Donald'`, and `'Fred Trump'` as literal strings with no token substitution.

**Fix:** Implement `{token}` substitution in timeline event body/headline rendering to match era scene pattern, OR manually update these five events to use `'Friedrich Drumpf'` and `'Friedrich Drumpf Sr.'` directly.

---

### M-12 — `wk_musk_presidency_eligible` never established before `wk_musk_takes_power`
**Severity:** major | **Category:** flag-gap
**Permutation:** musk/default
**Location:** `src/data/timelines/musk.json wk_musk_campaign_launch` (2036), `wk_musk_takes_power` (2037)

`wk_musk_campaign_launch` has no `requires` field at all. `wk_musk_takes_power` has no `requires` field. Both assume preconditions (Mars colony, constitutional amendment) that the flag system does not enforce.

**Fix:** Add `requires: { flags: ['musk_mars_colony'] }` to `wk_musk_campaign_launch`. Add `requires: { flags: ['musk_presidency_eligible'] }` to `wk_musk_takes_power`. (Already captured in C-7 above — duplicate here for file-level traceability.)

---

### M-13 — `wk2_jfk_president_1960` and `wk_musk_takes_power` coexist with no mutual exclusion
**Severity:** major | **Category:** cross-timeline-inconsistency
**Permutation:** trump/kennedy
**Location:** `kennedy.json wk2_jfk_president_1960` (1960) + `musk.json wk_musk_takes_power` (2037)

Kennedy in the White House 1960 → Musk takes power 2037 with narration framing Trump as the prior incumbent. In a kennedy dynasty run no Trump presidency occurred.

**Fix:** Gate `wk_musk_takes_power` with `notFlags: ['kennedy_dynasty_active', 'kennedy_white_house']`. Write a kennedy-dynasty alternate 2037 Musk event where Musk becomes a commercial rival rather than president.

---

### M-14 — `ws_anti_german_wwii` hardcodes "Drumpf" surname across all dynasty runs
**Severity:** major | **Category:** title-leak / cross-dynasty pollution
**Permutations:** trump/default, kennedy/default
**Location:** `src/data/timelines/mores.json ws_anti_german_wwii` (1942)

Body: "families with names like Drumpf quietly bury their origins." Fires unconditionally. In trump/default the player's name is `Trump` not `Drumpf`. In kennedy/default the Kennedy family is Irish Catholic — no German surname connection.

**Fix:** Replace hardcoded `'Drumpf'` with `{surname}` token. For cross-dynasty correctness, gate the German-heritage framing with `requires: { flags: ['trump_prologue'] }` and author an Irish-heritage variant for kennedy runs.

---

### M-15 — `religion.json` fires Trump-lineage Lutheran events in kennedy/default
**Severity:** major | **Category:** other
**Permutation:** kennedy/default
**Location:** `src/data/timelines/religion.json wr_kallstadt_lutheran_roots` (1869), `wr_lutheran_vs_revivalist_fork` (1919)

Both events reference "Friedrich Trump" and "the Trump family's heritage" with no dynasty gate. Kennedy dynasty players see Trump Lutheran heritage events irrelevant to an Irish Catholic narrative.

**Fix:** Add `requires: { flags: ['trump_prologue'] }` to `wr_kallstadt_lutheran_roots` and `wr_lutheran_vs_revivalist_fork`. Author a kennedy-specific religion event covering JPK's Irish Catholic East Boston parish roots.

---

### M-16 — Shallow-choice: five ascent-era events and one brand-era event have zero mechanical differentiation
**Severity:** major | **Category:** shallow-choice
**Permutation:** kennedy/default (trump-era content)
**Location:** `src/data/eras/ascent.json ev_inauguration_2017`, `ev_charlottesville`, `ev_global_populism_wave`, `ev_market_crash_boom`, `ev_george_floyd` (2017-2020); `src/data/eras/brand.json ev_become_democrat` (2001)

Six events each have 2-3 choices where every choice sets zero flags and applies zero meter deltas. Charlottesville responses (`both_sides`, `condemn_clearly`, `blame_the_media`) are mechanically identical. `ev_become_democrat` three choices all set the same flags `['registered_democrat', 'flirted_left']`.

**Fix (ascent era):** Assign distinct flag outputs — e.g. charlottesville `'both_sides'` → `nazi_adjacent`; `'condemn_clearly'` → `moral_clarity`; `'blame_the_media'` → `media_war_mode`. Use flags to gate downstream events and ending eligibility.

**Fix (brand era `ev_become_democrat`):** Differentiate: `'embrace_the_left'` → `genuine_left_turn`; `'tactical_switch'` → `cynical_registration`; `'register_but_doubt'` → `reluctant_democrat`. Use flags to gate later events covering the switch back to Republican.

---

### M-17 — `eastcoast.json we_northeast_war_industry` (1943) fires in nazi branch with Allied framing
**Severity:** major | **Category:** anachronism
**Permutation:** musk/nazi
**Location:** `src/data/timelines/eastcoast.json we_northeast_war_industry` (1943)

Event implies a free US mobilizing for allied victory. In the nazi branch 1943 is the occupation proclamation year; northeastern factories under occupation would produce for Reich war aims.

**Fix:** Add `notFlags: ['axis_ascendant']`. Author a nazi-branch variant framing wartime production as occupation-mandated mobilization.

---

## Minor Findings

- **mn-1** `usa.json wu_cold_war_ends` (1991): Mixed past/present tense — Berlin Wall (1989) described alongside Soviet flag falling (1991). Rewrite Berlin Wall reference as past tense: "After the Berlin Wall fell two years earlier..." (trump/default)

- **mn-2** `world.json ww_deepfakes_emerge` (2018) vs `usa.json wu_deepfake_emerge` (2017) and `westcoast.json wwc_deepfake_emerges` (2017): One-year discrepancy for same event across three simultaneous timelines. Normalize `ww_deepfakes_emerge` to 2017. (musk/default, kennedy/default)

- **mn-3** `origins.json ev_elon_musk_born` scene body states "It is 1971" while the event `year` field is 1946 (era compression) and the event display would stamp 1946. Remove the explicit year from the body. (musk/default — duplicate of M-8 anachronism sub-issue)

- **mn-4** `science.json wt_john_trump_mit` sets dead-end flag `trump_science_lineage` — no downstream event in any file requires or references it. Either wire it as a gate on a downstream Trump science event or remove from `setFlags`. (musk/default)

- **mn-5** `kennedy.json wk2_rfk_doj` (1961) appears after `wk2_jfk_assassination` (1963) in file order. Engine sorts by year at runtime so no behavioral bug, but misleads content authors reviewing the file. Reorder chronologically. (trump/kennedy)

- **mn-6** `musk.json wk_musk_buys_twitter` (2022) body: "reinstates banned accounts including Donald Trump's" fires in all dynasty runs including kennedy. Replace with `{full_name}`'s or generic language. (trump/kennedy — duplicate fix covered in M-2)

- **mn-7** `kennedy.json wk2_rfkjr_born_lawyer` (year 1990): Body says "By the late 1980s he co-founded Riverkeeper" (Riverkeeper founded 1986). Year and body are inconsistent by 3-4 years. Either shift event year to 1986/1987 or update body to "By 1990 he has fully established himself." (kennedy/default)

- **mn-8** `religion.nazi.json wrn_reich_conquers_america` (1944) describes "ceding eastern territories" implying partial US sovereignty, contradicting `usa.nazi`'s full dissolution framing. Remove "eastern territories" language to align with canonical full dissolution. (musk/nazi — also addressed in C-4)

- **mn-9** `mores.json ws_gilded_age_propriety` (1869), `religion.json wr_kallstadt_lutheran_roots` (1869), `science.json wt_edison_electric_light` (1879): All three events are dated before the earliest era boundary of 1885 (origins era). No era exists to anchor them. Move to 1885+ with adjusted copy, or define a prologue era (1869–1884) in `eras/index.json`. (trump/default)

---

## Summary Counts

| Severity | Count |
|----------|-------|
| Critical | 7 |
| Major | 17 |
| Minor | 9 |
| **Total** | **33** |

(Raw agent findings: 37 before deduplication merged slot-gap findings across permutations, the `wk_musk_takes_power` cross-dynasty group, and the `wt_john_trump_mit` dynasty-pollution group.)
