# Feature: Convergence Saga — the dynasty-as-novel rebuild

**Created**: 2026-06-21
**Version**: 2.88
**Timeframe**: Long-running (single local branch, no deferrals)
**Spec**: docs/superpowers/specs/2026-06-21-convergence-saga-design.md (approved)

## Priority: CRITICAL (foundational redesign)

## Overview

Rebuild Dynasty as a choose-your-own-adventure NOVEL of one bloodline — "the story of
America" — per the approved Convergence Saga spec. One local branch, NO deferrals / stubs /
placeholders / TODOs. Every dynasty is a Yuka GOAP agent; 8 motivators ground future-shaping
(drift + gate + misfortune); the saga runs three macro-acts (Convergence 1800s → Emergence
1900s → Ascension 2000s+); class is a movable rung with authored poor/middle/upper tracks; the
world is all the immigration-wave lines advancing in parallel as forces you glimpse; humans
author the SPINE (goals, act lattice, class tracks, convergence/ending lattice) and GenAI weaves
the FLESH (the act prose) once scaffolded. Includes a FULL RETOOL of the GenAI toolkit to support
"expand" modes across content types, writing directly into the canonical JSON (no `.gen.json`
shadow), validated through the harness gate.

Hard rules: sim purity (RNG only via createRng; no Math.random/Date.now in src/sim — Yuka goal
core only, never steering); 0 preset-person leaks; harness audit 0 findings; full gate green per
commit; one Conventional Commit per task; squash-merge at the end.

## Tasks

- [ ] P1: SS-1 — Motivators core: the 8-axis model (createMotivators, drift, gate), replacing/consolidating personality + axes.json
- [ ] P1: SS-2 — Yuka integration: add yuka + @types/yuka; pure GOAP wrapper (Goal/CompositeGoal/Think/GoalEvaluator) seeded-RNG-safe, JSON serialize/deserialize
- [ ] P1: SS-3 — DynastyAgent: a line as a GOAP agent (motivators→characterBias, archetype/trope→evaluator set); deterministic per-turn arbitrate+step
- [ ] P1: SS-4 — Macro-act + epoch model: Convergence/Emergence/Ascension phases; epochs as cross-cutting world inputs every evaluator reads
- [ ] P1: SS-5 — Class-rung system: rung index + poor/middle/upper track routing; misfortune drop (war/disease/collapse, seeded) + recovery + hysteresis mark
- [ ] P1: SS-6 — Immigration-wave roster: the 7 waves (period×class→culture) + destination grounds; drop SA + colonial; reshape baghdad→1880s Levantine
- [ ] P1: SS-7 — Onboarding rebuild: Period → Class → Race/Culture funnel; Epoch-0 seeds the GOAP brain
- [ ] P1: SS-8 — Multi-line world sim: all unplayed waves advance each turn as agents; stored state; opposing/contributing/neutral forces; glimpse/intersection triggers
- [ ] P1: SS-9 — Convergence + ending lattice: ~16-20 endings (destination×motivator-coloring×sub-variant); other-lines' fates fold into your ending
- [ ] P1: SS-10 — Spine authoring: goal/evaluator sets per archetype+class+macro-act; act lattice + branch/convergence points (the bones, no prose yet)
- [ ] P1: SS-11 — GenAI FULL RETOOL: uniform `expand` modes per content type, writing into canonical JSON (no .gen.json), harness-gated; register-aware (per tier/era genre)
- [ ] P2: SS-12 — GenAI WRITE THE STORIES: run the retooled toolkit to flesh every scaffolded act/class-track/wave with prose; cull weak; 0 leaks
- [ ] P1: SS-13 — Read-model + bridge: expose macro-act, rung, motivators, glimpses to the UI via the bridge
- [ ] P1: SS-14 — UI: novel-of-your-life presentation (acts/chapters, motivators, class rung, other-lines glimpses, register shift); live-verified in Chrome
- [ ] P1: SS-15 — Determinism + acceptance gate: a representative full playthrough traces an hour+, bit-identical replay (incl. all lines), 0 leaks, harness 0 findings; remove dead old-model code
- [ ] P2: SS-16 — Docs + PR: STATE.md/ARCHITECTURE.md updated; open the PR; green CI + post-merge workflows

## Dependencies

- SS-2 depends on SS-1 (agents read motivators)
- SS-3 depends on SS-2, SS-1
- SS-4, SS-5 depend on SS-3
- SS-6, SS-7 depend on SS-1, SS-4 (waves + onboarding seed the brain)
- SS-8 depends on SS-3, SS-6 (all lines are agents)
- SS-9 depends on SS-4, SS-8 (convergence reads all lines)
- SS-10 depends on SS-3, SS-4, SS-5, SS-6 (spine spans archetype×class×macro-act×wave)
- SS-11 depends on SS-10 (expand fills the scaffolded spine)
- SS-12 depends on SS-11, SS-10 (write flesh onto bones via the retooled toolkit)
- SS-13 depends on SS-3, SS-4, SS-5, SS-8
- SS-14 depends on SS-13
- SS-15 depends on ALL prior (full-system verification + dead-code removal)
- SS-16 depends on SS-15

## Acceptance Criteria

### SS-1 Motivators
- `src/sim/motivators.ts` exports the 8 axes + createMotivators/drift/gate; unit tests; personality + axes.json consumers migrated; no orphaned old axis refs; typecheck + suite green.

### SS-2 Yuka integration
- `yuka` + `@types/yuka` added (pnpm); a pure GOAP wrapper under `src/sim/goap/`; NO Math.random/Date.now/performance.now reachable from src/sim (gate ban-pattern passes); toJSON/fromJSON round-trips deterministically; unit tests.

### SS-3 DynastyAgent
- A line builds a Think brain from motivators+archetype+trope; arbitrate+step is pure + deterministic (same seed+state → same plan); serializes into the save; unit tests prove determinism.

### SS-4 Macro-acts + epochs
- Convergence/Emergence/Ascension phase model + epoch inputs; a run moves through the three macro-acts by year; evaluators read epochs; unit tests.

### SS-5 Class-rung
- Rung index + track routing; a seeded misfortune (war/disease/collapse) drops the line into the lower class track temporarily, recovery climbs back, hysteresis flag/drift applied; unit tests cover drop+recover+mark.

### SS-6 Roster
- 7 waves defined (period×class→culture + push + landing-ground); SA + colonial dropped; baghdad reshaped to 1880s Levantine; destination grounds defined; content-build validates referential integrity; harness 0 leaks.

### SS-7 Onboarding
- Period → Class → Race/Culture funnel; selecting a cell founds the right wave and seeds the GOAP brain via Epoch-0; e2e covers the funnel; live-verified.

### SS-8 Multi-line world
- N wave-lines advance each turn as agents; state stored in the save; intersection/glimpse triggers fire when lines align; deterministic; unit tests over a multi-line turn.

### SS-9 Endings
- ~16-20 convergence endings (destination×coloring×sub-variant); reachability gated by motivators (a Community/Tradition line cannot reach a Cunning-conquest stars ending); other-lines' fates included; unit tests assert the lattice + gating.

### SS-10 Spine
- Authored goal/evaluator sets + act lattice + branch/convergence points covering every archetype×class×macro-act×wave the game offers; no prose required yet; a structural test asserts every (wave,class,macro-act) cell has a reachable scaffold.

### SS-11 GenAI retool
- Uniform `pnpm genai:expand --type <…> [scope flags] --count N [--write]`; writes into the canonical JSON for the type (no .gen.json); validated through the same harness gate; register/tier/era-aware prompts; dry-run + write modes; tests with a stubbed GenerateFn.

### SS-12 GenAI writes the stories
- Every scaffolded act/class-track/wave fleshed with prose via SS-11; weak/duplicate beats culled; harness audit 0 findings + textQuality corpus-clean over ALL generated content; no empty scaffolds remain.

### SS-13 Read-model + bridge
- Bridge exposes macro-act, rung, motivators, current act/chapter, other-line glimpses; pure; unit tests.

### SS-14 UI
- Novel presentation: act/chapter headings, motivator display, class rung, other-lines glimpses, register shift; mobile-first; browser tests; live-verified in Chrome (a real playthrough reads as a novel).

### SS-15 Acceptance gate
- A representative full playthrough fires the target beat count (hour+), replays bit-identically (incl. all lines), 0 preset-person leaks, harness audit 0 findings; ALL dead old-model code removed (no orphaned events/endings/personality); full gate green (typecheck, biome, unit, browser, e2e).

### SS-16 Docs + PR
- docs/STATE.md + docs/ARCHITECTURE.md reflect the new model; PR opened; CI green; post-merge Release/CD green.

## Technical Notes

- One local branch `feat/convergence-saga`; layer phases as forward commits; open the PR ONCE at the end; squash-merge.
- Fold in the stashed place-gating fix (stash@{0}) where SS-6/SS-8 handle the east_coast destination ground.
- Preserve the v0.7.0 authored Epoch-0 — it becomes the GOAP-seeding step (SS-7).
- GenAI key in gitignored .env (`set -a; source .env; set +a`); never commit it.
- Yuka: use ONLY src/goal/* equivalents; inject createRng where randomness is needed.

## Risks

- GenAI generation volume (SS-12) is large — run per-scope, cull aggressively, keep one corpus.
- Determinism with Yuka — verified by SS-2/SS-3 round-trip + SS-15 replay test; the goal core is pure.
- Scope is a full rebuild — mitigated by the dependency order (engine → roster → world → spine → flesh → UI → gate) and per-task green gate.
