---
title: UQ-3 — The Crime Power Axis
updated: 2026-06-22
status: draft
domain: creative
---

# UQ-3 — The Crime Power Axis (the 7th power base)

## Mandate

> "you know this is bringing up an entirely ignored power axis to add to your directives.
> chinese italian irish — there are several which historically also FOUNDED crime families,
> and the axis of power there is such that it could easily result in an entirely unexplored
> fiction to intersect with a dictatorial endgame. a crime planet." — user, 2026-06-22

Add organized crime as a seventh ARCHETYPE — a power base a founded line is built on, peer to
economic/political/technological/religious/entertainment/athletic. It is **researched, not assumed**
([[research-not-memory]]): the crime arc per people is the one already fact-corrected into
`src/data/saga/guidance.json` (UQ-1b). Its convergence endgame is a net-new dark destination — the
**crime planet**, a dictatorial reach-state no legitimate archetype can reach.

This is a milestone: **design (this doc) → build (schema + GOAP + endings) → generate (corpus +
crossings)**. It depends on UQ-2 (the corpus auto-correct) landing first so we extend a corrected base.

## What the research actually licenses (the spine, from UQ-1b)

The crime archetype is NOT available to every wave — that would be the stereotype the research
explicitly debunks. It is **gated by each people's documented crime history**:

| Wave | Crime track? | Real spine (from guidance.json `waves[*].crime`) |
|------|-------------|---------------------------------------------------|
| **ireland** | YES — the FOUNDER | Five Points gangs → Prohibition (O'Banion, Madden) → Winter Hill / Westies; gang-to-politics pipeline. |
| **italian** | YES — the SUCCESSOR | Built-in-America Mafia; Castellammarese War → Five Families + Commission (1931); RICO decline. |
| **ashkenazi_jewish** | YES — but TIME-BOUNDED | Rothstein → Lansky/Siegel Syndicate → Murder Inc. (~70 kills); dissolves into legitimacy in a generation. |
| **chinese** | YES — but WEST-COAST + distinct | Criminal fighting tongs (≠ the benevolent Six Companies); SF Tong Wars to ~1921. |
| **bavaria** (German) | NO | Brewers were Prohibition VICTIMS, not cartel-builders. Do not invent. |
| **scandinavian** | NO | Pietist-Lutheran, pro-temperance, documented near-zero. Do not invent. |
| **baghdad** | NO | Elite merchant/finance; opium was era-legal British commerce, not crime. Do not invent. |

**Design consequence:** a `criminal` archetype is only OFFERABLE at founding for ireland / italian /
ashkenazi_jewish / chinese. For the other three it is not a calling the player can pick — and the
saga's other-lines simulation never spawns a criminal line of those waves. This gating IS the
anti-stereotype guardrail, enforced in data.

Each of the four crime-capable waves gets its OWN crime shape (not one template):
- **ireland** — the street-gang → bootleg → neighborhood-firm → into-politics arc (the founder's arc).
- **italian** — the family/Commission arc: the most structured, succession-heavy, the classic rise/RICO-fall.
- **ashkenazi_jewish** — the syndicate-financier arc that *exits* crime into legitimacy within ~2 tiers
  (the time-bounded truth — a crime line that, uniquely, can convert to an economic line).
- **chinese** — the tong arc, West-Coast, vice-economy, gated by the bachelor-society + exclusion era.

## Architecture decisions

### 1. `criminal` is a real Archetype, not a calling-skin

It joins `Archetype` in `src/sim/slots.ts` (the union, `ARCHETYPES`, `ARCHETYPE_CALLINGS`). Calling
face: **"The Boss"** — summons e.g. *"The law is a wall built to keep you out. You will own what
happens in its shadow."* The archetype id `criminal` is the mechanical key.

**Why an archetype and not a motivator coloring of `economic`:** the corpus is generated per
wave×archetype×class (the 84 act files = 7 waves × 6 archetypes × 2 classes today). A crime line's
acts, trades, obstacles, crossings, and ending are structurally distinct enough that they need their
own generation track + their own spine guidance — exactly the per-(era×class) bespoke briefs UQ-1
established. A coloring would force crime through the magnate's spine and re-introduce the sameness
UQ-1 fought.

### 2. Corpus breadth: +1 archetype × 4 eligible waves × 2 classes = +8 act files (not +14)

Because crime is wave-gated, we do NOT generate `criminal` tracks for the 3 non-crime waves. New
files: `{ireland,italian,ashkenazi_jewish,chinese}/criminal.{poor,middle}.act.json` = 8 files, each a
6-tier chain. Generation reuses the UQ-1 pipeline (`spineFor` + bespoke guidance + `genai:expand`),
with a new `guidance.json` block: `eras["t<tier>.<class>"]` crime briefs + a `crimeArc` per eligible
wave (the four shapes above).

### 3. GOAP strategy: a `criminal` evaluator in the other-lines sim

The convergence sim advances all lines as forces. A criminal line's GOAP differs: it gains power via
illicit markets (gated by epoch — Prohibition is its windfall, RICO/1970 its existential threat), it
preys on and allies with legitimate lines (the crossings), and it converts heat→power or power→
legitimacy. The athletic/economic evaluators are the template; crime adds an **illicit-market state**
input (high during Prohibition 1920-33, decaying after RICO) read like `epochImpact`.

### 4. Crossings: crime ↔ legitimate lines are the richest braids (already in the research)

The verified braid affinities are crime-laden and become the WV-2 braid pool for criminal lines:
- **irish-crime ↔ italian-crime**: rivalry → succession (Italians displaced the Irish atop the rackets).
- **italian-crime ↔ ashkenazi-crime**: the joint National Syndicate / Murder Inc. (the key braid).
- **crime ↔ political** (Irish gang→Tammany; the gang-to-politics pipeline): crime buys office.
- **crime ↔ economic** (Prohibition bootlegging supplies the legitimate saloon/economy).
These weave at braid slots like every other crossing — no bespoke per-pair writing (WV-2 model).

### 5. The crime-planet ending: a new dark Destination in the convergence lattice

`src/sim/convergence.ts` gains a destination beyond stars/contributed/earthbound/extinguished:

- **`syndicate`** — the dynasty did not colonize the stars for humanity; it captured them. A
  dictatorial reach-state: the family's illicit power compounded across centuries into control of the
  off-world economy itself. Gated `{ power: {min: 60}, honor: {max: -20} }`, `minTier: 5`, and
  **requires the line carried the `criminal` archetype** (or converted from it). Two sub-variants per
  the existing benevolent/dark pattern:
  - `syndicate_dictator` — "Don of a Thousand Suns" (the crime planet: one family's omertà is law).
  - `syndicate_consigliere` — the line that ran the shadow economy of someone else's empire.

The OTHER lines' fates fold in as today — under a syndicate ending, the legitimate lines you crossed
appear as the ones you co-opted, taxed, or broke.

## Build order (the milestone, after UQ-2)

1. **Schema + archetype** — add `criminal` to `Archetype`/`ARCHETYPES`/`ARCHETYPE_CALLINGS`; gate it
   to the 4 eligible waves (a `CRIME_WAVES` set + offerability check in the calling beat + wave-select).
   Tests: the gate (non-crime waves never offer/spawn criminal), calling face present.
2. **Convergence ending** — add the `syndicate` destination + 2 endings + the archetype-gate to
   `meetsMotivatorGate` usage. Tests: only a criminal/converted line reaches it; gates hold.
3. **GOAP evaluator** — `criminal` strategy + the illicit-market epoch input. Tests: Prohibition
   windfall, RICO decline, deterministic.
4. **Guidance** — `guidance.json`: crime era×class briefs + the 4 per-wave `crimeArc` shapes (from the
   research). Wire into `buildScenePrompt` + the QA briefs (UQ-2 already reads the wave block).
5. **Generate** — `genai:expand` the 8 new act files; slot-tag them (WV-2) for crime crossings;
   `genai:qa` to frontier. Commit-before-run; git diff is the test.
6. **Live-verify** — play a founded crime line (e.g. italian/criminal/poor) end to end in Chrome:
   confirm the rise→Commission→RICO arc reads, crossings weave, and a syndicate ending is reachable.

## Anti-patterns (guardrails)

- **NEVER** give the crime track to scandinavian/bavaria/baghdad — the research forbids it; the gate
  is the anti-stereotype mechanism, in data not vibes.
- **NEVER** write the crime arc from the trope (Black Hand = org, Mafia transplanted, Murder Inc.
  hundreds of kills) — the `mythFlags` in guidance.json already correct these; the QA pass enforces.
- The ashkenazi crime track MUST be able to EXIT into legitimacy by tier ~2 — that's the documented,
  un-clichéd truth and the most interesting mechanic (the only archetype that converts).
- Crime ≠ pure villainy in the prose: it's a power base under contempt/exclusion, the same frame as
  every other immigrant arc — kept human, never cartoonish.
