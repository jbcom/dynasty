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
