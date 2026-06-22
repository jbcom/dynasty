---
title: WV-3 — Emergent Variability (anti-Suzerain)
updated: 2026-06-22
status: draft
domain: technical
---

# WV-3 — emergent variability so playthroughs diverge

The north star ([[emergent-cause-effect-sim]]): avoid the Suzerain trap where players net-share an
optimal A→Z walkthrough. Each cause must create an effect, with enough seeded variability + reactive
agents that two runs diverge — accepting that the authored spine must cover a far wider state space.

## What already exists (audit first — don't rebuild)

- **Systemic tick** (`src/sim/systemic.ts`, SIM1): per-year, markets walk (regime hazard → AR(1) price
  step → meter transmission + housing cashflow), currency resolves (redenomination on change), rank
  ladders drip/amplify/bleed into meters. Fully seeded/deterministic (rng.fork; no Math.random/Date).
- **Rival world / Yuka GOAP** (`dynastyWorld.ts` + `dynastyAgent.ts` + `goap/`): rivals PLAN each turn
  (GOAP), the active epoch's tide drives their rise/fall, the player's crossings nudge them (WV-1/2).
- **WV-2 emergent crossings**: bias-weighted, era-gated, seeded — already a divergence source.

So the substrate is strong. WV-3 is an AUDIT + targeted EXTEND, not a from-scratch build.

## Use cases (the divergence levers)

1. **Market variability** — already present. Audit: does a run's market path actually swing outcomes,
   or is it cosmetic? Are the regime-hazard + AR(1) params tuned so a boom/bust genuinely reshapes a
   line's arc (not just a meter wiggle)? Extend only if measured flat.
2. **Disease / mortality shock** — the named gap. A seeded, era-weighted hazard that can take a family
   member (or strike a meter) — so succession + the line's path aren't fully player-controlled. The
   succession mechanic (WV-2 close decisions) exists; disease feeds it an exogenous, seeded mortality
   pressure. This is the clearest new divergence source.
3. **Reactive rivals** — Yuka rivals already plan; audit whether their actions visibly change the
   player's options (crossings, market pressure, rung competition) or stay in the convergence panel.

## Decision (provisional — confirm by the audit)

WV-3 = (a) an AUDIT pass measuring divergence: run N seeds of the same composition, diff the
outcomes/arcs, quantify how much markets + rivals + crossings already spread them; THEN (b) build the
highest-leverage missing lever. Strong prior: a **seeded disease/mortality hazard** (use case 2) is the
biggest gap and the most narratively potent (it forces unplanned succession). Markets + rivals likely
need tuning, not rebuilding.

This is deliberately AUDIT-FIRST: the existing emergent layers may already deliver most of the
divergence, and the directive's "magnitudes more writing" cost lands on covering the states they
produce — not on bolting on more systems blindly.

## Build order

1. Divergence audit: a script/test that runs the same composition under M seeds and reports outcome
   spread (final tier, ending kind, family size, key meters) — quantify current emergence.
2. From the audit, pick the highest-leverage lever. (Prior: seeded disease/mortality hazard in the
   systemic tick — a per-year, era-weighted, seeded chance to strike a member/meter, feeding succession.)
3. Build it pure + seeded (rng.fork, replay-identical) + tested; wire into `applyChoice`'s systemic tick.
4. Re-run the audit to confirm divergence increased; author/GenAI the content the new states need
   (the "magnitudes more writing" — e.g. disease/loss scenes, recovery arcs).

Determinism is non-negotiable: variability is SEEDED (same seed + choices → identical run); emergence ≠
nondeterminism ([[emergent-cause-effect-sim]]).
