/**
 * CONVERGENCE + ENDING LATTICE (Convergence Saga, SS-9).
 *
 * All lines move toward one horizon — colonizing the stars. Endings are SHARED convergence
 * states, not per-place snowflakes: a small set of DESTINATIONS × the line's dominant-motivator
 * COLORING × a benevolent/dark sub-variant, reached by different motivator paths and GATED by the
 * line's motivators (a Community/Tradition line CANNOT reach a Cunning-conquest stars ending; it
 * reaches its own convergence). The OTHER lines' fates fold into your ending. Pure + deterministic.
 */

import { dominantMotivator, type Motivators, meetsMotivatorGate } from "./motivators";

/** The shared convergence destinations every line aims at (or falls short of). */
export type Destination = "stars" | "contributed" | "earthbound" | "extinguished";

/** The motivator coloring of HOW a line reached the stars. */
export type StarColoring = "conquest" | "covenant" | "ascendancy" | "commonwealth";

export interface ConvergenceEnding {
  id: string;
  destination: Destination;
  title: string;
  /** The motivator gate a line must clear to reach this ending. */
  gate: Parameters<typeof meetsMotivatorGate>[1];
  /** Reach tier the line must have attained (0 personal … 5 interstellar) for a stars ending. */
  minTier?: number;
}

/** The ending lattice — ~18 convergence states (4 star colorings ×2 sub-variants + contributed/earthbound/extinguished). */
export const ENDINGS: readonly ConvergenceEnding[] = [
  // STARS — Conquest (power + cunning)
  {
    id: "stars_conquest_tyrant",
    destination: "stars",
    title: "Emperor of a Thousand Suns",
    gate: { power: { min: 50 }, honor: { min: 30 } },
    minTier: 5,
  },
  {
    id: "stars_conquest_benevolent",
    destination: "stars",
    title: "The Reluctant Sovereign of the Reach",
    gate: { power: { min: 50 }, honor: { min: -10, max: 30 } },
    minTier: 5,
  },
  // STARS — Covenant (faith)
  {
    id: "stars_covenant_prophet",
    destination: "stars",
    title: "The Covenant Carried Outward",
    gate: { worldview: { max: -40 }, reach: { min: 30 } },
    minTier: 5,
  },
  {
    id: "stars_covenant_zealot",
    destination: "stars",
    title: "The Theocracy Among the Stars",
    gate: { worldview: { max: -40 }, power: { min: 40 } },
    minTier: 5,
  },
  // STARS — Ascendancy (science + progress)
  {
    id: "stars_ascendancy_equals",
    destination: "stars",
    title: "Among the Stars, As Equals",
    gate: { worldview: { min: 40 }, tradition: { min: 30 } },
    minTier: 5,
  },
  {
    id: "stars_ascendancy_singularity",
    destination: "stars",
    title: "The Singularity's Heirs",
    gate: { worldview: { min: 60 }, lineage: { max: -20 } },
    minTier: 5,
  },
  // STARS — Commonwealth (community)
  {
    id: "stars_commonwealth_commons",
    destination: "stars",
    title: "The Star-Commonwealth",
    gate: { power: { max: -40 }, reach: { min: 20 } },
    minTier: 5,
  },
  {
    id: "stars_commonwealth_remnant",
    destination: "stars",
    title: "The People Who Kept Each Other",
    gate: { power: { max: -40 }, lineage: { min: 30 } },
    minTier: 5,
  },
  // CONTRIBUTED — you helped/were absorbed by another line's ascent
  {
    id: "contributed_ally",
    destination: "contributed",
    title: "Ally of the Victors",
    gate: { reach: { min: 20 } },
    minTier: 4,
  },
  {
    id: "contributed_absorbed",
    destination: "contributed",
    title: "Absorbed into a Greater House",
    gate: {},
    minTier: 4,
  },
  // EARTHBOUND — endured, never left the cradle
  {
    id: "earthbound_legacy",
    destination: "earthbound",
    title: "A Quiet, Enduring Legacy",
    gate: { lineage: { min: 20 } },
  },
  {
    id: "earthbound_twilight",
    destination: "earthbound",
    title: "An Earthbound Twilight",
    gate: {},
  },
  // EXTINGUISHED — fell at some tier
  { id: "extinguished_ruin", destination: "extinguished", title: "Ruin", gate: {} },
  {
    id: "extinguished_no_heir",
    destination: "extinguished",
    title: "The Line That Failed",
    gate: {},
  },
];

/** The line's final state the lattice reads. */
export interface ConvergenceContext {
  motivators: Motivators;
  /** Reach tier attained, 0..5. */
  tier: number;
  /** Did the line survive to a convergence (true) or fail/extinguish (false)? */
  survived: boolean;
  /** Did it produce an heir to carry on (false → no-heir ending)? */
  hasHeir: boolean;
  /** Whether ANY rival line reached the stars (folds the others' fates into your ending). */
  rivalsReachedStars: boolean;
}

/**
 * Resolve a finished line to its convergence ending. Order of resolution:
 *  - not survived → extinguished (no-heir vs ruin);
 *  - reached interstellar tier with a motivators-cleared star ending → that star ending (coloring);
 *  - reached high tier while a rival got to the stars → contributed;
 *  - otherwise earthbound. Pure + deterministic; the FIRST matching lattice entry (in priority order) wins.
 */
export function resolveConvergence(ctx: ConvergenceContext): ConvergenceEnding {
  if (!ctx.survived) {
    return (ctx.hasHeir ? byId("extinguished_ruin") : byId("extinguished_no_heir")) ?? ENDINGS[12]!;
  }
  // Stars: only if at the interstellar tier and a star gate clears.
  if (ctx.tier >= 5) {
    const star = ENDINGS.find(
      (e) => e.destination === "stars" && meetsMotivatorGate(ctx.motivators, e.gate),
    );
    if (star) return star;
  }
  // High tier but didn't make the stars yourself — did you ride another line there?
  if (ctx.tier >= 4) {
    if (ctx.rivalsReachedStars) {
      const contrib = ENDINGS.find(
        (e) => e.destination === "contributed" && meetsMotivatorGate(ctx.motivators, e.gate),
      );
      if (contrib) return contrib;
    }
  }
  // Earthbound: endured but grounded.
  const earth = ENDINGS.find(
    (e) => e.destination === "earthbound" && meetsMotivatorGate(ctx.motivators, e.gate),
  );
  return earth ?? byId("earthbound_twilight") ?? ENDINGS[11]!;
}

function byId(id: string): ConvergenceEnding | undefined {
  return ENDINGS.find((e) => e.id === id);
}

/** The dominant-motivator label that colors the ending prose (re-exported helper). */
export function endingColoring(m: Motivators): string {
  return dominantMotivator(m).pole;
}
