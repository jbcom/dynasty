/**
 * SPINE (Narrative Acts model) — the authored SKELETON the GenAI flesh hangs on.
 *
 * Humans author the SPINE (the bones: which acts exist, their order, the SCENE slots in each, the
 * sensory frame + authorial intent of each scene, and which scenes bear the act's tiered decisions).
 * GenAI writes the FLESH — the multi-paragraph `prose[]`, the weave beats, and the decision text for
 * each scene slot, seeded by the cell (wave × class × macro-act × archetype × tier). This module is
 * the pure structural scaffold: it enumerates the act lattice and the ordered scene slots that must
 * be generated for any line-state cell. No prose here — only the bones. Pure + deterministic.
 *
 * It is NOT the old Epoch-0 (birth → name → station → schooling → calling). Onboarding already locked
 * WHEN (period) + WHERE (wave) + class; the spine does not re-establish them. The tier-0 act opens
 * in the lived moment of the line's founding and moves forward as a NOVEL — scenes, not a quiz.
 */

import type { Rung } from "./classRung";
import type { MacroAct } from "./macroActs";
import type { Sense } from "./saga/schema";
import type { Archetype } from "./slots";

/** A SCENE slot in an act — the unit GenAI fleshes into a page of the novel. */
export interface SceneSlot {
  id: string;
  /** The sensory frame the prose builds the moment through. */
  sense: Sense;
  /** A short authorial intent the GenAI prompt fills (what this scene is FOR). */
  intent: string;
  /** Whether this scene carries the act's tiered DECISION, and at what weight. */
  decision?: "major" | "secondary";
}

/** An act = one generation's life, a sequence of scene slots, within a macro-act. */
export interface ActScaffold {
  id: string;
  macroAct: MacroAct;
  /** The reach tier this act belongs to (0 personal … 5 interstellar). */
  tier: number;
  /** The class track this act belongs to (poor/middle/…) — class is a movable rung with its own story. */
  cls: string;
  title: string;
  scenes: SceneSlot[];
}

/**
 * The per-generation scene arc every act carries — a lived chapter, not a character-creation quiz.
 * Five scenes: an opening that drops us into the act's world (sensory, no when/where re-confirm), a
 * rising scene with a secondary decision, a midpoint that raises the stakes, the act's pivotal MAJOR
 * decision, and a close that hands forward to the heir. The senses rotate so the chapter is felt
 * through different lenses. GenAI writes the prose + weave + decision options per slot.
 */
function sceneArc(actId: string, tier: number): SceneSlot[] {
  // Each tier reframes the same arc at a different scale of reach (intimate → world → stars).
  const scope = TIER_SCOPE[tier] ?? TIER_SCOPE_FALLBACK;
  return [
    {
      id: `${actId}:open`,
      sense: "smell",
      intent: `open in the lived moment of ${scope.where}: sensory, immersive, the line's situation felt — never re-stating when/where`,
    },
    {
      id: `${actId}:rising`,
      sense: "touch",
      intent: `a pressure of ${scope.pressure} tests the line; a lighter, character-revealing fork`,
      decision: "secondary",
    },
    {
      id: `${actId}:midpoint`,
      sense: "sound",
      intent: `the stakes of ${scope.stakes} raise; another line's path may cross here (intersection)`,
    },
    {
      id: `${actId}:turn`,
      sense: "sight",
      intent: `the act's pivotal choice — how the line shapes (or is shaped by) ${scope.world} this generation`,
      decision: "major",
    },
    {
      id: `${actId}:close`,
      sense: "taste",
      intent: `the generation closes; what it passes to the heir as ${scope.inheritance}`,
    },
  ];
}

/** The shape of one tier's scope words. */
interface TierScope {
  where: string;
  pressure: string;
  stakes: string;
  world: string;
  inheritance: string;
}

/** Per-tier scope words that reframe the same scene arc at each scale of reach. */
const TIER_SCOPE: Record<number, TierScope> = {
  0: {
    where: "the crossing / first foothold",
    pressure: "survival and arrival",
    stakes: "belonging in a country that owes nothing",
    world: "the immigrant ward",
    inheritance: "a foothold and a name",
  },
  1: {
    where: "the new ground being worked",
    pressure: "establishing the household",
    stakes: "a stake in the local economy",
    world: "the town / neighborhood",
    inheritance: "a trade and standing",
  },
  2: {
    where: "the climb out of the working class",
    pressure: "ambition vs. loyalty",
    stakes: "the family's rise into comfort",
    world: "the city and its institutions",
    inheritance: "capital and connections",
  },
  3: {
    where: "a name that carries in the world",
    pressure: "power and its costs",
    stakes: "influence over the era's turns",
    world: "the nation",
    inheritance: "a dynasty's reputation",
  },
  4: {
    where: "the line as a world player",
    pressure: "scale and consequence",
    stakes: "shaping the century itself",
    world: "the globe and its systems",
    inheritance: "an empire of reach",
  },
  5: {
    where: "the reach for the stars",
    pressure: "humanity's next frontier",
    stakes: "the line's mark on the cosmos",
    world: "the colonized stars",
    inheritance: "a foothold beyond Earth",
  },
};

const TIER_SCOPE_FALLBACK: TierScope = TIER_SCOPE[0] as TierScope;

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
 * The ordered act scaffolds for a cell: one act per reach tier, each a generation's scene arc,
 * banded into the right macro-act. This is the complete bone-structure GenAI fleshes for a line.
 * Pure + deterministic.
 */
export function spineFor(cell: SpineCell): ActScaffold[] {
  return TIER_PLAN.map(({ tier, macroAct, title }) => {
    // The act id carries CLASS so a wave×archetype's poor + middle tracks coexist in one corpus.
    const actId = `act:${cell.wave}:${cell.archetype}:${cell.cls}:t${tier}`;
    return {
      id: actId,
      macroAct,
      tier,
      cls: cell.cls,
      title: `Act ${ROMAN[tier]} — ${title}`,
      scenes: sceneArc(actId, tier),
    };
  });
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

/** Every scene slot in a cell's spine, flat — the full set GenAI must flesh for that line. */
export function sceneSlotsFor(cell: SpineCell): SceneSlot[] {
  return spineFor(cell).flatMap((a) => a.scenes);
}

/** The reach tiers the spine covers (0..5) — used by the acceptance check that every cell is reachable. */
export const SPINE_TIERS = TIER_PLAN.map((t) => t.tier);
