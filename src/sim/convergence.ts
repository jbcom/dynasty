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

/**
 * FS-6b: the archetypal DESTINY of the ONE dynasty — the recognizable shape its power took on the way
 * to (or instead of) the stars. With one line (not 504 gated cells) we can name these as concrete fates
 * ([[founding-spine-pivot]]). A destiny COLORS the ending; the three STELLAR destinies (allies/colonies/
 * hidden) are the distinct star finales the spine's terminal `expansion` decision seeds.
 */
export type Destiny =
  | "religious_leader"
  | "communard"
  | "dictator"
  | "oligarch"
  | "crime_leader"
  | "media_mogul"
  // stellar finales (the terminal expansion gambit):
  | "stellar_allies"
  | "stellar_conquest"
  | "stellar_hidden"
  | "fallen"
  | "earthbound";

export interface ConvergenceEnding {
  id: string;
  destination: Destination;
  title: string;
  /** The archetypal destiny this ending embodies (FS-6b) — the named fate of the one dynasty. */
  destiny?: Destiny;
  /** The motivator gate a line must clear to reach this ending. */
  gate: Parameters<typeof meetsMotivatorGate>[1];
  /** Reach tier the line must have attained (0 personal … 5 interstellar) for a stars ending. */
  minTier?: number;
  /** CONVERGENCE-ENDING-DEPTH: a short earned finale (1-2 sentences) the LegacyReport narrates beneath the
   *  title — the dynasty's century-spanning arc resolved into prose, not just a label. */
  prose?: string;
}

/**
 * The ending lattice — the ONE dynasty's archetypal DESTINIES (FS-6b). The three STELLAR finales (the
 * terminal `expansion` gambit's options) come first + highest-gated; then the named earthly destinies the
 * line can crown itself with at high tier (religious leader / communard / dictator / oligarch / crime
 * leader / media mogul); then contributed / earthbound / extinguished fallbacks. First match in order wins.
 */
export const ENDINGS: readonly ConvergenceEnding[] = [
  // ── STELLAR FINALES (tier 5) — the three distinct fates among the stars (the expansion gambit) ──
  {
    id: "stars_conquest",
    destination: "stars",
    destiny: "stellar_conquest",
    title: "Empire of a Thousand Suns",
    // SEIZE COLONIES — power + low honor (conquest).
    gate: { power: { min: 45 }, honor: { max: 20 } },
    minTier: 5,
    prose:
      "From a colonial workshop to a thousand conquered suns, the name was carried outward by force and held by it — an empire that never asked the dark for permission, only took.",
  },
  {
    id: "stars_allies",
    destination: "stars",
    destiny: "stellar_allies",
    title: "The Covenant Among the Stars",
    // FORGE ALLIES — reach + honor (a commonwealth of worlds).
    gate: { reach: { min: 30 }, honor: { min: 0 } },
    minTier: 5,
    prose:
      "The line that began among immigrant strangers ended as the keeper of a covenant between worlds — its name trusted across light-years because, generation by generation, it had kept its word.",
  },
  {
    id: "stars_hidden",
    destination: "stars",
    destiny: "stellar_hidden",
    title: "Alone on a Quiet World",
    // GO QUIET + HIDDEN — a line that reaches a world far enough to draw no notice.
    gate: {},
    minTier: 5,
    prose:
      "Far enough out that no empire's charts would ever name it, the line set down its long burden and simply lived — the founding's hungers finally answered by a quiet horizon and no one left to impress.",
  },
  // ── EARTHLY ARCHETYPAL DESTINIES (high tier, didn't take the stars themselves) ──
  {
    id: "destiny_dictator",
    destination: "earthbound",
    destiny: "dictator",
    title: "The Dictator's Dynasty",
    gate: { power: { min: 50 }, honor: { max: 0 } },
    minTier: 3,
    prose:
      "The name became a fist closed around a nation — power held so tightly that no rival, and in the end no conscience, could pry it loose. The line ruled, and was feared, and never reached the stars it had stopped looking at.",
  },
  {
    id: "destiny_crime_leader",
    destination: "earthbound",
    destiny: "crime_leader",
    title: "The Family That Owned the Shadows",
    // The crime-planet-scale earthly fate ([[crime-power-axis]]): power + cunning, built outside the law.
    gate: { power: { min: 35 }, worldview: { max: -10 } },
    minTier: 3,
    prose:
      "Everything the family touched it touched from underneath — the courts, the unions, the men who counted the votes. The name never appeared on a door, and yet nothing of consequence happened without it.",
  },
  {
    id: "destiny_oligarch",
    destination: "earthbound",
    destiny: "oligarch",
    title: "The House That Owned the Age",
    gate: { wealth: { min: 50 } },
    minTier: 3,
    prose:
      "Fortune compounded across the generations until the family no longer chased the age but owned a piece of everything in it — a wealth so vast it became a kind of weather the whole country lived under.",
  },
  {
    id: "destiny_media_mogul",
    destination: "earthbound",
    destiny: "media_mogul",
    title: "The Voice of a Nation",
    gate: { reach: { min: 45 } },
    minTier: 3,
    prose:
      "From a colonial printing house to the signal every home received, the line never stopped controlling the story — and by the end the nation's idea of itself was, quietly, the family's to write.",
  },
  {
    id: "destiny_religious_leader",
    destination: "earthbound",
    destiny: "religious_leader",
    title: "The Prophet's Line",
    gate: { worldview: { max: -40 } },
    minTier: 3,
    prose:
      "What began as a single pulpit's conviction hardened into a faith that outlived its founders — the family's name spoken in prayer by people who never knew it had once been merely a name.",
  },
  {
    id: "destiny_communard",
    destination: "earthbound",
    destiny: "communard",
    title: "The People's Commonwealth",
    gate: { power: { max: -35 }, lineage: { min: 20 } },
    minTier: 3,
    prose:
      "The line gave away the power it might have hoarded, generation after generation, until what it left behind was not a dynasty at all but a commonwealth — its name dissolved, on purpose, into the people it had served.",
  },
  // ── CONTRIBUTED — you helped/were absorbed by another line's ascent ──
  {
    id: "contributed_ally",
    destination: "contributed",
    title: "Ally of the Victors",
    gate: { reach: { min: 20 } },
    minTier: 4,
    prose:
      "The line never reached the stars under its own name, but it stood beside the house that did — and the histories of that greater ascent are written, in the margins, in the family's hand.",
  },
  {
    id: "contributed_absorbed",
    destination: "contributed",
    title: "Absorbed into a Greater House",
    gate: {},
    minTier: 4,
    prose:
      "In the end the line was folded into a larger ascent — its blood and its fortune carried onward under another name. The family did not vanish so much as become a tributary of someone else's river to the stars.",
  },
  // ── EARTHBOUND — endured, never crowned a destiny nor left the cradle ──
  {
    id: "earthbound_legacy",
    destination: "earthbound",
    destiny: "earthbound",
    title: "A Quiet, Enduring Legacy",
    gate: { lineage: { min: 20 } },
    prose:
      "No empire, no stars — but the name endured, handed down intact through every hard century, so that descendants who would never know the founder still carried, unmistakably, the shape of the line.",
  },
  {
    id: "earthbound_twilight",
    destination: "earthbound",
    destiny: "earthbound",
    title: "An Earthbound Twilight",
    gate: {},
    prose:
      "The line held on, but the great reach never came; the founding's wide horizons narrowed, generation by generation, to a single quiet house on a single quiet world.",
  },
  // ── EXTINGUISHED — fell at some tier ──
  {
    id: "extinguished_ruin",
    destination: "extinguished",
    destiny: "fallen",
    title: "Ruin",
    gate: {},
    prose:
      "It ended in wreckage — fortune, standing, and name spent in a single ruinous fall, the long climb undone in less time than it took to begin.",
  },
  {
    id: "extinguished_no_heir",
    destination: "extinguished",
    destiny: "fallen",
    title: "The Line That Failed",
    gate: {},
    prose:
      "There was no one left to carry it. Whatever the line had built, it built for descendants who never came, and the name closed quietly over an empty cradle.",
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
 * Resolve a finished line to its archetypal DESTINY ending (FS-6b). Order of resolution:
 *  - not survived → extinguished (no-heir vs ruin);
 *  - reached interstellar tier with a motivators-cleared STELLAR finale → that finale (allies/conquest/hidden);
 *  - reached high tier with a cleared earthly DESTINY gate → that named destiny (dictator/oligarch/crime/…);
 *  - reached high tier while a rival got to the stars → contributed;
 *  - otherwise earthbound. Pure + deterministic; the FIRST matching lattice entry (in array order) wins.
 */
export function resolveConvergence(ctx: ConvergenceContext): ConvergenceEnding {
  if (!ctx.survived) {
    return (
      (ctx.hasHeir ? byId("extinguished_ruin") : byId("extinguished_no_heir")) ??
      byId("extinguished_ruin") ??
      ENDINGS[ENDINGS.length - 1]!
    );
  }
  // Stars: only at the interstellar tier — the three distinct stellar finales (hidden is the catch-all).
  if (ctx.tier >= 5) {
    const star = ENDINGS.find(
      (e) => e.destination === "stars" && meetsMotivatorGate(ctx.motivators, e.gate),
    );
    if (star) return star;
  }
  // Earthly archetypal DESTINY — a high-tier line that crowned itself a recognizable fate (FS-6b).
  if (ctx.tier >= 3) {
    const destiny = ENDINGS.find(
      (e) =>
        e.destiny !== undefined &&
        e.destination === "earthbound" &&
        e.destiny !== "earthbound" &&
        (e.minTier ?? 0) <= ctx.tier &&
        meetsMotivatorGate(ctx.motivators, e.gate),
    );
    if (destiny) return destiny;
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
  // Earthbound: endured but grounded — the plain legacy/twilight ends (NOT the named destinies, which
  // only fire at tier≥3 above; a low-tier survivor gets the quiet earthbound fate).
  const earth = ENDINGS.find(
    (e) =>
      e.destination === "earthbound" &&
      (e.destiny === undefined || e.destiny === "earthbound") &&
      meetsMotivatorGate(ctx.motivators, e.gate),
  );
  return earth ?? byId("earthbound_twilight") ?? byId("earthbound_legacy")!;
}

function byId(id: string): ConvergenceEnding | undefined {
  return ENDINGS.find((e) => e.id === id);
}

/** The dominant-motivator label that colors the ending prose (re-exported helper). */
export function endingColoring(m: Motivators): string {
  return dominantMotivator(m).pole;
}
