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
  /** The arc SHAPE this act takes (UQ-1) — drives its scene structure + per-arc generation prompting. */
  shape: ArcShape;
  scenes: SceneSlot[];
}

/**
 * ARC SHAPES (UQ-1) — distinct structural rhythms an act can take, so the 504-act lattice is NOT one
 * template stamped everywhere. Each shape varies scene COUNT, the SENSE rotation, the intent FRAMING,
 * and where the secondary decision sits. INVARIANTS every shape keeps: the FIRST scene is the `:open`
 * (drops us into the lived moment), the LAST scene is the `:close` carrying the dynastic succession
 * decision (the fork the engine reads), and the act's pivotal `:turn` is a MAJOR decision. Between those,
 * the shape's middle slots differ. GenAI fleshes each slot; per-arc prompting (genai-expand) varies the
 * voice + asks for SCANNABLE rhythm. The mid scene whose intent mentions an intersection is the braid
 * anchor (WV-1/2). Pure data.
 */
export type ArcShape = "rise" | "collapse" | "holding" | "reinvention" | "rivalry" | "windfall";
export const ARC_SHAPES: readonly ArcShape[] = [
  "rise",
  "collapse",
  "holding",
  "reinvention",
  "rivalry",
  "windfall",
];

/** A middle slot template: the id suffix, sense, an intent built from the tier scope, and any decision. */
interface MidSlot {
  suffix: string;
  sense: Sense;
  intent: (s: TierScope) => string;
  decision?: "secondary";
}

/** The middle scenes (between the fixed open and the close) for each arc shape. */
const ARC_MIDDLES: Record<ArcShape, MidSlot[]> = {
  // The climb — building momentum, an ally, a steady rise into the turn.
  rise: [
    {
      suffix: "push",
      sense: "touch",
      intent: (s) => `the line pushes against ${s.pressure}; a lighter, character-revealing fork`,
      decision: "secondary",
    },
    {
      suffix: "ally",
      sense: "sound",
      intent: (s) => `an ally or a rival line's path crosses at ${s.stakes} (intersection)`,
    },
  ],
  // The fall — fast + grim, fewer scenes, a sharp downward arc (more scannable).
  collapse: [
    {
      suffix: "crack",
      sense: "touch",
      intent: (s) =>
        `the first crack: ${s.pressure} turns against the line; a small choice that won't save it`,
      decision: "secondary",
    },
  ],
  // Endurance — slower, atmospheric, a generation that survives more than it achieves (white space).
  holding: [
    {
      suffix: "toil",
      sense: "touch",
      intent: (s) => `the long toil of ${s.pressure}; little changes but the cost accrues`,
    },
    {
      suffix: "drift",
      sense: "sound",
      intent: (s) =>
        `a quiet secondary choice as ${s.stakes} drift past; another line may pass through (intersection)`,
      decision: "secondary",
    },
    {
      suffix: "weight",
      sense: "smell",
      intent: (s) => `the weight of holding ${s.world} settles; what endures and what erodes`,
    },
  ],
  // The pivot — stuck, then a spark that hinges the generation toward a leap.
  reinvention: [
    {
      suffix: "stuck",
      sense: "touch",
      intent: (s) =>
        `the line is stuck against ${s.pressure}; a secondary fork that hints at another way`,
      decision: "secondary",
    },
    {
      suffix: "spark",
      sense: "sound",
      intent: (s) =>
        `a spark — a person, an idea, a crossing line — reframes ${s.stakes} (intersection)`,
    },
  ],
  // The contest — a crossing is STRUCTURAL: the other line is the act's spine, not incidental.
  rivalry: [
    {
      suffix: "meet",
      sense: "sound",
      intent: (s) =>
        `the line MEETS another at ${s.stakes} — the crossing that defines this generation (intersection)`,
    },
    {
      suffix: "maneuver",
      sense: "touch",
      intent: (s) => `maneuver against the other line; a secondary gambit`,
      decision: "secondary",
    },
  ],
  // The break — momentum up, a chance that must be seized or refused.
  windfall: [
    {
      suffix: "chance",
      sense: "sound",
      intent: (s) =>
        `a chance breaks open at ${s.stakes}; a crossing line may bring it (intersection)`,
      decision: "secondary",
    },
  ],
};

/**
 * Deterministically select an arc shape for a cell's act at a tier — a pure hash of
 * (wave, archetype, cls, tier) so the lattice spreads across shapes and a wave×archetype's six tiers
 * MIX shapes (not all "rise"). Tier-0 leans grounded (rise/holding); the hash provides the variety.
 */
export function arcShapeFor(cell: SpineCell, tier: number): ArcShape {
  const key = `${cell.wave}:${cell.archetype}:${cell.cls}:${tier}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Tier 0 (the founding) is grounded — rise or holding only; later tiers use the full set.
  if (tier === 0) return (h >>> 0) % 2 === 0 ? "rise" : "holding";
  const idx = (h >>> 0) % ARC_SHAPES.length;
  return ARC_SHAPES[idx] as ArcShape;
}

/**
 * The scene arc for an act, in its selected SHAPE. Fixed open + fixed close (succession), the shape's
 * middle slots between, and the pivotal MAJOR `:turn` before the close. The senses rotate so the chapter
 * is felt through different lenses; GenAI writes the prose/weave/decision options per slot.
 */
function sceneArc(actId: string, tier: number, shape: ArcShape): SceneSlot[] {
  const scope = TIER_SCOPE[tier] ?? TIER_SCOPE_FALLBACK;
  const open: SceneSlot = {
    id: `${actId}:open`,
    sense: "smell",
    intent: `open in the lived moment of ${scope.where} as a ${shape} generation: sensory, immersive, the line's situation felt — never re-stating when/where`,
  };
  const middles: SceneSlot[] = ARC_MIDDLES[shape].map((m) => ({
    id: `${actId}:${m.suffix}`,
    sense: m.sense,
    intent: m.intent(scope),
    ...(m.decision ? { decision: m.decision } : {}),
  }));
  const turn: SceneSlot = {
    id: `${actId}:turn`,
    sense: "sight",
    intent: `the act's pivotal choice — how the ${shape} of this generation shapes (or is shaped by) ${scope.world}`,
    decision: "major",
  };
  const close: SceneSlot = {
    id: `${actId}:close`,
    sense: "taste",
    intent: `the ${shape} generation closes; what it passes to the heir as ${scope.inheritance}`,
    // The close decision IS the dynastic fork: take a partner + raise heirs (advance the line) vs end it
    // here. Its options carry the `succession` effect the engine reads (sagaDriver.applyDecision →
    // advanceFamily). Always present, always "major" — the act's most consequential choice for the LINE.
    decision: "major",
  };
  return [open, ...middles, turn, close];
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
    const shape = arcShapeFor(cell, tier);
    return {
      id: actId,
      macroAct,
      tier,
      cls: cell.cls,
      // The title hints the shape so the chapter header itself varies across the lattice.
      title: `Act ${ROMAN[tier]} — ${title}`,
      shape,
      scenes: sceneArc(actId, tier, shape),
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
