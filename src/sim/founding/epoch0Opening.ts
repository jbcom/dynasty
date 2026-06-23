/**
 * EI-3 EPOCH-0 OPENING ACT (EMERGENT-INFANCY ONBOARDING) — Epoch 0, un-retired.
 *
 * The progenitor's EMERGENCE, built on the saga substrate (Scene → Beat → Decision) so it renders through
 * the SceneReader's glowing inline-choice surface — NOT the old .card/.choices button menu. Real authored
 * copy (hand-written, in the game's voice). Spec:
 * docs/superpowers/specs/2026-06-23-emergent-infancy-onboarding-design.md.
 *
 * This module owns the FIRST scene — the BIRTH / sensory emergence — where the newborn's senses surface as
 * glowing inline beat-choices; attending a sense stamps an `attend:<sense>` flag, and the accumulated
 * attentions resolve (via EI-2 senseEmergence.resolvePlace) into the line's emergent PLACE. Later EI steps
 * (EI-4 formative beats, EI-5 naming) extend the act forward.
 *
 * Pure data + a pure builder: no DOM, no Date, no Math.random — the scene is deterministic given the
 * seeded cues. The builder takes the dealt SenseCues (EI-2) so the prose names the line's actual senses.
 */

import type { Scene } from "../saga/schema";
import { buildFormativeBeats } from "./epoch0Formative";
import type { SenseCue } from "./senseEmergence";

/** The flag a sense-attend beat stamps; EI-2's resolvePlace reads these back to crystallize the place. */
export const attendFlag = (sense: SenseCue["sense"]): string => `attend:${sense}`;

/** A human label for each sense, for the inline choice text ("Turn toward the sound."). */
const SENSE_VERB: Record<SenseCue["sense"], string> = {
  sound: "Turn toward the sound",
  smell: "Breathe it in",
  touch: "Feel where you are",
  taste: "Taste the air",
};

/**
 * Build the BIRTH scene of Epoch 0 from the dealt sense cues. The scene opens in the newborn's body — no
 * menu, no place named — and each sense is a glowing inline beat-choice whose prose IS the cue. Attending
 * a sense gathers (stays in the scene) and stamps `attend:<sense>`; the player may attend any/all before
 * the scene's close resolves the emergent place. Real copy.
 */
export function buildBirthScene(cues: readonly SenseCue[]): Scene {
  const byId = new Map(cues.map((c) => [c.sense, c]));
  // Order the beats sound → smell → touch → taste when present, so the prose has a steady sensory rhythm.
  const order: SenseCue["sense"][] = ["sound", "smell", "touch", "taste"];
  const beats = order
    .filter((s) => byId.has(s))
    .map((s) => {
      const cue = byId.get(s);
      if (!cue) throw new Error(`missing cue for ${s}`);
      return {
        prose: [`Before sight, before a name, there is ${cue.text}.`],
        choice: {
          text: `${SENSE_VERB[s]}.`,
          motivatorShift: {},
          setFlags: [attendFlag(s)],
          gather: true,
        },
      };
    });
  return {
    id: "epoch0:birth",
    sense: "sound",
    prose: [
      "You are born — though you do not yet know the word for it, nor for yourself, nor for the room that holds you.",
      "The world reaches you first as weather: a press of warmth, a wash of noise, a nearness of other bodies. Out of that blur, a few things insist.",
      "Attend to what crowds in. What you turn toward now will be the country your whole line is born into.",
    ],
    beats,
    // The CLOSE: a major decision that, by which sense the child finally settles into, lets the place crystallize.
    // (EI-2 senseEmergence.resolvePlace reads the attend:* flags; this decision is the moment the awareness sets.)
    decision: {
      tier: "major",
      prompt: "The blur narrows. Which sense becomes the world?",
      options: order
        .filter((s) => byId.has(s))
        .map((s) => {
          const cue = byId.get(s);
          if (!cue) throw new Error(`missing cue for ${s}`);
          return {
            text: `It is ${cue.text} — that is where you are.`,
            motivatorShift: {},
            setFlags: [attendFlag(s), "epoch0:place_resolved"],
          };
        }),
    },
    thread: [],
    braidSlots: [],
    requires: { flags: [], notFlags: [] },
    next: "epoch0:naming",
  };
}

/**
 * EI-3b — the NAMING scene. The parents name the child IN-FICTION (surname/given/gender spoken over the
 * cradle), not picked on a card. Identity tokens ({full_name}/{given_name}/{surname}/{family_name}) resolve
 * from the run's live family at render time (the term-resolution seam), so the dealt name renders here. The
 * lighter `secondary` decision is the child's first felt disposition — a faint nudge, not a power-base pick.
 * Real copy. (EI-5 deepens the naming mechanics; this is the diegetic naming beat itself.)
 */
export function buildNamingScene(): Scene {
  return {
    id: "epoch0:naming",
    sense: "sound",
    prose: [
      "A face leans close — the first face, vast and near — and a voice gives the warmth a shape.",
      "“A {child_kind},” it says, the gladness plain even to you who have no words yet — and then your name, the first that is only yours, given in the family's own tongue: {full_name}. The {family_name} line has a new pair of hands.",
      "You do not understand the words. You understand that they are about you, and that they are a kind of promise.",
    ],
    beats: [
      {
        prose: [
          "They say {given_name} again, softer, the way a thing is said when it is being decided to be loved.",
        ],
        choice: {
          text: "Hold to the voice.",
          motivatorShift: {},
          setFlags: ["epoch0:named"],
          gather: true,
        },
      },
    ],
    decision: {
      tier: "secondary",
      prompt: "What does the infant {given_name} reach for first?",
      options: [
        {
          text: "The bright thing — anything that glints.",
          motivatorShift: {},
          setFlags: ["epoch0:disposition_acquisitive"],
        },
        {
          text: "The voices — the room full of people.",
          motivatorShift: {},
          setFlags: ["epoch0:disposition_social"],
        },
        {
          text: "The quiet at the edge of it all.",
          motivatorShift: {},
          setFlags: ["epoch0:disposition_watchful"],
        },
      ],
    },
    thread: [],
    braidSlots: [],
    requires: { flags: ["epoch0:place_resolved"], notFlags: [] },
    next: "epoch0:childhood",
  };
}

/**
 * EI-3b — the CHILDHOOD bridge scene. The child grows into an awareness of the family's circumstances (the
 * house, the table, the work seen) — which is where STANDING begins to read — and the act turns toward the
 * formative beats (EI-4: first friend / betrayal / loss / romance / schooling). Real copy; the decision is
 * the first standing-felt fork (what the child learns the family IS), grounding class without a card pick.
 */
export function buildChildhoodScene(): Scene {
  return {
    id: "epoch0:childhood",
    sense: "sight",
    prose: [
      "The years that follow come in fragments that will harden, later, into memory: a table, a doorway, the particular light of the room where the family gathers.",
      "You learn the shape of the household before you learn its name for itself — who eats first, whose word ends an argument, what work fills the hands of the people you belong to.",
      "And you begin, without knowing it, to take the measure of where the {family_name}s stand.",
    ],
    beats: [
      {
        prose: [
          "There is plenty, or there is not; there is deference shown to your people, or there is none. The child reads it in the air.",
        ],
        choice: {
          text: "Learn where you stand.",
          motivatorShift: {},
          setFlags: ["epoch0:childhood_seen"],
          gather: true,
        },
      },
    ],
    decision: {
      tier: "secondary",
      prompt: "What does the young {given_name} come to understand the family to be?",
      options: [
        {
          text: "People of some standing — a name others already know.",
          motivatorShift: {},
          setFlags: ["epoch0:standing_established"],
        },
        {
          text: "People on the rise — owed nothing, reaching for everything.",
          motivatorShift: {},
          setFlags: ["epoch0:standing_rising"],
        },
      ],
    },
    thread: [],
    braidSlots: [],
    requires: { flags: ["epoch0:named"], notFlags: [] },
    // EI-4 authors the formative beats this flows into (first friend / schooling / …).
    next: "epoch0:formative",
  };
}

/**
 * The FULL Epoch-0 opening act (EI-3 + EI-4): birth → naming → childhood → the formative beats (first friend
 * → schooling → betrayal → loss → romance), in order, as one connected scene chain. The romance close
 * carries the succession hand-off that ends the emergence and begins Act 1 proper. A pure builder; the cues
 * come from EI-2's dealSenseCues for this seed. EI-5 deepens naming; EI-6 wires this into the engine.
 */
export function buildEpoch0Opening(cues: readonly SenseCue[]): Scene[] {
  return [
    buildBirthScene(cues),
    buildNamingScene(),
    buildChildhoodScene(),
    ...buildFormativeBeats(),
  ];
}
