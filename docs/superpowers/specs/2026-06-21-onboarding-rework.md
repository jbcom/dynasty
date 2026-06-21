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
>
> "Don't RUSH Epoch-0. It isn't a quick replacement of the control panel — it's the
> unfolding of a story in its first stage. Weave these organically into a FULLY WRITTEN
> birth-to-man/womanhood: finding the first run of the calling, finding a partner, making
> the choices that determine the entire unique branching storyline for the rest of the run.
> EACH PLACE and EACH TIME needs a fully written-out Epoch-0."

## Scope correction — Epoch-0 is authored STORY, not a UI control panel

The earlier framing (a generic OnboardingScreen of pick-cards) is wrong. Epoch-0 is the
FIRST STAGE OF THE STORY: a fully-written birth → growing into man/womanhood → the first
turn of the calling → finding a partner → the pivotal choices that set the line's branching
storyline. The player's identity choices (location, gender, family + given name, calling)
are woven into that prose as real beats — not abstract menu steps.

CONSEQUENCE: this is primarily AUTHORED CONTENT, not just a screen. **Each place × era needs
its own fully-written Epoch-0 arc** (a Bavarian 1885 birth reads differently from a Baghdad
762 one or an Irish 1885 one). The UI is the thin renderer (the existing EventCard +
choices); the WORK is writing each origin's Epoch-0 beats with the identity choices embedded
and the branch-setting forks at the end. The seed stays buried (world only); identity is all
chosen, beat by beat.

This is a multi-place authoring effort — do ONE place's Epoch-0 fully first (vertical slice:
e.g. Ireland/origins — birth+date → gender → naming → growing up → first calling turn →
partner → branch fork), prove the shape end-to-end, then replicate per place × era.

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
  1. CHOOSE LOCATION (GEOGRAPHY) — concrete, discernible sensory-cue cards ("salt-air and
     the smell of fish" → Ireland). The player picks WHERE the line is founded → place +
     default culture. GEOGRAPHY ONLY — not the time.
  2. BIRTH + DATE (CHRONOLOGY) — the doctor/midwife (informed by the chosen place) records
     the birth: a seed-drawn random MONTH + DAY, narrated as a full date — "You hear the
     doctor make careful notes… born Sep 6, 1885." / "…born March 3, 768." The stated date
     makes the chronology concrete AND informs the ERA choice (a place with >1 valid era
     offers the era as the choice the date frames; a single-era place states its year).
  3. CHOOSE GENDER — the player chooses (not "hears" a dealt value).
  4. CHOOSE FAMILY NAME — culture-appropriate suggestions + "name your own" (keep the modal).
  5. CHOOSE GIVEN NAME — culture-appropriate suggestions + "name your own".
  6. CHOOSE CALLING — as the child grows, the player picks the founding calling = the
     ARCHETYPE (diegetic title on the power base).
  → found the run with the fully player-chosen composition; play begins.
```

### Geography ≠ chronology (user, 2026-06-21)
PLACE (where) and ERA/DATE (when) are SEPARATE concerns and must be handled separately.
- **Place** is the geographic choice (step 1).
- **Date** is chronological: the buried seed draws a month + day; the doctor narrates the
  full date ("born Sep 6, 1885"). The YEAR comes from the era; the month/day are flavor
  drawn from the seed (world layer, not identity). A `birthDate` (month/day) is recorded on
  the composition/state so later beats can reference it. The era, when a place offers more
  than one, is the chronological CHOICE the stated date sets up.

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
- OB-1: spec (this doc). DONE.
- OB-2: seam + helpers (no UX yet) — random hidden seed at New Game; `suggestGivenNames`
  (done); archetype→diegetic-title map; seed-drawn birth `{month, day}`; a `birthDate` field
  on the composition/state; the Epoch-0 beat-flag chain the authored arc will gate on.
- OB-3: REMOVE the consciousness phase — delete `src/sim/seedComposer.ts`,
  `src/data/seed-words.json`, their tests, and the adj/adj/noun UI; New Game → location pick
  → the authored Epoch-0 run (no separate "compose seed" step). Founding flags revisited so
  the authored Epoch-0 beats actually fire (the PL-3 `emerged`/`named` pre-set is removed or
  repurposed — the story now PLAYS those beats).
- OB-4: VERTICAL SLICE — author ONE place×era's full Epoch-0 arc end-to-end (Ireland/origins
  1885): location-recognition → birth+date (doctor's notes) → gender choice → family-name +
  given-name bestowal → growing into adulthood → first turn of the calling (= archetype) →
  finding a partner → the branch-setting fork. Real prose, real choices, 0 leaks. Prove the
  shape (the flag chain, the choice→composition wiring, the renderer).
- OB-5: REPLICATE the Epoch-0 arc per remaining place × era (bavaria, south_africa, west/
  east_coast, canada, midwest, south, baghdad/caliphate, …), each fully written + 0-leak.
- OB-6: tests (e2e + component + textQuality audit clean on the new prose) + harness audit
  0 findings + live-verify each origin; gate green; remove dead PL-3 paths.

This is a LONG authoring milestone (each place×era is real writing). Ship per-slice PRs
(OB-4 first as the proof, then one PR per place×era or a small batch), one in flight at a
time per the process lesson.

## Acceptance
- New Game → location pick (discernible cues) → a FULLY-WRITTEN Epoch-0 story (birth+date →
  gender → family+given name → adulthood → first calling turn → partner → branch fork),
  every identity choice player-made, woven into prose — per place × era.
- Seed never shown; same choices replay identically; a new game reshuffles the world seed.
- 0 preset-person leaks; textQuality audit clean; harness audit 0 findings; gate green;
  live-verified for each origin.
