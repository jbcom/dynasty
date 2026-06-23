/**
 * EI-4 FORMATIVE BEATS (EMERGENT-INFANCY ONBOARDING) — the lived childhood→youth of Epoch 0.
 *
 * Authored saga scenes (real copy) that carry the un-retired Epoch-0 opening from childhood
 * (epoch0:childhood → epoch0:formative) through the formative moments the user named — first friend,
 * early schooling, first betrayal, first loss, first romance — each a SCENE that gives lived texture AND
 * lets an identity facet crystallize: a life-seed flag + a nudge toward a POWER BASE (the line's bent).
 * Spec: docs/superpowers/specs/2026-06-23-emergent-infancy-onboarding-design.md.
 *
 * Pure data + pure builders: no DOM, no Date, no Math.random. The power-base nudges are diegetic — they
 * stamp `power:<base>` lean flags (the same vocabulary as foundingOrigin's base flags) that EI-6 reads when
 * composing, so the archetype EMERGES from how the childhood is lived rather than being picked on a card.
 */

import type { Scene } from "../saga/schema";

/** The power-base lean a formative choice can nudge (matches foundingOrigin PowerBase flags). */
const leanFlag = (base: string): string => `power_lean:${base}`;

/** EI-4: the FIRST FRIEND — the first bond outside the family; who the child is drawn to reveals a bent. */
function firstFriendScene(): Scene {
  return {
    id: "epoch0:formative",
    sense: "sight",
    prose: [
      "There is a first face that is not family — a child met across a fence, a pew, a muddy lane — and the world doubles in size.",
      "{given_name} learns the thing every line learns young: that other people are doors. Some you walk through; some you stand at.",
    ],
    beats: [
      {
        prose: ["You measure the other child the way you will measure everyone after."],
        choice: {
          text: "Meet them.",
          motivatorShift: {},
          setFlags: ["epoch0:first_friend"],
          gather: true,
        },
      },
    ],
    decision: {
      tier: "secondary",
      prompt: "What draws {given_name} to this first friend?",
      options: [
        {
          text: "They have things — and know how to get more.",
          motivatorShift: {},
          setFlags: ["seed:friend_trader", leanFlag("commerce")],
        },
        {
          text: "They speak, and others listen.",
          motivatorShift: {},
          setFlags: ["seed:friend_orator", leanFlag("pulpit")],
        },
        {
          text: "They are bold where you are careful.",
          motivatorShift: {},
          setFlags: ["seed:friend_daring", leanFlag("military")],
        },
      ],
    },
    thread: [],
    braidSlots: [],
    requires: { flags: ["epoch0:childhood_seen"], notFlags: [] },
    next: "epoch0:schooling",
  };
}

/** EI-4: EARLY SCHOOLING — what the child is taught, and what they take to, nudges the line's instrument. */
function schoolingScene(): Scene {
  return {
    id: "epoch0:schooling",
    sense: "sight",
    prose: [
      "Schooling, such as it is, arrives — a hornbook by the fire, a circuit preacher's catechism, a clerk's borrowed primer, or the harder schooling of work begun too young.",
      "{given_name} takes to some of it and chafes at the rest, and in that grain the line's instrument shows.",
    ],
    beats: [
      {
        prose: [
          "One lesson catches and holds, the way a key fits a lock you did not know you carried.",
        ],
        choice: {
          text: "Learn it.",
          motivatorShift: {},
          setFlags: ["epoch0:schooled"],
          gather: true,
        },
      },
    ],
    decision: {
      tier: "secondary",
      prompt: "What does {given_name} learn best?",
      options: [
        {
          text: "Letters, contracts, the law's exact words.",
          motivatorShift: {},
          setFlags: ["seed:school_letters", leanFlag("law")],
        },
        {
          text: "Scripture, and how to move a room with it.",
          motivatorShift: {},
          setFlags: ["seed:school_scripture", leanFlag("pulpit")],
        },
        {
          text: "Numbers, ledgers, the weight of a coin.",
          motivatorShift: {},
          setFlags: ["seed:school_numbers", leanFlag("commerce")],
        },
        {
          text: "The land itself — soil, season, and yield.",
          motivatorShift: {},
          setFlags: ["seed:school_land", leanFlag("land")],
        },
      ],
    },
    thread: [],
    braidSlots: [],
    requires: { flags: ["epoch0:first_friend"], notFlags: [] },
    next: "epoch0:betrayal",
  };
}

/** EI-4: FIRST BETRAYAL — the first wound from a trusted hand; the line learns what it does with a debt. */
function betrayalScene(): Scene {
  return {
    id: "epoch0:betrayal",
    sense: "touch",
    prose: [
      "And then the first betrayal — small, by the measure of later years, and enormous by the measure of a child.",
      "A trust is broken: a friend turns, a promise is spent, a hand you leaned on lets you fall. {given_name} feels the particular cold of it, and decides — without words — what such a thing is worth.",
    ],
    beats: [
      {
        prose: ["The wound will close. What it leaves behind is a rule the line keeps."],
        choice: {
          text: "Take the lesson.",
          motivatorShift: {},
          setFlags: ["epoch0:first_betrayal"],
          gather: true,
        },
      },
    ],
    decision: {
      tier: "secondary",
      prompt: "What does {given_name} take from the first betrayal?",
      options: [
        {
          text: "Never be owed to — hold the leverage yourself.",
          motivatorShift: { cunning: 8 },
          setFlags: ["seed:betrayal_leverage", leanFlag("commerce")],
        },
        {
          text: "Answer a wrong in kind, and be seen to.",
          motivatorShift: { honor: -8 },
          setFlags: ["seed:betrayal_reprisal", leanFlag("military")],
        },
        {
          text: "Bind people with something stronger than trust — law, oath, blood.",
          motivatorShift: { tradition: 8 },
          setFlags: ["seed:betrayal_bind", leanFlag("law")],
        },
      ],
    },
    thread: [],
    braidSlots: [],
    requires: { flags: ["epoch0:schooled"], notFlags: [] },
    next: "epoch0:loss",
  };
}

/** EI-4: FIRST LOSS — a death/parting; the line's first reckoning with mortality + what it hardens into. */
function lossScene(): Scene {
  return {
    id: "epoch0:loss",
    sense: "sight",
    prose: [
      "Death comes early to the household, as it came early to every household then — a parent, a sibling, the friend from the fence.",
      "{given_name} stands at the first grave that matters and learns the oldest fact: the line goes on, or it does not, and someone must decide to carry it.",
    ],
    beats: [
      {
        prose: ["Grief is a country you do not leave the same as you entered."],
        choice: {
          text: "Bear it.",
          motivatorShift: {},
          setFlags: ["epoch0:first_loss"],
          gather: true,
        },
      },
    ],
    decision: {
      tier: "secondary",
      prompt: "What does the first loss make of {given_name}?",
      options: [
        {
          text: "A resolve that the name will outlast any one of us.",
          motivatorShift: { lineage: 10 },
          setFlags: ["seed:loss_lineage", leanFlag("land")],
        },
        {
          text: "A hunger to matter while there is time.",
          motivatorShift: { reach: 10 },
          setFlags: ["seed:loss_ambition", leanFlag("press")],
        },
        {
          text: "A faith that there is more than this — and a calling to say so.",
          motivatorShift: { worldview: -10 },
          setFlags: ["seed:loss_faith", leanFlag("pulpit")],
        },
      ],
    },
    thread: [],
    braidSlots: [],
    requires: { flags: ["epoch0:first_betrayal"], notFlags: [] },
    next: "epoch0:romance",
  };
}

/**
 * EI-4: FIRST ROMANCE — the threshold into adulthood; the first love both texture AND the seed of the line
 * CONTINUING. Its close carries the kept Epoch-0 succession mechanic (takesPartner) — the emergence ends
 * with the progenitor stepping toward the next generation, which is where Act 1 proper begins.
 */
function romanceScene(): Scene {
  return {
    id: "epoch0:romance",
    sense: "touch",
    prose: [
      "And then, at the edge of childhood, the first romance — clumsy and total, the way the first of anything is.",
      "{given_name} is no longer only a child of the {family_name} line. They are the start of its next turning — if they choose to be.",
    ],
    beats: [
      {
        prose: [
          "The world narrows to one face, then widens again to hold a future that was not there before.",
        ],
        choice: {
          text: "Let it in.",
          motivatorShift: {},
          setFlags: ["epoch0:first_romance"],
          gather: true,
        },
      },
    ],
    decision: {
      tier: "major",
      prompt: "{given_name} stands grown at the threshold. How does the line begin in earnest?",
      options: [
        {
          text: "Take a partner, and make a beginning.",
          motivatorShift: { lineage: 6 },
          setFlags: ["seed:romance_partner", "epoch0:emerged"],
          succession: { takesPartner: true, begets: 0 },
        },
        {
          text: "Carry the line alone for now — the work first, love after.",
          motivatorShift: { reach: 6 },
          setFlags: ["seed:romance_solo", "epoch0:emerged"],
        },
      ],
    },
    thread: [],
    braidSlots: [],
    requires: { flags: ["epoch0:first_loss"], notFlags: [] },
    // The emergence completes — Act 1 proper begins. EI-6 wires this hand-off to the spine.
  };
}

/**
 * The full EI-4 formative chain (in order), continuing the Epoch-0 opening from childhood to the threshold
 * of adulthood: first friend → schooling → betrayal → loss → romance. Each sets a life-seed + a power-base
 * lean; the romance close carries the succession hand-off. Pure builder.
 */
export function buildFormativeBeats(): Scene[] {
  return [firstFriendScene(), schoolingScene(), betrayalScene(), lossScene(), romanceScene()];
}

export { leanFlag };
