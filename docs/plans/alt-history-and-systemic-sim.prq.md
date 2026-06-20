# Feature: Alt-History Consistency Engine + Systemic Simulation Layer

**Created**: 2026-06-20
**Version**: 2.88
**Timeframe**: Long-running (multi-phase)
**Priority**: HIGH

## Overview

Two intertwined pillars for "MAGA Money Moves", driven by the user's directives
(AH1–AH9, SIM1) and two design specs already written
(`docs/superpowers/specs/2026-06-20-systemic-sim-layer.md`):

1. **Alt-history consistency ("gears in a clock").** Every backdrop config
   (geography / social / religious / ideology, and whole-history variants:
   real-American-political, evangelical, Nazi, West-Coast, media, role-flip) is
   its own distinct, internally-consistent timeline. Three dynastic gears
   (Trump, Musk, Kennedy/RFK Jr) drive push-pull. **Era 0 compiles** ONE bespoke,
   internally-consistent timeline by butterfly + bias-weighted selection from all
   config pools, persisted to a Capacitor save, then played out. Titles, names
   (patronymics), markets, currencies, and critical "slot events" all resolve per
   the compiled branch. No single choice may make the content feel shallow.

2. **Systemic simulation layer ("Donald Trump meets Dwarf Fortress").** Living
   markets (financial + housing), branch+time+location currencies, and four
   interwoven rank ladders (social/commercial/religious/political) that pull the
   six meters up and down between choices via a pure per-year tick.

Adopt the SIM1 spec's recommended fork resolutions: per-year tick; telegraphed
currency hedges (a wipe is a learnable risk, not a feel-bad); ship the attention
market, defer crypto polish to the last phase; ranks start as a Dossier
sub-panel. The whole thing stays PURE + DETERMINISTIC (RNG via createRng(seed);
saves = seed + history; replay reconstructs state).

Already shipped this batch (do NOT re-do): AH1 term/title layer + branch
resolver + render-path wiring; AH3 per-branch timeline-variant selection
(timelinesForBranch); the full Nazi-branch backdrop pool (usa/world/mores/
religion .nazi.json); AH8 surname/{family_name} terms (Trump/Drumpf); the SIM1
design spec. Tests green at 165 unit + 56 browser.

## Tasks

- [ ] P1: AH7 slot-event system — archetypal event slots (assassination-of-the-leader, the crash, the scandal, the martyrdom, the succession) that resolve to branch/dynasty-specific concrete events at compile time
- [ ] P1: AH8b branch-name audit — sweep era + timeline content for hardcoded "Trump"/"Drumpf" that should be the {surname}/{family_name} token; wire names through the render path like terms
- [ ] P1: Kennedy/RFK Jr protagonist timeline (timelines/kennedy.json) + brewing/bootlegger Era-0 origin flags enabling the Trump↔Kennedy dynastic swap
- [ ] P2: West-Coast branch backdrop pool — usa/world/mores/religion .westcoast.json (Pacific-centered, never touches Manhattan)
- [ ] P2: Evangelical-theocracy branch backdrop pool — usa/world/mores/religion .theocracy.json (religious-state titles, theocratic events)
- [ ] P2: Media/"pleasure-king" branch backdrop pool — usa/world/mores/religion .media.json (Nevada→California vice→porn→Hollywood→propaganda-to-legitimacy arc)
- [ ] P2: Role-flip protagonist overwrite content — Musk-as-leader / Trump-as-tycoon arc threading (terms + events reflect the flip)
- [ ] P3: AH3 timeline compiler — compile-at-Era-0 engine: butterfly + bias-weighted selection from all config pools → ONE bespoke internally-consistent timeline, persisted to a Capacitor Preferences save, deterministic from seed + Era-0 choices
- [ ] P3: AH5 timeline-compiler dev harness — `pnpm timeline:dump --seed X --choices ...` dumps the full compiled JSON timeline + consistency report; plus a batch/sweep mode (`timeline:sweep --n N`) producing a per-permutation summary table for manual QA
- [ ] P3: AH9 butterfly weight/bias pass — assign weights + biases across events / butterfly rules / ripples so compile-at-0 selection and the in-run chaos field pull realistically
- [ ] P4: SIM1 phase 1 — markets/currencies/ranks zod schemas + GameState fields (deterministic, replay-safe)
- [ ] P4: SIM1 phase 2 — pure systemicTick (per in-world year) slotted into applyChoice step 8d; markets transmit into the 6 meters via coupling coefficients; seeded via rng.fork
- [ ] P4: SIM1 phase 3 — author markets.json / currencies.json / ranks.json data incl. per-era table (eras 0–12), branch-override currencies (usd/deutschmark/reichsmark/rand/…), ship the attention market
- [ ] P4: SIM1 phase 4 — UI surfacing: Markets tab + Ranks Dossier sub-panel + branch-aware currency relabel through the term layer
- [ ] P5: SIM1 phase 5 — balance pass + crypto/attention polish; telegraphed currency-hedge survival play
- [ ] P5: AH6 agent-sweep verification — fan out verification agents over a sweep of Era-0 permutations (using the AH5 harness dumps) to flag cross-timeline contradictions / anachronisms / shallowness / title-name mismatches; aggregate → fix → re-sweep
- [ ] P5: AH4 no-shallowness audit — verify every branch opens a comparably rich, gated, multi-layer pool (acceptance bar); deepen any thin branch
- [ ] P6: Definition-of-done — full typecheck + biome + unit + browser + e2e green; app live-verified (chrome-devtools, each branch renders consistently with zero console errors); reviewer trio; green PR; squash-merge

## Dependencies

- P3 compiler depends on P1/P2 (config pools + slots + names must exist to compile from).
- P3 dev harness (AH5) depends on the compiler; AH6 sweep depends on the harness.
- P4 SIM1 phases are sequential (schema → tick → data → UI); P5 balance depends on P4.
- P6 is the final gate after all content + systems land.
- AH9 weighting (P3) should land before AH6 sweep (P5) so the sweep tests realistic selection.

## Acceptance Criteria

### Slot events (AH7)
- A SlotSchema + data; archetypal slots resolve to branch/dynasty-specific events at compile time; unit test proves the "leader assassination" slot → Fred Trump on the political-dynasty path, → a Commissar purge on the Nazi path, etc.

### Branch names (AH8b)
- No player-facing hardcoded "Trump" that should vary by branch; {surname}/{family_name} render through applyTerms; Nazi run shows "Drumpf". Test asserts interpolation.

### Kennedy timeline
- timelines/kennedy.json validates (scope "kennedy"); brewing/bootlegger Era-0 flags reachable; swap test passes.

### Branch backdrop pools (westcoast/theocracy/media + role-flip)
- Each pool: 4 files (usa/world/mores/religion) validating as scope+correct branch, ≥30 events each, 0 dup ids, string comparators only, no cross-timeline contradictions (consistency test per pool).

### Timeline compiler (AH3) + harness (AH5)
- Deterministic: same seed + Era-0 choices → identical compiled timeline. `pnpm timeline:dump` writes a compiled JSON + consistency report; `timeline:sweep` runs N permutations. Compiled timeline persists/restores via Capacitor Preferences. Replay parity test.

### Butterfly weighting (AH9)
- Weights/biases present across rules/ripples/events; seeded selection varies believably across seeds (spread test).

### SIM1 (all phases)
- Schemas validate; systemicTick is pure + replay-safe (property test: replay reconstructs identical market/rank state); per-era table data loads; markets move meters between choices; currency relabels by branch; ranks panel renders; balance reasonable.

### Verification (AH6) + no-shallowness (AH4)
- Agent sweep over Era-0 permutations finds zero unresolved cross-timeline contradictions; every branch meets the depth bar.

### Definition of done (P6)
- typecheck + biome + unit + browser + e2e all green; app live-verified per branch with zero console errors; reviewer trio folded; PR green; squash-merged.

## Technical Notes

- Pure deterministic sim is non-negotiable (gate-enforced): no Math.random/Date.now/performance.now in src/sim or src/engine; RNG via createRng(seed); saves = seed + history.
- Data-driven: all content + config as JSON validated by zod on load.
- Branch model is "gears in a clock": distinct consistent configs, compiled once at Era 0, persisted; three dynastic gears drive it.
- Adopt SIM1 spec fork defaults (per-year tick, telegraphed hedges, attention-now/crypto-later, ranks-as-Dossier-subpanel-first).
- Colocated tests (__tests__/), Conventional Commits, squash-merge, jbcom ruleset (PR + human approval to merge).

## Risks

- Compiler determinism vs the live butterfly machine — must compose at Era 0 without breaking replay-from-seed.
- Authoring volume across 4 more branch pools × 4 scopes — parallelize via agents, but hold the no-shallowness + consistency bars.
- SIM1 balance — markets/wipes must reward foresight, not feel random; telegraph hedges.
- Cross-timeline contradiction leakage — the AH6 sweep is the safety net; keep it cheap to re-run.
