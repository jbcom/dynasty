/**
 * THE AUTHORED DYNASTY SPINE (FS-3) — the ONE line, founded at America's founding (1776) → the stars.
 *
 * This REPLACES the 504-cell `spineFor` generator (src/sim/spine.ts) as the unit of play. The generator
 * stamped ONE scene-skeleton + ONE decision template across every cell, which IS what made every story
 * read the same regardless of the line ([[founding-spine-pivot]], [[craft-spines-not-generator]]). Here
 * there is ONE line, and each ERA carries its OWN distinct DECISION ARCHITECTURE — the structural shape
 * of the choice differs era to era, not just the words. That is the anti-sameness mechanism: a
 * founding-era constitutional bargain is a *different kind of decision* than a Gilded-Age labor reckoning
 * than a modern media play than a stellar-expansion gambit.
 *
 * Pure data + pure selectors. No DOM, no RNG, no Date — the spine is deterministic; the engine walks it by
 * the line's accumulated state. GenAI fleshes each act's prose; the DECISION ARCHITECTURE here is the bones.
 */

import type { MacroAct } from "../macroActs";

/**
 * A DECISION ARCHITECTURE is the structural shape of an era's pivotal choice — NOT its prose. The kinds
 * are deliberately distinct so no two eras present the player the same shape of fork. This is the data
 * that breaks the 504× "the community stands at a crossroads → 3 generic options" template.
 *
 *  - bargain    : a founding-era COMPACT — you trade something now for a claim on the future (you give
 *                 the nation/your neighbors X to secure Y for the line). 2 sides + the cost named.
 *  - allegiance : pick a SIDE in a widening conflict (revolution, civil war, labor vs capital). The
 *                 options are factions; the choice is who you stand with when it splits.
 *  - venture    : a Gilded-Age/industrial WAGER — risk capital/standing on a bet whose payoff is gated
 *                 by the era's epoch (boom rewards the bold, bust ruins them). Risk tier is the axis.
 *  - succession : the dynastic FORK that ends a generation — who carries the line, and how (the engine
 *                 reads `succession.takesPartner`). Every act's CLOSE is this; preserved from the old model.
 *  - reckoning  : a modern moral RECKONING — the line's accumulated sins/debts come due (RICO, scandal,
 *                 a reckoning with how the wealth was made). Options = face it / bury it / weaponize it.
 *  - platform   : a media/mass-reach PLAY — shape the narrative itself (own the press, the airwaves, the
 *                 feed). Options differ by what truth you're willing to bend.
 *  - expansion  : a stellar-era GAMBIT — how the line reaches the stars (forge allies / seize colonies /
 *                 go quiet and hidden). The options are the seeds of the distinct stellar endings.
 *  - doctrine   : a worldview COMMITMENT — the line binds itself to a creed (faith, ideology, omertà,
 *                 a dynastic code) that gates later branches. Mutually-exclusive identity choice.
 */
export type DecisionArchitecture =
  | "bargain"
  | "allegiance"
  | "venture"
  | "succession"
  | "reckoning"
  | "platform"
  | "expansion"
  | "doctrine";

/** One authored act of the spine = one generation, in one era, with an ordered list of decision beats. */
export interface SpineAct {
  id: string;
  /** Generation index along the spine (0 = the founder at the founding). */
  gen: number;
  macroAct: MacroAct;
  /** The era label shown to the player (the meso chapter band). */
  era: string;
  /** Approximate in-world year the generation centers on (the spine clock anchors here). */
  year: number;
  /** The act's title shape (a fresh chapter title is authored per run; this is the register cue). */
  titleCue: string;
  /**
   * The act's decision beats, in order. The DISTINCT-ARCHITECTURE invariant: the act's PIVOTAL decision
   * (the non-succession one) uses this era's architecture, and NO two consecutive eras repeat the same
   * pivotal architecture (enforced by `assertEraDecisionVariety`). Every act ENDS on a `succession` beat.
   */
  beats: DecisionArchitecture[];
}

/**
 * THE SPINE — the authored generations, founding → stars. Each era's PIVOTAL beat (the one before the
 * closing `succession`) uses a DISTINCT architecture, so the player never meets the same shape of choice
 * twice running. This is hand-authored (not generated) — the whole point of FS-3.
 *
 * (Years are the generational centers; the spine clock advances ~one generation per act. The 1776 founder
 * → the stars across ~10 generations. Prose is GenAI-fleshed per act; these bones drive the structure +
 * the per-era prompt in scene generation.)
 */
export const DYNASTY_SPINE: readonly SpineAct[] = [
  // ── FOUNDING (1776–1859): the line is made at the nation's making ──
  {
    id: "spine:g0:founding",
    gen: 0,
    macroAct: "founding",
    era: "The Founding",
    year: 1776,
    titleCue: "The Compact",
    // A revolutionary chooses a SIDE, then strikes the founding BARGAIN that sets the line's claim.
    beats: ["allegiance", "bargain", "succession"],
  },
  {
    id: "spine:g1:earlyrepublic",
    gen: 1,
    macroAct: "founding",
    era: "The Early Republic",
    year: 1812,
    titleCue: "The Inheritance Tested",
    // The young line binds itself to a DOCTRINE (the creed it will carry) + a VENTURE on a raw economy.
    beats: ["doctrine", "venture", "succession"],
  },
  {
    id: "spine:g2:antebellum",
    gen: 2,
    macroAct: "founding",
    era: "The Gathering Storm",
    year: 1850,
    titleCue: "The House Divided",
    // The run-up to the Civil War: an ALLEGIANCE that splits the nation (distinct CONTEXT from g0's).
    beats: ["allegiance", "succession"],
  },
  // ── CONVERGENCE (1860–1899): the waves arrive + braid in; the line industrializes ──
  {
    id: "spine:g3:gildedage",
    gen: 3,
    macroAct: "convergence",
    era: "The Gilded Age",
    year: 1880,
    titleCue: "The Wager and the Ward",
    // The industrial WAGER — and the first wave-family BRANCH crossings braid in here.
    beats: ["venture", "succession"],
  },
  // ── EMERGENCE (1900–2040): the line stratifies, rises, reckons ──
  {
    id: "spine:g4:progressive",
    gen: 4,
    macroAct: "emergence",
    era: "The Reformer's Century",
    year: 1915,
    titleCue: "Labor and Capital",
    // A labor-vs-capital ALLEGIANCE in the Progressive/union era — a third allegiance CONTEXT.
    beats: ["allegiance", "succession"],
  },
  {
    id: "spine:g5:midcentury",
    gen: 5,
    macroAct: "emergence",
    era: "The American Century",
    year: 1955,
    titleCue: "The Reckoning",
    // The line's accumulated way-of-making-wealth comes due — a moral RECKONING (RICO/scandal/legacy).
    beats: ["reckoning", "succession"],
  },
  {
    id: "spine:g6:broadcast",
    gen: 6,
    macroAct: "emergence",
    era: "The Broadcast Age",
    year: 1985,
    titleCue: "The Narrative",
    // A media/mass-reach PLATFORM play — shape the story the country tells itself.
    beats: ["platform", "succession"],
  },
  {
    id: "spine:g7:networked",
    gen: 7,
    macroAct: "emergence",
    era: "The Networked World",
    year: 2015,
    titleCue: "The Feed",
    // The platform play DEEPENS into the algorithmic age — a DOCTRINE commitment for the digital line.
    beats: ["doctrine", "succession"],
  },
  // ── ASCENSION (2041+): the dynasty reaches for the stars ──
  {
    id: "spine:g8:orbital",
    gen: 8,
    macroAct: "ascension",
    era: "The Orbital Age",
    year: 2060,
    titleCue: "The First Reach",
    // The first off-world VENTURE — the gambit that opens the stellar branches.
    beats: ["venture", "succession"],
  },
  {
    id: "spine:g9:interstellar",
    gen: 9,
    macroAct: "ascension",
    era: "The Reach for the Stars",
    year: 2120,
    titleCue: "Among the Suns",
    // The terminal EXPANSION gambit — its options ARE the seeds of the distinct stellar endings
    // (forge allies / seize colonies / go quiet + hidden). No succession beat: the line arrives (or not).
    beats: ["expansion"],
  },
];

/** The act for a generation index (or undefined past the end of the spine). */
export function spineActForGen(gen: number): SpineAct | undefined {
  return DYNASTY_SPINE.find((a) => a.gen === gen);
}

/** The PIVOTAL decision architecture of an act = its first non-succession beat (the era's signature shape). */
export function pivotalArchitecture(act: SpineAct): DecisionArchitecture | undefined {
  return act.beats.find((b) => b !== "succession");
}

/**
 * THE ANTI-SAMENESS INVARIANT (FS-3): no two CONSECUTIVE acts share the same pivotal decision architecture.
 * `allegiance` recurs across the spine (revolution / civil war / labor), but never back-to-back, and each
 * use is a structurally-different CONTEXT (faction split vs. national rupture vs. class war). This is the
 * data-level guarantee that the player never meets the same SHAPE of choice twice running — the thing the
 * old single-template generator could not provide. Returns the offending gen pairs (empty = invariant holds).
 */
export function assertEraDecisionVariety(spine: readonly SpineAct[] = DYNASTY_SPINE): number[] {
  const offenders: number[] = [];
  for (let i = 1; i < spine.length; i++) {
    const prev = spine[i - 1];
    const cur = spine[i];
    if (!prev || !cur) continue;
    if (pivotalArchitecture(prev) === pivotalArchitecture(cur)) offenders.push(cur.gen);
  }
  return offenders;
}
