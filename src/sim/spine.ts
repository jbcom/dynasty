/**
 * SPINE (Convergence Saga, SS-10) — the authored SKELETON the GenAI flesh hangs on.
 *
 * Humans author the SPINE (the bones: which acts exist, their order, the beat slots in each, and
 * which motivator-shifts route between them) + the CIRCULATORY system (how a line moves act→act by
 * macro-act + reach tier). GenAI (SS-11/12) writes the FLESH — the actual prose for each beat slot,
 * seeded by the cell (wave × class × macro-act × archetype). This module is the pure structural
 * scaffold: it enumerates the act lattice and resolves, for any line-state cell, the ordered beat
 * slots that must be generated. No prose here — only the bones. Pure + deterministic.
 */

import type { Rung } from "./classRung";
import type { MacroAct } from "./macroActs";
import type { Archetype } from "./slots";

/** A beat slot in an act — the unit GenAI fleshes. `sense` biases the EXPERIENCED-vs-CHOSEN register. */
export interface BeatSlot {
  id: string;
  /** Whether this beat is EXPERIENCED (sensory/passive — a life lived) or CHOSEN (a fork). */
  register: "experienced" | "chosen";
  /** A short authorial intent the GenAI prompt fills (what this beat is FOR). */
  intent: string;
}

/** An act = one generation's life, a sequence of beat slots, within a macro-act. */
export interface ActScaffold {
  id: string;
  macroAct: MacroAct;
  /** The reach tier this act belongs to (0 personal … 5 interstellar). */
  tier: number;
  title: string;
  beats: BeatSlot[];
}

/** The universal life-arc beat slots every act carries (the per-generation spine). */
function lifeArc(actId: string): BeatSlot[] {
  return [
    {
      id: `${actId}:birth`,
      register: "experienced",
      intent: "born into the act's world — overhear the year; the line emerges",
    },
    {
      id: `${actId}:naming`,
      register: "chosen",
      intent: "the given name is bestowed (a first character anchor)",
    },
    {
      id: `${actId}:station`,
      register: "experienced",
      intent: "the child reads the form + function of life around them (class/station emerges)",
    },
    {
      id: `${actId}:schooling`,
      register: "chosen",
      intent: "a teacher/first pressure bends the calling",
    },
    {
      id: `${actId}:calling`,
      register: "chosen",
      intent: "the calling crystallizes into the archetype power-base",
    },
    {
      id: `${actId}:turn`,
      register: "chosen",
      intent:
        "the act's pivotal choice — how the line shapes (or is shaped by) its world this generation",
    },
    {
      id: `${actId}:close`,
      register: "experienced",
      intent: "the generation closes; what it passes to the heir",
    },
  ];
}

/** The macro-act each reach tier belongs to + the act title shape. */
const TIER_PLAN: ReadonlyArray<{ tier: number; macroAct: MacroAct; title: string }> = [
  { tier: 0, macroAct: "convergence", title: "The Crossing" },
  { tier: 1, macroAct: "convergence", title: "The New Ground" },
  { tier: 2, macroAct: "emergence", title: "The Climb" },
  { tier: 3, macroAct: "emergence", title: "A Name in the World" },
  { tier: 4, macroAct: "ascension", title: "The World Player" },
  { tier: 5, macroAct: "ascension", title: "The Reach for the Stars" },
];

/** A cell the spine is authored for — the coordinates GenAI flesh is generated against. */
export interface SpineCell {
  wave: string;
  cls: Rung;
  archetype: Archetype;
}

/**
 * The ordered act scaffolds for a cell: one act per reach tier, each a generation's life-arc,
 * banded into the right macro-act. This is the complete bone-structure GenAI fleshes for a line.
 * Pure + deterministic.
 */
export function spineFor(cell: SpineCell): ActScaffold[] {
  return TIER_PLAN.map(({ tier, macroAct, title }) => {
    const actId = `act:${cell.wave}:${cell.archetype}:t${tier}`;
    return { id: actId, macroAct, tier, title, beats: lifeArc(actId) };
  });
}

/** Every beat slot in a cell's spine, flat — the full set GenAI must flesh for that line. */
export function beatSlotsFor(cell: SpineCell): BeatSlot[] {
  return spineFor(cell).flatMap((a) => a.beats);
}

/** The reach tiers the spine covers (0..5) — used by the acceptance check that every cell is reachable. */
export const SPINE_TIERS = TIER_PLAN.map((t) => t.tier);
