/**
 * EI-2 SENSORY-PLACE-RESOLUTION (EMERGENT-INFANCY ONBOARDING).
 *
 * The opening replaces the 3-card region PICK with an EMERGENCE: the newborn's senses (what it hears /
 * smells / touches / tastes) crystallize into an awareness of ONE place. Spec:
 * docs/superpowers/specs/2026-06-23-emergent-infancy-onboarding-design.md.
 *
 * Pure + deterministic (sim purity): no DOM, no Date, no Math.random — RNG only via the injected facade.
 * Given the same seed + the same sequence of sensory-reaction taps, the resolved region is identical
 * (replay-safe). The player's taps NUDGE an already seed-leaning field; they never hard-pick a branch, so
 * we never need three competing Act-1 storylines — one place emerges.
 */

import type { FoundingRegion } from "../foundingOrigin";
import type { Rng } from "../rng";

/** The four newborn senses the opening surfaces. */
export type Sense = "sound" | "smell" | "touch" | "taste";

/** One sensory cue offered in the birth beat: a short diegetic line + which region it leans toward. */
export interface SenseCue {
  sense: Sense;
  /** The diegetic fragment the prose renders ("gulls, and a bell out on the grey water"). */
  text: string;
  /** The region this cue leans the newborn's emerging awareness toward. */
  leans: FoundingRegion;
}

/**
 * The sensory palette per region — grounded in each region's researched character (FOUNDING_REGIONS):
 * New England = cold coast / cod-and-brine / meetinghouse; Mid-Atlantic = port-and-mill / many tongues;
 * South = warm tobacco-and-rice country / river heat. One cue per sense per region.
 */
const REGION_CUES: Record<FoundingRegion, Record<Sense, string>> = {
  new_england: {
    sound: "gulls wheeling, and a meetinghouse bell carried over grey water",
    smell: "cod and brine, woodsmoke, the salt-damp of timber wharves",
    touch: "rough wool against the cold, a hard pew-straight cradle",
    taste: "salt on the lips, thin and clean",
  },
  mid_atlantic: {
    sound: "a dozen tongues in the street, dray-wheels and harbor cranes",
    smell: "river mud, ground wheat, tar from the great ports",
    touch: "good linen, a warm crowded room, coin pressed into a palm",
    taste: "bread and trade-sugar, plenty close at hand",
  },
  south: {
    sound: "cicadas over the tobacco rows, a far-off field holler",
    smell: "red earth, curing leaf, the green rot of the river bottoms",
    touch: "heat thick as a blanket, bare board floors, a wide veranda's shade",
    taste: "rice and warm milk, the iron tang of well water",
  },
};

const SENSES: readonly Sense[] = ["sound", "smell", "touch", "taste"];
const REGIONS: readonly FoundingRegion[] = ["new_england", "mid_atlantic", "south"];

/** The weight a cue the player ATTENDS adds toward its region (a nudge, not a hard pick). */
const ATTENDED_WEIGHT = 2;
/** The ambient weight every dealt cue contributes toward its region just by being present in the birth. */
const AMBIENT_WEIGHT = 1;

/**
 * Deal the birth beat's sensory cues: one cue per sense, each leaning toward a seed-chosen region, shuffled
 * so the four senses don't all point the same way (the field LEANS, the taps resolve). Deterministic from
 * the rng. The result is the set of cues the opening prose renders + offers as attend-taps.
 */
export function dealSenseCues(rng: Rng): SenseCue[] {
  // Pick a seed-leaning "home" region (the field tilts toward it) + a secondary, so the taps matter.
  const home = rng.fork("emergence:home").pick(REGIONS);
  const others = REGIONS.filter((r) => r !== home);
  const secondary = rng.fork("emergence:secondary").pick(others);
  // Assign each sense a region: bias toward home, some toward secondary, rarely the third — so attending a
  // given sense meaningfully shifts the outcome without any single tap dictating it.
  return SENSES.map((sense) => {
    const roll = rng.fork(`emergence:lean:${sense}`).chance(0.5);
    const leans: FoundingRegion = roll ? home : secondary;
    return { sense, text: REGION_CUES[leans][sense], leans };
  });
}

/**
 * Resolve the emergent region from the dealt cues + the senses the player ATTENDED (their reaction taps).
 * Every cue contributes its ambient weight; an attended cue contributes extra. The highest-weighted region
 * wins; ties break deterministically by REGIONS order (seed-stable). One place emerges — never a 3-way pick.
 */
export function resolvePlace(
  cues: readonly SenseCue[],
  attendedSenses: readonly Sense[],
): FoundingRegion {
  const attended = new Set(attendedSenses);
  const weight: Record<FoundingRegion, number> = {
    new_england: 0,
    mid_atlantic: 0,
    south: 0,
  };
  for (const cue of cues) {
    weight[cue.leans] += AMBIENT_WEIGHT + (attended.has(cue.sense) ? ATTENDED_WEIGHT : 0);
  }
  // Highest weight wins; deterministic tie-break by the fixed REGIONS order.
  let best: FoundingRegion = "new_england";
  for (const r of REGIONS) {
    if (weight[r] > weight[best]) best = r;
  }
  return best;
}
