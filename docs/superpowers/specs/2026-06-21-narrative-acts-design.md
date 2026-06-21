---
title: Narrative Acts — the novel data model
updated: 2026-06-21
status: draft
domain: creative
---

# Narrative Acts — the novel data model

The played content must read as a NOVEL, not sentence-fragment events. This spec defines the
data model + flow for act-structured, multi-paragraph, sensory, interconnected story — grounded
in research of **Suzerain** (presentation/pacing/scale) and **ink/inkle** (storage/weave/threads).
It replaces the flat `eras/**/events.json` fragment model and retires the old Epoch-0 (which
re-confirms the period/wave the onboarding already locked).

## Principles (from the user + research)

- **Senses frame the choice.** A scene is sensory, immersive prose that sets up a decision — not
  a bare quiz. (Suzerain: read to understand the situation, then choose.)
- **Not every paragraph needs a choice.** Scenes are MULTI-PARAGRAPH and can be pure prose; take
  time to build a scene. (ink weave: most choices gather back to the main flow; only some fork.)
- **Titled ACTS per family.** Each line's possibilities-in-life + intersections, as named acts.
- **Novel length.** Suzerain is ~450k words. The corpus is GenAI-authored onto the spine.
- **Intersections.** Other families' lines braid into a scene (ink threads) when paths cross.
- **The onboarding already set WHEN (period) + WHERE (wave) + class — never re-confirm it.**

## Data model

```
ActChapter {
  id            // "act:<wave>:<archetype>:t<tier>"
  wave, archetype, tier, macroAct, title   // "Act I — The Crossing"
  scenes: SceneId[]                         // ordered scenes; the act is their sequence
}

Scene {            // ≈ an ink KNOT
  id
  sense            // sound|sight|touch|taste|smell — the sensory frame
  prose: string[]  // MULTI-PARAGRAPH novel prose ({surname}/{given_name}/… tokens resolve)
  beats?: Beat[]   // ≈ an ink WEAVE: a fall-forward chain; most beats gather, some divert
  decision?: Decision        // the scene's terminal choice (optional)
  thread?: ThreadRef[]       // cross-family intersection (ink thread) — braid another line in
  requires?: Gate            // motivator gate + flags
  next?: SceneId             // default fall-through when no decision diverts
}

Beat {             // a weave node inside a scene
  prose: string[]
  choice?: { text, motivatorShift?, setFlags?, gather?: true | divertTo?: SceneId }
  // gather:true → rejoins the scene's main flow (flavor); divertTo → forks to another scene
}

Decision {
  tier: "major" | "secondary"   // fate-fork vs lighter choice
  prompt
  options: { text, motivatorShift?, setFlags?, divertTo?: SceneId }[]
}

ThreadRef { wave, atTier }       // resolved at runtime against the multi-line world (SS-8)
Codex { id, title, body }        // OPTIONAL lore (Suzerain briefs) — never required to read
```

## Storage layout

- `src/data/saga/<wave>/<archetype>.act.json` — the act chapters (titles + ordered scene ids).
- `src/data/saga/<wave>/scenes/*.json` — the scene prose (one file per scene or small bundle),
  so a family's novel lives together, GenAI writes per-scene, files stay reader-sized.
- `src/data/saga/codex/*.json` — optional lore.
- Glob-loaded + zod-validated like the rest of content; cross-family threads resolved by reference.

This REPLACES `eras/**/events.json` for the played narrative (the world-timeline/backdrop facts
stay). The old per-place `epoch0.json` files are retired — the act spine's tier-0 act IS the
opening, and it does NOT re-establish when/where (onboarding set those).

## Flow in play

Act opens on its first scene → scene prose renders multi-paragraph (sense sets the mood) → a
weave of beats falls forward (most choices gather, nudging motivators; some divert) → an optional
terminal Decision (major/secondary) the prose framed → routes to the next scene → act closes on
the heir's act. Threads braid a rival line's scene-fragment in when the world says paths cross.

## GenAI authoring

The spine (`src/sim/spine.ts`, extended) declares the act/scene/beat SLOTS (sense + intent +
which are decision-bearing). The expander (`genai:expand --type scene`) writes the `prose[]` +
beat/decision text per slot, grounded in wave×class×era×motivators, validated through the gate
(0 leaks, in-voice, multi-paragraph). One corpus, canonical JSON, no `.gen.json`.

## Migration / scope

- New schema + loader for `src/data/saga/**`.
- Retire `epoch0.json` + the played `events.json` narrative path (world backdrop stays).
- Wire the act/scene reader into the engine + a Suzerain-style scene UI (multi-paragraph prose,
  optional codex, tiered choices) under `src/ui/saga/`.
- Acceptance: a run reads as a novel (multi-paragraph scenes, not fragments); no re-confirming
  period/wave; titled acts; intersections fire; 0 leaks; hour+; bit-identical replay.
