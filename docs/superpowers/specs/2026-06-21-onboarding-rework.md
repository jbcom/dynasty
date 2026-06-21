---
title: Onboarding Rework — choose everything, bury the seed
updated: 2026-06-21
status: current
domain: product
---

# Onboarding Rework (OB-*)

## Why

The PL-3 "consciousness phase" (three abstract adjective/adjective/noun cards that secretly
composed the run seed) is confusing: too many vague choices, none of which let the player
actually *discern* anything. The user's correction:

> "Drop all these vague diegetic choices. Shuffle a random seedrandom seed at every New Game
> and lock it to that new game, buried. Then go back to choosing a location, then interacting
> with midwife/parents at birth, choosing gender, hearing (choosing) your family name and
> given name, and as you grow into womanhood/manhood choosing your calling."
>
> "Player picks EVERYTHING — this is a game about choice, cause and effect. The buried PRNG
> seed is for everything else: world events triggering, markets, etc."

## Design

### The seed is pure hidden RNG
At New Game, generate a random seed (a fresh seedrandom draw) and lock it to the run. It is
NEVER shown and the player never authors it. It drives only the WORLD around the player's
choices: world-timeline event firing, markets/systemic ticks, mortality rolls, procedural
event materialization, given-name *pool* draws when the player doesn't type one, trait
variation. The player's identity is 100% chosen, not dealt.

### Onboarding = a sequence of real choices

```
New Game (random hidden seed)
  1. CHOOSE LOCATION — concrete, discernible sensory-cue cards ("salt-air and the smell of
     fish" → Ireland). The player picks WHERE the line is founded. Place → era (the place's
     validEra) + default culture.
  2. BIRTH — a short midwife/parents beat (flavor + the moment of arrival).
  3. CHOOSE GENDER — the player chooses (not "hears" a dealt value).
  4. CHOOSE FAMILY NAME — culture-appropriate suggestions + "name your own" (keep the modal).
  5. CHOOSE GIVEN NAME — culture-appropriate suggestions + "name your own".
  6. CHOOSE CALLING — as the child grows, the player picks the founding calling, which sets
     the line's ARCHETYPE (the calling→archetype mapping; calling is the diegetic face of
     the power base).
  → found the run with the fully player-chosen composition; play begins.
```

`resolveComposition(place, { era, year, archetype, gender, surname, given?, culture, calling })`
is the single founding seam — it already accepts every field as an explicit input, so the
onboarding just gathers player choices and calls it. No seed-derived identity.

### Resolutions for fields the user didn't name explicitly
- **era**: determined by the chosen place (its validEra; modern places = origins/1885,
  baghdad = caliphate). Not a separate choice.
- **archetype = the calling choice** (user decision 2026-06-21: "Calling IS the archetype
  choice"). The final "choose your calling" step picks ONE of the 6 archetypes directly,
  shown with a diegetic title: economic→"The Magnate", political→"The Statesman",
  technological→"The Visionary", religious→"The Prophet", entertainment→"The Star",
  athletic→"The Champion". One system: the pick sets `composition.archetype` (which already
  gates content). The old `callings.json` trait/trope lens is NOT used by onboarding (it can
  stay as a later trope-weighting detail; not part of this rework).
- **given name**: NEW — currently the given name is auto-picked from the onomastics pool.
  Add a given-name choice (suggestions from the culture pool + type-your-own), parallel to
  the surname bestowal.

### What is removed
- `src/sim/seedComposer.ts` + `src/data/seed-words.json` + the consciousness phase in
  OnboardingScreen and their tests — the whole adj/adj/noun seed-authoring path.
- `composeSeed`/`seedLane`/`SEED_LANES` usage everywhere.

### Determinism / save
Save = the run seed (now random, still stored) + the player's chosen composition + history.
Replay is bit-identical for a given (seed, choices). The seed being random at New Game means
a *new* game differs run-to-run (intended — the world is freshly shuffled), but a SAVED game
replays exactly.

## Sub-tasks (OB-1 … OB-n)
- OB-1: spec (this doc).
- OB-2: random hidden seed at New Game; onomastics given-name suggestions helper (parallel
  to suggestSurnames); calling→archetype mapping surfaced for the picker.
- OB-3: rebuild OnboardingScreen as the choice sequence (location → birth → gender → family
  name → given name → calling); remove the consciousness phase.
- OB-4: delete seedComposer + seed-words.json + their tests; drop the now-dead
  emerged/named pre-set if the in-game beats should run again, OR keep them — decide so the
  in-game Epoch-0 doesn't double up with the onboarding (the onboarding now covers birth +
  gender + naming + calling, so the in-game gender/calling beats may be redundant; re-check).
- OB-5: rewrite e2e + component tests for the new flow; live-verify; 0 leaks; gate green.

## Acceptance
- New Game → location pick (discernible cues) → birth → gender → family + given name →
  calling, all player-chosen; seed never shown.
- Same choices replay identically; a new game reshuffles the world seed.
- 0 preset-person leaks; harness audit 0 findings; full gate green; live-verified.
