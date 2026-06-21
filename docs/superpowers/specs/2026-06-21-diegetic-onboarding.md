---
title: Diegetic Onboarding — seed-in-choices + surname bestowal
updated: 2026-06-21
status: current
domain: product
---

# Diegetic Onboarding (PL-3)

## Problem

The title screen asks the player to type a **surname** and an optional **seed** before
the game starts. Both break immersion and leak the machinery:

- The seed is a raw config knob exposed to the player — the opposite of diegetic.
- The surname is bestowed by the family in the Epoch-0 naming beat *anyway*
  ("the {surname} line begins with you"), so asking for it up front is redundant and
  pre-empts the diegetic moment.

## Goal (user directive, 2026-06-21)

> Landing page should be New Game / Load Game / Settings. Epoch-0 is for diegetically
> emerging — pick your location, then suggest a surname through dialogue + choices from
> era/culture-appropriate suggestions OR enter your own via a non-disruptive input modal.
> Bind the seed phrase to an adjective-adjective-noun word-pool set and put those words
> INTO the first three choices via slots, so picking choices diegetically picks the seed
> without the player realizing. Never SHOW the seed — bury it in choices.
>
> Clarification: it doesn't change the flow, because the first emerging choices of Epoch-0
> can be non-specific enough that they could be anywhere — like the emerging threads of a
> baby's consciousness.

## Design

### Use cases (re-enumerated)

1. **Landing** — New Game / Load Game / Settings only. No surname, no seed field.
2. **Seed authorship** — the seed is COMPOSED from the player's first three choices, each
   carrying one word from an adjective / adjective / noun pool. The composed phrase IS the
   seed. Never displayed.
3. **Place discovery** — the existing emergence sensory-cue → place mechanic
   (`placeForCue`), but now downstream of the composed seed.
4. **Surname bestowal** — after place/era are known, offer era/culture-appropriate surname
   SUGGESTIONS as choices + an "enter your own" modal (non-disruptive overlay).

### The ordering, resolved (the key architectural point)

The sim is deterministic from a seed, and `dealComposition(seed)` deals place/era/archetype
up front. The redirect inverts authorship (the seed comes from choices) — but the user's
clarification dissolves the tension: **the first three beats are place-AGNOSTIC**
("emerging threads of a baby's consciousness"), so they can run before a place exists.

Flow:

```
New Game (no inputs)
  → CONSCIOUSNESS PHASE (3 place-agnostic beats): adjective → adjective → noun.
      Each choice contributes one pool word. The three words compose the seed phrase.
  → seed finalized → dealComposition(seed) deals place × era × archetype
  → EMERGENCE: the sensory-cue beat now RECOGNIZES the dealt place (placeForCue stays the
      diegetic place reveal); gender beat; then…
  → SURNAME BESTOWAL: choices = era/culture-appropriate suggestions + "name your own" modal
  → CALLING → partner → heirs → the normal deterministic run.
```

Determinism + replay are preserved: the SAVE still stores the finalized seed + the
composition + history, exactly as today. The only change is *how* the seed and surname are
authored — by choices/modal instead of text inputs. Same authored seed + same choices →
bit-identical run. The consciousness phase is a thin UI step that finalizes a seed string
before the existing founding seam (`dealComposition` → `foundByComposition`) runs unchanged.

### Seed word pool (adj / adj / noun)

A small curated pool of evocative, era-neutral words in three lanes (adjective, adjective,
noun) — e.g. *gilded · restless · tide*. The three picks join into the seed phrase
(`"gilded-restless-tide"`). Pool size sets the seed space (e.g. 8×8×8 = 512 distinct
authored seeds — ample for a deterministic dynasty hand, and every combination is a valid
seed string). Words are surfaced through the slot system so the consciousness beats read as
prose, not a word-picker.

### Surname suggestions

Onomastics gains per-culture **surname pools** (currently surnames are player-supplied
only). The bestowal beat draws a few culture-appropriate suggestions from the dealt
culture's pool + an "or name your own" action that opens a small modal overlay (focus-
trapped, ESC/backdrop to dismiss, does not unmount the play screen — no immersion jank).

## Non-goals

- Showing the seed anywhere in the UI (it stays buried).
- Changing the sim's determinism contract or save format (seed + composition + history).
- Reworking the post-naming life-stage beats (partner/heirs/calling) — unchanged.

## Acceptance

- Title screen has no surname/seed inputs; only New Game / Load / Settings.
- A full run authored entirely through choices + (optional) the surname modal, no typing
  required to start.
- Same choice sequence → same seed → same deterministic run (replay test).
- 0 preset-person leaks; harness audit 0 findings; gate green; live-verified.
